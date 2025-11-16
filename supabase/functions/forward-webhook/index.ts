// Edge Function: forward-webhook
// Forwards webhook requests to user-defined URLs securely

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const MAX_PAYLOAD_SIZE = 20000; // 20KB limit for payload JSON string
const MAX_RESPONSE_LENGTH = 50000; // 50KB limit to avoid huge responses

// CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookRequest {
  targetUrl: string;
  payload: any;
  signature?: string;
}

// Validate URL is proper http(s) format
function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[forward-webhook] Received request:', req.method);

    // Only allow POST requests
    if (req.method !== 'POST') {
      console.error('[forward-webhook] Invalid method:', req.method);
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Read request body as text first to check size
    const requestBodyText = await req.text();
    
    // Check payload size limit (20KB)
    if (requestBodyText.length > MAX_PAYLOAD_SIZE) {
      console.error('[forward-webhook] Payload too large:', requestBodyText.length, 'chars');
      return new Response(
        JSON.stringify({ 
          error: `Payload too large. Maximum ${MAX_PAYLOAD_SIZE} characters allowed.`,
          size: requestBodyText.length
        }),
        { 
          status: 413, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse JSON
    let requestBody: WebhookRequest;
    try {
      requestBody = JSON.parse(requestBodyText);
    } catch (parseError) {
      console.error('[forward-webhook] JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : String(parseError)
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { targetUrl, payload, signature } = requestBody;

    // Note: Do NOT log targetUrl to protect sensitive webhook URLs
    console.log('[forward-webhook] Processing webhook forward request');
    console.log('[forward-webhook] Payload keys:', Object.keys(payload || {}));

    // Validate inputs
    if (!targetUrl || typeof targetUrl !== 'string') {
      console.error('[forward-webhook] Missing or invalid targetUrl');
      return new Response(
        JSON.stringify({ error: 'targetUrl is required and must be a string' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (payload === undefined || payload === null) {
      console.error('[forward-webhook] Missing or invalid payload');
      return new Response(
        JSON.stringify({ error: 'payload is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate URL format
    if (!isValidHttpUrl(targetUrl)) {
      console.error('[forward-webhook] Invalid URL format');
      return new Response(
        JSON.stringify({ error: 'targetUrl must be a valid http:// or https:// URL' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare headers for forwarded request
    const forwardHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Clolabs-Forward': '1',
      'User-Agent': 'CloLabs-Webhook-Forwarder/1.0',
    };

    // Add signature if provided (for future webhook signing)
    if (signature) {
      forwardHeaders['X-Clolabs-Signature'] = signature;
    }

    // Forward the webhook
    console.log('[forward-webhook] Forwarding webhook request');
    const startTime = Date.now();

    const webhookResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    const duration = Date.now() - startTime;
    console.log('[forward-webhook] Response received in', duration, 'ms');
    console.log('[forward-webhook] Status:', webhookResponse.status);

    // Read response with size limit
    const responseText = await webhookResponse.text();
    const truncatedResponse = responseText.length > MAX_RESPONSE_LENGTH
      ? responseText.substring(0, MAX_RESPONSE_LENGTH) + '... (truncated)'
      : responseText;

    console.log('[forward-webhook] Response length:', responseText.length);

    // Return success response with simplified structure
    return new Response(
      JSON.stringify({
        ok: webhookResponse.ok,
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
        text: truncatedResponse,
        duration,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[forward-webhook] Error:', error);
    
    // Handle timeout errors
    if (error instanceof Error && error.name === 'TimeoutError') {
      return new Response(
        JSON.stringify({
          error: 'Request timeout. Target webhook did not respond within 30 seconds.',
          type: 'timeout'
        }),
        {
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle network errors
    if (error instanceof TypeError) {
      return new Response(
        JSON.stringify({
          error: 'Network error. Unable to connect to target webhook.',
          details: error.message,
          type: 'network'
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to forward webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'unknown'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
