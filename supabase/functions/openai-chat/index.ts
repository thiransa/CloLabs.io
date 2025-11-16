// Supabase Edge Function: openai-chat
// Secure proxy for OpenAI Chat Completions API
// Keeps API key server-side only

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_REQUEST_SIZE = 50000; // 50KB limit for request body
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Pricing per 1K tokens
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
};

function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-3.5-turbo'];
  return (promptTokens / 1000) * pricing.input + (completionTokens / 1000) * pricing.output;
}

async function logAIRequest(data: any) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseKey) return;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from('ai_requests').insert(data);
  } catch (err) {
    console.error('[logAIRequest] Failed:', err);
  }
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[openai-chat] Received request:', req.method);

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('[openai-chat] OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured on server',
          message: 'Please set OPENAI_API_KEY in Supabase secrets'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Read and validate request size
    const requestBodyText = await req.text();
    if (requestBodyText.length > MAX_REQUEST_SIZE) {
      console.error('[openai-chat] Request too large:', requestBodyText.length);
      return new Response(
        JSON.stringify({ 
          error: 'Request too large',
          message: `Maximum request size is ${MAX_REQUEST_SIZE} characters`,
          size: requestBodyText.length
        }),
        { 
          status: 413, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse JSON
    let chatRequest: ChatRequest;
    try {
      chatRequest = JSON.parse(requestBodyText);
    } catch (parseError) {
      console.error('[openai-chat] JSON parse error:', parseError);
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

    // Validate messages array
    if (!chatRequest.messages || !Array.isArray(chatRequest.messages)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request',
          message: 'messages field is required and must be an array'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (chatRequest.messages.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request',
          message: 'messages array cannot be empty'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate message format
    for (const message of chatRequest.messages) {
      if (!message.role || !message.content) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid message format',
            message: 'Each message must have role and content fields'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (!['system', 'user', 'assistant'].includes(message.role)) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid message role',
            message: 'Role must be one of: system, user, assistant'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Prepare OpenAI request
    const openaiRequest = {
      model: chatRequest.model || 'gpt-3.5-turbo',
      messages: chatRequest.messages,
      temperature: chatRequest.temperature ?? 0.7,
      max_tokens: chatRequest.max_tokens ?? 1000
    };

    console.log('[openai-chat] Calling OpenAI API');
    console.log('[openai-chat] Model:', openaiRequest.model);
    console.log('[openai-chat] Messages count:', openaiRequest.messages.length);

    const startTime = Date.now();

    // Call OpenAI API
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(openaiRequest)
    });

    const duration = Date.now() - startTime;
    console.log('[openai-chat] OpenAI response:', openaiResponse.status, `(${duration}ms)`);

    // Handle OpenAI API errors
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('[openai-chat] OpenAI API error:', errorData);
      
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API error',
          message: errorData.error?.message || 'Unknown error from OpenAI',
          status: openaiResponse.status,
          details: errorData
        }),
        { 
          status: openaiResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse and return successful response
    const responseData = await openaiResponse.json();
    
    console.log('[openai-chat] Success! Tokens used:', responseData.usage);

    // Log request to database
    if (responseData.usage) {
      const cost = calculateCost(
        openaiRequest.model,
        responseData.usage.prompt_tokens,
        responseData.usage.completion_tokens
      );
      
      await logAIRequest({
        model: openaiRequest.model,
        prompt_summary: chatRequest.messages[chatRequest.messages.length - 1]?.content?.substring(0, 200) || '',
        tokens_used: responseData.usage.total_tokens,
        cost_estimate: cost,
        status: 'success',
        function_name: 'openai-chat'
      });
    }

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[openai-chat] Unexpected error:', error);
    
    // Log error to database
    await logAIRequest({
      model: 'unknown',
      prompt_summary: 'Error occurred',
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      function_name: 'openai-chat'
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
