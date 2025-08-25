// functions/submit-receipt/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const klippaApiKey = Deno.env.get('KLIPPA_API_KEY')!

interface OCRResult {
  retailer: string
  date: string
  total: number
  confidence: number
  items?: Array<{
    description: string
    amount: number
  }>
}

async function processWithKlippa(imageUrl: string): Promise<OCRResult> {
  const klippaUrl = 'https://custom-ocr.klippa.com/api/v1/parseDocument'
  
  const response = await fetch(klippaUrl, {
    method: 'POST',
    headers: {
      'X-Auth-Key': klippaApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: imageUrl,
      template: 'financial_document'
    })
  })

  if (!response.ok) {
    throw new Error('Klippa OCR failed')
  }

  const result = await response.json()
  
  // Map Klippa response to our format
  return {
    retailer: result.data?.merchant_name || 'Unknown Store',
    date: result.data?.date || new Date().toISOString().split('T')[0],
    total: result.data?.amount_total || 0,
    confidence: result.data?.confidence || 0.5,
    items: result.data?.line_items?.map((item: any) => ({
      description: item.description || '',
      amount: item.amount || 0
    })) || []
  }
}

function generateTextFingerprint(retailer: string, date: string, totalCents: number): string {
  const normalized = retailer.toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${normalized}|${date}|${totalCents}`
}

function calculateConfidence(ocrResult: OCRResult): number {
  let confidence = ocrResult.confidence || 0.5
  
  // Boost confidence if we have good data
  if (ocrResult.retailer && ocrResult.retailer !== 'Unknown Store') confidence += 0.2
  if (ocrResult.total > 0) confidence += 0.1
  if (ocrResult.date && ocrResult.date !== new Date().toISOString().split('T')[0]) confidence += 0.1
  
  return Math.min(confidence, 1.0)
}

export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image_path } = await req.json()
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // Get signed URL for the image
    const { data: urlData, error: urlError } = await supabase.storage
      .from('receipts-original')
      .createSignedUrl(image_path, 3600) // 1 hour expiry

    if (urlError) {
      throw new Error('Failed to get image URL')
    }

    // Process with Klippa OCR
    console.log('Processing receipt with Klippa OCR...')
    const ocrResult = await processWithKlippa(urlData.signedUrl)
    
    // Generate fingerprints for duplicate detection
    const totalCents = Math.round(ocrResult.total * 100)
    const textFingerprint = generateTextFingerprint(ocrResult.retailer, ocrResult.date, totalCents)
    
    // Calculate final confidence and status
    const confidence = calculateConfidence(ocrResult)
    let status: 'processing' | 'queued' | 'approved' | 'rejected'
    
    if (confidence >= 0.8) {
      status = 'approved'
    } else if (confidence < 0.5) {
      status = 'rejected'
    } else {
      status = 'queued'
    }

    // Insert receipt record
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        user_id: user.id,
        image_key: image_path,
        ocr_json: ocrResult,
        retailer: ocrResult.retailer,
        purchase_date: ocrResult.date,
        total_cents: totalCents,
        hash_img: '', // TODO: Implement pHash
        hash_text: textFingerprint,
        confidence: confidence,
        status: status
      })
      .select('id,status')
      .single()

    if (receiptError) {
      // Check if it's a duplicate
      if (receiptError.code === '23505') {
        return new Response(
          JSON.stringify({
            success: false,
            status: 'duplicate',
            message: 'This receipt has already been submitted'
          }),
          { 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }
      throw new Error('Failed to save receipt')
    }

    // If approved, award points
    if (status === 'approved') {
      const { error: pointsError } = await supabase.rpc('award_points_for_receipt', {
        rid: receipt.id
      })
      
      if (pointsError) {
        console.error('Failed to award points:', pointsError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        receipt_id: receipt.id,
        status: receipt.status,
        points_awarded: status === 'approved' ? Math.floor(totalCents / 100) : 0,
        message: status === 'approved' ? 'Receipt approved and points awarded!' : 
                 status === 'queued' ? 'Receipt submitted for review' : 
                 'Receipt could not be processed'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error: any) {
    console.error('Submit receipt error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
}
