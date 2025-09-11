// supabase> functions> submit-receipt> index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Helper: Normalize retailer name for fingerprint
const normalizeRetailer = (name)=>{
  if (!name) return 'unknown';
  return name.toLowerCase().replace(/[^\w\s]/g, '') // Remove special chars
  .replace(/\s+/g, '') // Remove spaces
  .replace(/(express|store|mart|center|super|branch)/g, '');
};
// Helper: Create text fingerprint
const createTextFingerprint = (retailer, date, totalCents)=>{
  const normalizedRetailer = normalizeRetailer(retailer);
  const formattedDate = date.split('T')[0]; // YYYY-MM-DD format
  return `${normalizedRetailer}|${formattedDate}|${totalCents}`;
};
// Helper: Simple image hash (using basic string hash)
const createImageHash = (imagePath)=>{
  // Simple hash based on image path and timestamp
  const timestamp = Date.now();
  return `img_${imagePath.split('/').pop()}_${timestamp}`.substring(0, 16);
};
// Process with Open AI API
const processWithOpenAI = async (imageUrl)=>{
  console.log('🤖 Starting OpenAI Vision processing...');
  console.log('📸 Image URL provided:', imageUrl ? 'YES' : 'NO');
  
  const OPENAI_API_KEY = Deno.env.get('OPEN_AI_API_KEY');
  console.log('🔑 OpenAI API Key available:', OPENAI_API_KEY ? 'YES (length: ' + OPENAI_API_KEY.length + ')' : 'NO');
  
  if (!OPENAI_API_KEY) {
    console.error('❌ OPEN_AI_API_KEY not configured in environment variables');
    throw new Error('OPEN_AI_API_KEY not configured');
  }
  try {
    // Get image as base64 (same as Gemini)
    console.log('📥 Fetching image from URL...');
    const imageResponse = await fetch(imageUrl);
    console.log('📥 Image fetch response status:', imageResponse.status);
    
    const imageBlob = await imageResponse.blob();
    console.log('📥 Image blob size:', imageBlob.size, 'bytes');
    
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    console.log('📥 Image converted to base64, length:', base64.length);
    // OpenAI Vision API prompt (same structure as Gemini)
    const prompt = `Analyze this receipt image and extract the following information in JSON format:
    {
      "retailer": "store/restaurant name",
      "date": "YYYY-MM-DD format",
      "total": "total amount as number (no currency symbol)",
      "currency": "PKR or USD",
      "invoice_number": "invoice/receipt number if visible",
      "payment_method": "cash/card/other",
      "items": [{"name": "item name", "price": number}],
      "confidence": "0.0 to 1.0 confidence score"
    }
    
    Rules:
    - Return ONLY valid JSON, no explanations
    - Use USD as default currency if not clear
    - Set confidence based on clarity (1.0 = very clear, 0.5 = readable, 0.1 = poor quality)
    - If date is unclear, use today's date
    - Total must be a number only (no commas or symbols)`;
    // Call OpenAI Vision API
    console.log('🚀 Calling OpenAI Vision API...');
    console.log('🚀 Using model: gpt-4o');
    console.log('🚀 Max tokens: 1024');
    console.log('🚀 Temperature: 0.1');
    
    const requestPayload = {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
                detail: "high" // For better OCR accuracy
              }
            }
          ]
        }
      ],
      max_tokens: 1024,
      temperature: 0.1 // Same as Gemini for consistency
    };
    
    console.log('🚀 Request payload prepared, making API call...');
    const startTime = Date.now();
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });
    
    const endTime = Date.now();
    console.log('⏱️ OpenAI API call completed in', endTime - startTime, 'ms');
    if (!openaiResponse.ok) {
      console.error('❌ OpenAI API error status:', openaiResponse.status);
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI API error response:', errorText);
      throw new Error('OpenAI API failed with status: ' + openaiResponse.status);
    }
    
    console.log('✅ OpenAI API call successful, parsing response...');
    const openaiData = await openaiResponse.json();
    
    // Log usage information if available
    if (openaiData.usage) {
      console.log('💰 Token usage - Prompt tokens:', openaiData.usage.prompt_tokens);
      console.log('💰 Token usage - Completion tokens:', openaiData.usage.completion_tokens);
      console.log('💰 Token usage - Total tokens:', openaiData.usage.total_tokens);
    }
    
    console.log('📄 OpenAI response data:', JSON.stringify(openaiData, null, 2));
    // Extract JSON from response (same logic as Gemini)
    const textContent = openaiData.choices?.[0]?.message?.content || '';
    console.log('🔍 Extracted text content from OpenAI:', textContent);
    
    // Clean and parse JSON (same as Gemini)
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in OpenAI response');
      throw new Error('No JSON found in OpenAI response');
    }
    
    console.log('🔍 Found JSON match:', jsonMatch[0]);
    const ocrData = JSON.parse(jsonMatch[0]);
    console.log('✅ Successfully parsed OCR data:', JSON.stringify(ocrData, null, 2));
    
    return ocrData;
  } catch (error) {
    console.error('❌ OpenAI processing error:', error);
    console.error('❌ Error details:', error.message);
    
    // Return same fallback data as Gemini
    const fallbackData = {
      retailer: 'Unknown Store',
      date: new Date().toISOString().split('T')[0],
      total: '0',
      currency: 'PKR',
      confidence: 0.1, // Low confidence but will still be queued, not rejected
      error: 'AI processing failed, will be manually reviewed'
    };
    
    console.log('⚠️ Returning fallback OCR data (will be queued):', JSON.stringify(fallbackData, null, 2));
    return fallbackData;
  }
};
// Main function
Deno.serve(async (req)=>{
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  console.log('🔧 Environment check - Supabase URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.log('🔧 Environment check - Supabase Service Key:', supabaseServiceKey ? 'SET (length: ' + supabaseServiceKey.length + ')' : 'NOT SET');
  
  try {
    const { image_path } = await req.json();
    console.log('📋 Processing receipt request for image:', image_path);
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized: ' + userError?.message);
    }
    console.log('User authenticated:', user.id);
    // Get signed URL for the image
    const { data: signedUrlData, error: urlError } = await supabase.storage.from('receipts-original').createSignedUrl(image_path, 60); // 60 seconds expiry
    if (urlError || !signedUrlData) {
      throw new Error('Could not get image URL: ' + urlError?.message);
    }
    console.log('✅ Got signed URL for image processing');
    
    // Process with OpenAI
    console.log('🤖 Starting AI processing with OpenAI...');
    const ocrData = await processWithOpenAI(signedUrlData.signedUrl);
    console.log('✅ AI processing completed successfully');
    // Parse and validate OCR data
    console.log('📊 Parsing OCR data...');
    const retailer = ocrData.retailer || 'Unknown Store';
    const purchaseDate = ocrData.date || new Date().toISOString().split('T')[0];
    const totalAmount = parseFloat(ocrData.total || '0');
    const totalCents = Math.round(totalAmount * 100);
    const confidence = ocrData.confidence || 0.5;
    const currency = ocrData.currency || 'USD';
    const invoiceNumber = ocrData.invoice_number || `INV-${Date.now().toString().slice(-8)}`;
    
    console.log('📊 Parsed data - Retailer:', retailer);
    console.log('📊 Parsed data - Date:', purchaseDate);
    console.log('📊 Parsed data - Total:', totalAmount, currency);
    console.log('📊 Parsed data - Confidence:', confidence);
    console.log('📊 Parsed data - Invoice:', invoiceNumber);
    // Create text fingerprint
    const textFingerprint = createTextFingerprint(retailer, purchaseDate, totalCents);
    // Create image hash
    const imageHash = createImageHash(image_path);
    // Check for duplicate using text fingerprint
    const { data: duplicateCheck, error: dupError } = await supabase
      .from('receipts')
      .select('id')
      .eq('hash_text', textFingerprint)
      .eq('user_id', user.id)
      .single();
    
    // Only treat as duplicate if we actually found a record AND no error occurred
    if (duplicateCheck && !dupError) {
      console.log('Duplicate receipt detected for user:', user.id);
      return new Response(JSON.stringify({
        success: false,
        status: 'duplicate',
        message: 'This receipt has already been submitted',
        receipt_id: duplicateCheck.id
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    // Determine status based on confidence
    console.log('🔍 Determining receipt status based on confidence:', confidence);
    // ALL receipts go to queue for manual review - no auto-approval to avoid any rejection
    let status = 'queued'; // Always queue for manual review
    console.log('⏳ Status: QUEUED (all receipts require manual review to avoid rejection)');
    
    // Note: Removed auto-approval to ensure no receipts get rejected
    // Admin can approve manually after review
    // Save receipt to database
    const receiptData = {
      user_id: user.id,
      image_key: image_path,
      retailer: retailer,
      purchase_date: purchaseDate,
      total_cents: totalCents,
      status: status,
      confidence: confidence,
      invoice_number: invoiceNumber,
      currency: currency,
      payment_method: ocrData.payment_method || 'unknown',
      hash_text: textFingerprint,
      hash_img: imageHash,
      ocr_json: ocrData
    };
    console.log('Saving receipt:', receiptData);
    const { data: receipt, error: dbError } = await supabase.from('receipts').insert(receiptData).select().single();
    if (dbError) {
      console.error('DB Error:', dbError);
      throw new Error('Database error: ' + dbError.message);
    }
    console.log('Receipt saved:', receipt.id);
    // Award points if approved
    let pointsAwarded = 0;
    if (status === 'approved' && totalCents > 0) {
      // Calculate points (1 point per 100 cents = 1 PKR)
      pointsAwarded = Math.floor(totalCents / 100);
      // Get current balance
      const { data: balanceData } = await supabase.from('points_ledger').select('balance_after').eq('user_id', user.id).order('created_at', {
        ascending: false
      }).limit(1).single();
      const currentBalance = balanceData?.balance_after || 0;
      // Add points to ledger
      const { error: pointsError } = await supabase.from('points_ledger').insert({
        user_id: user.id,
        receipt_id: receipt.id,
        delta: pointsAwarded,
        reason: `Receipt - ${retailer}`,
        balance_after: currentBalance + pointsAwarded
      });
      if (pointsError) {
        console.error('Points error:', pointsError);
      } else {
        console.log('Points awarded:', pointsAwarded);
      }
    }
    // Return success response
    const responseData = {
      success: true,
      receipt_id: receipt.id,
      status: status,
      points_awarded: pointsAwarded,
      retailer: retailer,
      total: totalAmount,
      currency: currency,
      confidence: confidence,
      message: status === 'approved' ? `Receipt approved! You earned ${pointsAwarded} points` : 'Receipt submitted for review (will be processed within 24 hours)'
    };
    console.log('🎯 Final response prepared:', JSON.stringify(responseData, null, 2));
    console.log('📤 Sending response to client...');
    
    return new Response(JSON.stringify(responseData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Receipt processing failed:', error);
    console.error('❌ Error message:', error.message);
    
    // Check if it's an environment issue
    if (error.message?.includes('OPEN_AI_API_KEY')) {
      console.error('🔧 Environment Issue: OpenAI API key is missing or invalid');
      console.error('🔧 Please check that OPEN_AI_API_KEY is set in your Supabase environment variables');
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'An error occurred',
      status: 'error'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200 // Return 200 even for errors to avoid CORS issues
    });
  }
});
