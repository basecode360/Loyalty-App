import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!

// Gemini OCR function
async function processWithGemini(imageUrl: string): Promise<any> {
  try {
    // Download image and convert to base64
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`

    const prompt = `
      Analyze this Pakistani receipt and extract data in JSON format.
      
      Common Pakistani retailers:
      - Petrol: PSO, Shell, Total, HBL stations
      - Supermarkets: Imtiaz, Carrefour, Metro
      - Restaurants: KFC, McDonald's, local
      
      Return ONLY valid JSON:
      {
        "retailer": "store name",
        "retailer_type": "fuel/grocery/restaurant/pharmacy/other",
        "purchase_date": "YYYY-MM-DD",
        "total_amount": number (no currency),
        "currency": "PKR",
        "invoice_number": "if visible",
        "payment_method": "cash/card/jazzcash/easypaisa",
        "card_last_digits": "if card payment",
        "confidence": 0-100,
        "items": [{"name": "item", "price": 0}]
      }
    `

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }]
      })
    })

    const result = await response.json()
    const textResponse = result.candidates[0].content.parts[0].text

    // Clean and parse JSON
    const jsonStr = textResponse.replace(/```json|```/g, '').trim()
    return JSON.parse(jsonStr)

  } catch (error) {
    console.error('Gemini OCR error:', error)
    throw new Error('OCR processing failed')
  }
}

// Generate fingerprint for duplicate detection
function generateFingerprint(retailer: string, date: string, totalCents: number, invoice?: string): string {
  const normalized = retailer.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (invoice) {
    return `${normalized}|${date}|${totalCents}|${invoice}`
  }
  return `${normalized}|${date}|${totalCents}`
}

export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image_path } = await req.json()

    // Get auth token and user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Authentication required')
    }

    console.log(`Processing receipt for user: ${user.id}`)

    // Get signed URL for image
    const { data: urlData, error: urlError } = await supabase.storage
      .from('receipts-original')
      .createSignedUrl(image_path, 300) // 5 min expiry

    if (urlError) throw new Error('Failed to get image URL')

    // Process with Gemini
    console.log('🤖 Processing with Gemini AI...')
    const ocrResult = await processWithGemini(urlData.signedUrl)

    // Convert to cents for Pakistani Rupees
    const totalCents = Math.round((ocrResult.total_amount || 0) * 100)

    // Generate fingerprint
    const fingerprint = generateFingerprint(
      ocrResult.retailer || 'Unknown',
      ocrResult.purchase_date || new Date().toISOString().split('T')[0],
      totalCents,
      ocrResult.invoice_number
    )

    // Determine status based on confidence
    const confidence = (ocrResult.confidence || 50) / 100
    let status = 'queued'

    if (confidence >= 0.8) {
      status = 'approved'
    } else if (confidence < 0.3) {
      status = 'rejected'
    }

    // Special handling for known retailers
    if (ocrResult.retailer_type === 'fuel' && confidence >= 0.6) {
      status = 'approved' // Auto-approve fuel receipts with decent confidence
    }

    // Insert receipt record
    const { data: receipt, error: insertError } = await supabase
      .from('receipts')
      .insert({
        user_id: user.id,
        image_key: image_path,
        ocr_json: ocrResult,
        ocr_provider: 'gemini',
        retailer: ocrResult.retailer || 'Unknown',
        retailer_type: ocrResult.retailer_type || 'other',
        purchase_date: ocrResult.purchase_date || new Date().toISOString().split('T')[0],
        total_cents: totalCents,
        currency: ocrResult.currency || 'PKR',
        invoice_number: ocrResult.invoice_number,
        payment_method: ocrResult.payment_method,
        card_last_four: ocrResult.card_last_digits,
        hash_text: fingerprint,
        confidence: confidence,
        status: status
      })
      .select()
      .single()

    if (insertError) {
      // Check for duplicate
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({
            success: false,
            status: 'duplicate',
            message: 'Ye receipt pehle submit ho chuki hai'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw new Error('Failed to save receipt: ' + insertError.message)
    }

    // Award points if approved
    let pointsAwarded = 0
    if (status === 'approved') {
      await supabase.rpc('award_points_for_receipt', { receipt_id: receipt.id })
      pointsAwarded = Math.floor(totalCents / 100) // 1 point per 100 PKR

      // Bonus for fuel receipts
      if (ocrResult.retailer_type === 'fuel') {
        pointsAwarded = Math.floor(pointsAwarded * 1.5) // 50% bonus on fuel
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        receipt_id: receipt.id,
        status: status,
        points_awarded: pointsAwarded,
        retailer: ocrResult.retailer,
        total: totalCents / 100,
        message: status === 'approved'
          ? `Receipt approved! ${pointsAwarded} points mile hain`
          : status === 'queued'
            ? 'Receipt review ke liye queue mein hai'
            : 'Receipt process nahi ho saki'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Submit receipt error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}
