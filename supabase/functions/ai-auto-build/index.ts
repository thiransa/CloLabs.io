// Supabase Edge Function: ai-auto-build
// Generates workflow structure from natural language prompt
// Uses strict JSON schema enforcement

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_REQUEST_SIZE = 10000; // 10KB limit for prompt
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

// Strict JSON schema for workflow structure
const WORKFLOW_SCHEMA = {
  type: 'object',
  required: ['nodes', 'edges'],
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'type', 'label'],
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['trigger', 'action', 'condition', 'delay'] },
          label: { type: 'string' },
          data: { type: 'object' }
        }
      }
    },
    edges: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'source', 'target'],
        properties: {
          id: { type: 'string' },
          source: { type: 'string' },
          target: { type: 'string' }
        }
      }
    }
  }
};

// System prompt for strict JSON output
const SYSTEM_PROMPT = `You are a workflow automation expert that generates workflow structures in JSON format ONLY.

STRICT RULES:
1. Output ONLY valid JSON - no markdown, no code blocks, no explanations
2. Follow this exact schema:
{
  "name": "Workflow Name",
  "description": "Brief description",
  "nodes": [
    {
      "id": "node-1",
      "type": "trigger|action|condition|delay",
      "label": "Node Label",
      "data": {}
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2"
    }
  ]
}

Node types:
- trigger: Starts the workflow (webhook, schedule, manual)
- action: Performs an action (API call, send email, webhook post)
- condition: Decision point (if/else logic)
- delay: Wait for a duration

Guidelines:
- Use sequential IDs: node-1, node-2, etc.
- Connect nodes logically with edges
- Keep workflows simple and practical
- Always start with a trigger node
- Label nodes clearly and descriptively

DO NOT include markdown formatting, code blocks, or any text outside the JSON.`;

// Validate workflow structure
function validateWorkflowStructure(data) {
  const errors = [];

  // Check required fields
  if (!data.nodes || !Array.isArray(data.nodes)) {
    errors.push('Missing or invalid "nodes" array');
  }
  if (!data.edges || !Array.isArray(data.edges)) {
    errors.push('Missing or invalid "edges" array');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validate nodes
  const nodeIds = new Set();
  for (let i = 0; i < data.nodes.length; i++) {
    const node = data.nodes[i];
    if (!node.id || typeof node.id !== 'string') {
      errors.push(`Node ${i}: missing or invalid "id"`);
    } else {
      nodeIds.add(node.id);
    }
    if (!node.type || !['trigger', 'action', 'condition', 'delay'].includes(node.type)) {
      errors.push(`Node ${i}: invalid "type" - must be trigger, action, condition, or delay`);
    }
    if (!node.label || typeof node.label !== 'string') {
      errors.push(`Node ${i}: missing or invalid "label"`);
    }
  }

  // Validate edges
  for (let i = 0; i < data.edges.length; i++) {
    const edge = data.edges[i];
    if (!edge.id || typeof edge.id !== 'string') {
      errors.push(`Edge ${i}: missing or invalid "id"`);
    }
    if (!edge.source || !nodeIds.has(edge.source)) {
      errors.push(`Edge ${i}: invalid "source" - node "${edge.source}" does not exist`);
    }
    if (!edge.target || !nodeIds.has(edge.target)) {
      errors.push(`Edge ${i}: invalid "target" - node "${edge.target}" does not exist`);
    }
  }

  return errors.length === 0 
    ? { valid: true, errors: [] }
    : { valid: false, errors };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[ai-auto-build] Received request:', req.method);

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

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('[ai-auto-build] OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured on server'
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
      console.error('[ai-auto-build] Request too large:', requestBodyText.length);
      return new Response(
        JSON.stringify({ 
          error: 'Request too large',
          message: `Maximum prompt size is ${MAX_REQUEST_SIZE} characters`,
          size: requestBodyText.length
        }),
        { 
          status: 413, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request
    let requestData;
    try {
      requestData = JSON.parse(requestBodyText);
    } catch (parseError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate prompt
    const { prompt, model } = requestData;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request',
          message: 'prompt field is required and must be a non-empty string'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Select model (prefer gpt-4-turbo, fallback to gpt-3.5-turbo)
    // Note: gpt-5 not available as of Nov 2025
    const selectedModel = model || 'gpt-4-turbo-preview';
    const availableModels = ['gpt-4-turbo-preview', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
    const finalModel = availableModels.includes(selectedModel) ? selectedModel : 'gpt-4-turbo-preview';

    console.log('[ai-auto-build] Building workflow from prompt');
    console.log('[ai-auto-build] Model:', finalModel);
    console.log('[ai-auto-build] Prompt length:', prompt.length);

    // Call OpenAI API with strict JSON mode
    const openaiRequest = {
      model: finalModel,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `Generate a workflow for this requirement:\n\n${prompt}`
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent JSON output
      max_tokens: 2000,
      response_format: { type: 'json_object' } // Force JSON output (GPT-4+ feature)
    };

    const startTime = Date.now();
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(openaiRequest)
    });

    const duration = Date.now() - startTime;
    console.log('[ai-auto-build] OpenAI response:', openaiResponse.status, `(${duration}ms)`);

    // Handle OpenAI errors
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('[ai-auto-build] OpenAI API error:', errorData);
      
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API error',
          message: errorData.error?.message || 'Failed to generate workflow',
          status: openaiResponse.status
        }),
        { 
          status: openaiResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const responseData = await openaiResponse.json();
    const modelOutput = responseData.choices[0].message.content;

    console.log('[ai-auto-build] Raw model output length:', modelOutput.length);

    // Parse JSON output
    let parsedWorkflow;
    try {
      parsedWorkflow = JSON.parse(modelOutput);
    } catch (jsonError) {
      console.error('[ai-auto-build] Failed to parse model output as JSON');
      
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = modelOutput.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                       modelOutput.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          parsedWorkflow = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          console.log('[ai-auto-build] Extracted JSON from markdown');
        } catch (retryError) {
          return new Response(
            JSON.stringify({ 
              error: 'Invalid model output',
              message: 'AI model returned non-JSON content. Please try again.',
              modelOutput: modelOutput.substring(0, 500) + '...',
              hint: 'The model did not follow JSON output instructions'
            }),
            { 
              status: 422, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid model output',
            message: 'AI model returned non-JSON content',
            modelOutput: modelOutput.substring(0, 500) + '...'
          }),
          { 
            status: 422, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Validate workflow structure
    const validation = validateWorkflowStructure(parsedWorkflow);
    if (!validation.valid) {
      console.error('[ai-auto-build] Invalid workflow structure:', validation.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid workflow structure',
          message: 'AI model returned malformed workflow',
          validationErrors: validation.errors,
          modelOutput: modelOutput.substring(0, 500) + '...',
          hint: 'Try rephrasing your prompt or being more specific'
        }),
        { 
          status: 422, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[ai-auto-build] Success! Generated', parsedWorkflow.nodes.length, 'nodes');
    console.log('[ai-auto-build] Tokens used:', responseData.usage?.total_tokens);

    // Log request to database
    if (responseData.usage) {
      const cost = calculateCost(
        finalModel,
        responseData.usage.prompt_tokens,
        responseData.usage.completion_tokens
      );
      
      await logAIRequest({
        model: finalModel,
        prompt_summary: prompt.substring(0, 200),
        tokens_used: responseData.usage.total_tokens,
        cost_estimate: cost,
        status: 'success',
        function_name: 'ai-auto-build'
      });
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        workflow: parsedWorkflow,
        modelOutput: modelOutput,
        metadata: {
          model: finalModel,
          tokensUsed: responseData.usage?.total_tokens || 0,
          duration,
          nodesCount: parsedWorkflow.nodes.length,
          edgesCount: parsedWorkflow.edges.length
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[ai-auto-build] Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
