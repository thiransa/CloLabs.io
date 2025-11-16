// Edge Function: simulate-workflow
// Simulates workflow execution without making real API calls

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Node {
  id: string;
  type: string;
  data: {
    label: string;
    actionType?: string;
    webhookUrl?: string;
    prompt?: string;
    condition?: string;
    [key: string]: any;
  };
}

interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface WorkflowModel {
  nodes: Node[];
  edges: Edge[];
}

interface SimulationRequest {
  workflowModel: WorkflowModel;
  samplePayload?: object;
  userId?: string;
}

interface TimelineEntry {
  nodeId: string;
  label: string;
  type: string;
  result: object;
  timestamp: number;
  duration: number;
}

// Find start nodes (no incoming edges or type == 'trigger')
function findStartNodes(nodes: Node[], edges: Edge[]): Node[] {
  const nodesWithIncoming = new Set(edges.map(e => e.target));
  const startNodes = nodes.filter(node => 
    !nodesWithIncoming.has(node.id) || node.type === 'trigger'
  );
  return startNodes.length > 0 ? startNodes : (nodes.length > 0 ? [nodes[0]] : []);
}

// Build adjacency list from edges
function buildAdjacencyList(edges: Edge[]): Map<string, string[]> {
  const adjList = new Map<string, string[]>();
  edges.forEach(edge => {
    if (!adjList.has(edge.source)) {
      adjList.set(edge.source, []);
    }
    adjList.get(edge.source)!.push(edge.target);
  });
  return adjList;
}

// Fetch Slack integration from Supabase
async function fetchSlackIntegration(userId: string, integrationId: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('user_integrations')
      .select('url, config, type')
      .eq('id', integrationId)
      .eq('user_id', userId)
      .eq('type', 'slack')
      .single();

    if (error || !data) {
      console.error('[simulate-workflow] Error fetching Slack integration:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[simulate-workflow] Exception fetching Slack integration:', error);
    return null;
  }
}

// Fetch generic webhook integration from Supabase
async function fetchWebhookIntegration(userId: string, integrationId: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[simulate-workflow] Fetching webhook integration:', integrationId, 'for user:', userId);

    const { data, error } = await supabase
      .from('user_integrations')
      .select('url, config, type, name')
      .eq('id', integrationId)
      .eq('user_id', userId)
      .eq('type', 'webhook')
      .single();

    if (error || !data) {
      console.error('[simulate-workflow] Error fetching webhook integration:', error);
      return null;
    }

    console.log('[simulate-workflow] Fetched webhook integration:', data.name);
    return data;
  } catch (error) {
    console.error('[simulate-workflow] Exception fetching webhook integration:', error);
    return null;
  }
}

// Send message to Slack webhook
async function sendToSlack(webhookUrl: string, nodeInput: object): Promise<{ ok: boolean; message: string; statusCode?: number }> {
  try {
    const payload = {
      text: "New event from CloLabs",
      data: nodeInput
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return {
        ok: true,
        message: 'Message sent to Slack successfully',
        statusCode: response.status
      };
    } else {
      const errorText = await response.text();
      return {
        ok: false,
        message: `Slack webhook failed: ${response.status} ${response.statusText} - ${errorText}`,
        statusCode: response.status
      };
    }
  } catch (error) {
    return {
      ok: false,
      message: `Failed to send to Slack: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Execute GPT node with OpenAI API
async function executeGPTNode(node: Node, flowContext: object): Promise<object> {
  try {
    const config = node.data?.config;
    
    if (!config || !config.promptTemplate) {
      return {
        ok: false,
        error: 'GPT node not configured: missing prompt template',
        duration: 0
      };
    }

    console.log('[simulate-workflow] Executing GPT node:', node.id);
    console.log('[simulate-workflow] GPT config:', {
      model: config.gptModel,
      maxTokens: config.maxTokens,
      temperature: config.temperature
    });

    // Replace placeholders in prompt template with flow context data
    let finalPrompt = config.promptTemplate;
    
    // Replace {input} with stringified flow context
    const contextString = typeof flowContext === 'string' 
      ? flowContext 
      : JSON.stringify(flowContext, null, 2);
    
    finalPrompt = finalPrompt.replace(/\{input\}/g, contextString);
    
    // Also support other common placeholders
    finalPrompt = finalPrompt.replace(/\{data\}/g, contextString);
    finalPrompt = finalPrompt.replace(/\{payload\}/g, contextString);
    
    console.log('[simulate-workflow] Final prompt length:', finalPrompt.length);

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('[simulate-workflow] OPENAI_API_KEY not configured');
      return {
        ok: false,
        error: 'OpenAI API key not configured on server',
        duration: 0
      };
    }

    // Prepare request to OpenAI
    const openaiRequest = {
      model: config.gptModel || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'user',
          content: finalPrompt
        }
      ],
      temperature: parseFloat(config.temperature) || 0.7,
      max_tokens: parseInt(config.maxTokens) || 1000
    };

    // Call OpenAI Chat Completions API with timeout
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(openaiRequest),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[simulate-workflow] OpenAI API error:', errorData);
        return {
          ok: false,
          error: errorData.error?.message || `OpenAI API error: ${response.status}`,
          duration
        };
      }

      const responseData = await response.json();
      const aiResponse = responseData.choices[0].message.content;

      console.log('[simulate-workflow] GPT node success. Response length:', aiResponse.length);
      console.log('[simulate-workflow] Tokens used:', responseData.usage?.total_tokens);

      return {
        ok: true,
        response: aiResponse,
        content: aiResponse, // Alias for compatibility
        model: responseData.model,
        tokensUsed: responseData.usage?.total_tokens || 0,
        duration,
        promptTokens: responseData.usage?.prompt_tokens || 0,
        completionTokens: responseData.usage?.completion_tokens || 0
      };

    } catch (error) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      if (error.name === 'AbortError') {
        console.error('[simulate-workflow] GPT node timeout after 30s');
        return {
          ok: false,
          error: 'GPT request timeout after 30 seconds',
          duration: 30000
        };
      }
      
      console.error('[simulate-workflow] GPT node exception:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error calling OpenAI',
        duration
      };
    }

  } catch (error) {
    console.error('[simulate-workflow] GPT node processing error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to process GPT node',
      duration: 0
    };
  }
}

// Generate mock result based on node type
async function generateMockResult(node: Node, payload: object, userId?: string): Promise<object> {
  const delay = Math.floor(Math.random() * 300) + 100; // 100-400ms simulated delay

  switch (node.type) {
    case 'gpt':
      // Execute real GPT node with OpenAI API
      return await executeGPTNode(node, payload);
    
    case 'action':
      if (node.data.actionType === 'slack') {
        // Handle Slack webhook - make actual POST request
        const integrationId = node.data.webhookUrl; // This should be the integration ID
        
        if (!userId || !integrationId) {
          return {
            ok: false,
            message: 'Missing user ID or integration ID for Slack action',
            duration: delay
          };
        }

        // Fetch Slack integration details from Supabase
        const integration = await fetchSlackIntegration(userId, integrationId);
        
        if (!integration || !integration.url) {
          return {
            ok: false,
            message: 'Slack integration not found or webhook URL not configured',
            duration: delay
          };
        }

        // Send message to Slack
        const result = await sendToSlack(integration.url, payload);
        
        return {
          ...result,
          duration: delay
        };
      } else if (node.data.actionType === 'webhook' || node.data.actionType === 'Webhook') {
        // Handle generic webhook via forward-webhook Edge Function for security
        console.log('[simulate-workflow] Processing generic webhook node:', node.id);
        console.log('[simulate-workflow] Node config:', node.data.config);
        
        let webhookUrl: string | null = null;
        
        // Priority 1: Custom webhook URL (one-off paste)
        if (node.data.config?.customWebhookUrl) {
          webhookUrl = node.data.config.customWebhookUrl;
          console.log('[simulate-workflow] Using custom URL');
        }
        // Priority 2: Saved integration via integrationId
        else if (node.data.config?.integrationId && userId) {
          console.log('[simulate-workflow] Fetching saved webhook integration:', node.data.config.integrationId);
          const integration = await fetchWebhookIntegration(userId, node.data.config.integrationId);
          
          if (!integration) {
            return {
              ok: false,
              message: 'Webhook integration not found or was deleted',
              duration: delay
            };
          }
          
          // Get URL from config.url or fallback to url field
          webhookUrl = integration.config?.url || integration.url;
          console.log('[simulate-workflow] Using saved integration URL');
        }
        // Fallback: Legacy support for direct webhookUrl or url field
        else if (node.data.config?.url) {
          webhookUrl = node.data.config.url;
          console.log('[simulate-workflow] Using legacy URL from config');
        } else if (node.data.webhookUrl) {
          webhookUrl = node.data.webhookUrl;
          console.log('[simulate-workflow] Using legacy webhookUrl');
        }
        
        if (!webhookUrl) {
          return {
            ok: false,
            message: 'No webhook URL configured. Please select a saved webhook or paste a custom URL.',
            duration: delay
          };
        }
        
        // Validate URL format
        if (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
          return {
            ok: false,
            message: 'Invalid webhook URL. Must start with http:// or https://',
            duration: delay
          };
        }
        
        // Use forward-webhook Edge Function to proxy the request securely
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          
          const webhookPayload = {
            event: 'workflow_execution',
            workflowId: node.data.workflowId || 'unknown',
            nodeId: node.id,
            data: payload,
            timestamp: new Date().toISOString()
          };
          
          // Call forward-webhook Edge Function
          const forwardUrl = `${supabaseUrl}/functions/v1/forward-webhook`;
          console.log('[simulate-workflow] Forwarding webhook via Edge Function');
          
          const startTime = Date.now();
          const response = await fetch(forwardUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              targetUrl: webhookUrl,
              payload: webhookPayload
            }),
          });
          
          const responseData = await response.json();
          const duration = Date.now() - startTime;
          
          console.log('[simulate-workflow] Forward response:', responseData.status, responseData.ok);
          
          // Return the proxied response
          return {
            ok: responseData.ok || false,
            status: responseData.status || response.status,
            statusText: responseData.statusText || response.statusText,
            message: responseData.ok 
              ? `Webhook forwarded successfully (${responseData.status})`
              : `Webhook failed: ${responseData.error || responseData.statusText}`,
            text: responseData.text || responseData.error,
            duration,
            forwarded: true,
            nodeId: node.id
          };
        } catch (error) {
          return {
            ok: false,
            message: `Webhook forwarding failed: ${error instanceof Error ? error.message : String(error)}`,
            duration: delay,
            nodeId: node.id
          };
        }
      } else if (node.data.actionType === 'ai') {
        return {
          ok: true,
          text: `Simulated AI response for prompt: "${node.data.prompt?.substring(0, 50) || 'No prompt'}..."`,
          model: 'simulation-gpt',
          duration: delay
        };
      }
      return { ok: true, message: 'Action executed', duration: delay };

    case 'condition':
      // Randomly pass/fail for simulation
      const passed = Math.random() > 0.3; // 70% pass rate
      return {
        ok: true,
        passed,
        condition: node.data.condition || 'unknown',
        message: passed ? 'Condition met' : 'Condition not met',
        duration: delay
      };

    case 'trigger':
      return {
        ok: true,
        triggered: true,
        payload,
        message: 'Workflow triggered',
        duration: delay
      };

    case 'transform':
      return {
        ok: true,
        transformed: true,
        message: 'Data transformed',
        duration: delay
      };

    default:
      return {
        ok: true,
        message: `Executed ${node.type} node`,
        duration: delay
      };
  }
}

// BFS traversal to simulate workflow execution
async function simulateWorkflow(
  workflowModel: WorkflowModel,
  samplePayload: object,
  userId?: string
): Promise<{ timeline: TimelineEntry[]; summary: object }> {
  const { nodes, edges } = workflowModel;
  const timeline: TimelineEntry[] = [];
  const visited = new Set<string>();
  const adjList = buildAdjacencyList(edges);
  
  const startNodes = findStartNodes(nodes, edges);
  const queue: Node[] = [...startNodes];
  
  // Track flow context - results passed between nodes
  const nodeResults = new Map<string, any>();
  let currentFlowContext = samplePayload;

  let totalDuration = 0;
  let successCount = 0;
  let errorCount = 0;

  while (queue.length > 0) {
    const currentNode = queue.shift()!;
    
    if (visited.has(currentNode.id)) {
      continue;
    }
    
    visited.add(currentNode.id);
    
    const startTime = Date.now();
    
    // Pass current flow context to node execution
    const result = await generateMockResult(currentNode, currentFlowContext, userId);
    const duration = (result as any).duration || 0;
    
    totalDuration += duration;
    
    if ((result as any).ok) {
      successCount++;
    } else {
      errorCount++;
    }

    // Store node result for reference and passing to next nodes
    nodeResults.set(currentNode.id, result);
    
    // Update flow context with node result for GPT and other nodes
    if (currentNode.type === 'gpt' && (result as any).ok && (result as any).response) {
      // For GPT nodes, pass the AI response to subsequent nodes
      currentFlowContext = {
        ...currentFlowContext,
        previousNodeResult: result,
        gptResponse: (result as any).response,
        // Also keep the original payload accessible
        originalPayload: samplePayload
      };
      
      console.log('[simulate-workflow] GPT node result stored, response length:', (result as any).response?.length);
    } else if ((result as any).ok) {
      // For other successful nodes, merge result into context
      currentFlowContext = {
        ...currentFlowContext,
        previousNodeResult: result,
        [`${currentNode.type}_result`]: result
      };
    }

    timeline.push({
      nodeId: currentNode.id,
      label: currentNode.data.label || currentNode.type,
      type: currentNode.type,
      result,
      timestamp: startTime,
      duration
    });

    // Small delay to simulate async execution
    await new Promise(resolve => setTimeout(resolve, 50));

    // Add next nodes to queue
    const nextNodes = adjList.get(currentNode.id) || [];
    for (const nextNodeId of nextNodes) {
      const nextNode = nodes.find(n => n.id === nextNodeId);
      if (nextNode && !visited.has(nextNodeId)) {
        queue.push(nextNode);
      }
    }
  }

  const summary = {
    totalNodes: timeline.length,
    successCount,
    errorCount,
    totalDuration,
    status: errorCount === 0 ? 'success' : 'partial',
    completedAt: new Date().toISOString()
  };

  return { timeline, summary };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: SimulationRequest = await req.json()
    const { workflowModel, samplePayload = {}, userId } = body

    if (!workflowModel || !workflowModel.nodes) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: workflowModel with nodes required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[simulate-workflow] Simulating workflow with ${workflowModel.nodes.length} nodes`)

    const result = await simulateWorkflow(workflowModel, samplePayload, userId)

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[simulate-workflow] Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Simulation failed',
        details: String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
