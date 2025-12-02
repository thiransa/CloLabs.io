// Supabase Edge Function: execute-workflow
// Production-grade workflow orchestrator with atomic execution, retry logic, and state persistence
// Created: 2025-11-22

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// Types & Interfaces
// ============================================================================

interface Node {
  id: string;
  type: string;
  data: {
    label: string;
    config?: any;
    actionType?: string;
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

interface ExecutionRequest {
  workflowModel: WorkflowModel;
  inputPayload?: object;
  workflowId?: string;
  triggerType?: 'manual' | 'webhook' | 'schedule' | 'api';
  triggerSource?: string;
  executionMode?: 'production' | 'test' | 'debug';
}

interface NodeExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  duration: number;
  retriesUsed?: number;
  apiCallsMade?: number;
  creditsConsumed?: number;
}

interface ExecutionContext {
  executionId: string;
  userId: string;
  supabase: any;
  flowData: Map<string, any>; // Data passed between nodes
  globalContext: any; // Initial payload + accumulated results
  debugMode: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAYS: [1000, 3000, 10000], // Exponential backoff in ms
  NODE_TIMEOUT: 60000, // 60 seconds per node
  TOTAL_EXECUTION_TIMEOUT: 600000, // 10 minutes total
  MAX_NODES: 100, // Safety limit
  MAX_PAYLOAD_SIZE: 10 * 1024 * 1024, // 10MB
};

// ============================================================================
// Logging Utility
// ============================================================================

async function log(
  ctx: ExecutionContext,
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical',
  message: string,
  details?: any,
  nodeId?: string,
  timelineId?: string
) {
  const logEntry = {
    execution_id: ctx.executionId,
    timeline_id: timelineId || null,
    level,
    message,
    details: details ? JSON.parse(JSON.stringify(details)) : null,
    node_id: nodeId || null,
    source: 'orchestrator',
  };

  console.log(`[${level.toUpperCase()}] [${ctx.executionId}] ${nodeId ? `[${nodeId}] ` : ''}${message}`);

  // Persist to database
  try {
    await ctx.supabase
      .from('execution_logs')
      .insert(logEntry);
  } catch (error) {
    console.error('[LOG ERROR] Failed to persist log:', error);
  }
}

// ============================================================================
// Graph Traversal Utilities
// ============================================================================

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

function findStartNodes(nodes: Node[], edges: Edge[]): Node[] {
  const nodesWithIncoming = new Set(edges.map(e => e.target));
  const startNodes = nodes.filter(node => 
    !nodesWithIncoming.has(node.id) || node.type === 'trigger' || node.type === 'start'
  );
  return startNodes.length > 0 ? startNodes : (nodes.length > 0 ? [nodes[0]] : []);
}

function topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
  const adjList = buildAdjacencyList(edges);
  const inDegree = new Map<string, number>();
  
  // Initialize in-degrees
  nodes.forEach(node => inDegree.set(node.id, 0));
  edges.forEach(edge => {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });
  
  // Queue nodes with no dependencies
  const queue: Node[] = nodes.filter(node => inDegree.get(node.id) === 0);
  const sorted: Node[] = [];
  
  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);
    
    const neighbors = adjList.get(node.id) || [];
    neighbors.forEach(neighborId => {
      const newDegree = (inDegree.get(neighborId) || 0) - 1;
      inDegree.set(neighborId, newDegree);
      
      if (newDegree === 0) {
        const neighborNode = nodes.find(n => n.id === neighborId);
        if (neighborNode) queue.push(neighborNode);
      }
    });
  }
  
  // Detect cycles
  if (sorted.length !== nodes.length) {
    throw new Error('Workflow contains circular dependencies');
  }
  
  return sorted;
}

// ============================================================================
// Node Executors
// ============================================================================

async function executeGPTNode(node: Node, input: any, ctx: ExecutionContext): Promise<NodeExecutionResult> {
  const startTime = Date.now();
  const config = node.data?.config;
  
  if (!config?.promptTemplate) {
    return {
      success: false,
      error: 'GPT node missing prompt template configuration',
      duration: Date.now() - startTime,
    };
  }
  
  await log(ctx, 'info', 'Executing GPT node', { model: config.gptModel, maxTokens: config.maxTokens }, node.id);
  
  // Build prompt with context substitution
  let prompt = config.promptTemplate;
  const contextString = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
  prompt = prompt.replace(/\{input\}/g, contextString);
  prompt = prompt.replace(/\{data\}/g, contextString);
  prompt = prompt.replace(/\{payload\}/g, contextString);
  
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    return {
      success: false,
      error: 'OPENAI_API_KEY not configured',
      duration: Date.now() - startTime,
    };
  }
  
  const requestBody = {
    model: config.gptModel || 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    temperature: parseFloat(config.temperature) || 0.7,
    max_tokens: parseInt(config.maxTokens) || 1000,
  };
  
  // Execute with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.NODE_TIMEOUT);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json();
      await log(ctx, 'error', 'OpenAI API error', errorData, node.id);
      return {
        success: false,
        error: errorData.error?.message || `OpenAI API error: ${response.status}`,
        duration: Date.now() - startTime,
      };
    }
    
    const responseData = await response.json();
    const aiResponse = responseData.choices[0].message.content;
    
    await log(ctx, 'info', 'GPT node completed', { 
      responseLength: aiResponse.length,
      tokensUsed: responseData.usage?.total_tokens 
    }, node.id);
    
    return {
      success: true,
      output: {
        response: aiResponse,
        model: responseData.model,
        tokensUsed: responseData.usage?.total_tokens || 0,
        promptTokens: responseData.usage?.prompt_tokens || 0,
        completionTokens: responseData.usage?.completion_tokens || 0,
      },
      duration: Date.now() - startTime,
      apiCallsMade: 1,
      creditsConsumed: 1,
    };
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      await log(ctx, 'error', 'GPT node timeout', { timeout: CONFIG.NODE_TIMEOUT }, node.id);
      return {
        success: false,
        error: `Timeout after ${CONFIG.NODE_TIMEOUT}ms`,
        duration: Date.now() - startTime,
      };
    }
    
    await log(ctx, 'error', 'GPT node exception', { error: error.message }, node.id);
    return {
      success: false,
      error: error.message || 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

async function executeWebhookNode(node: Node, input: any, ctx: ExecutionContext): Promise<NodeExecutionResult> {
  const startTime = Date.now();
  const config = node.data?.config;
  
  let webhookUrl: string | null = null;
  
  // Resolve webhook URL
  if (config?.customWebhookUrl) {
    webhookUrl = config.customWebhookUrl;
  } else if (config?.integrationId) {
    // Fetch from user_integrations
    const { data, error } = await ctx.supabase
      .from('user_integrations')
      .select('url, config')
      .eq('id', config.integrationId)
      .eq('user_id', ctx.userId)
      .eq('type', 'webhook')
      .single();
    
    if (error || !data) {
      return {
        success: false,
        error: 'Webhook integration not found',
        duration: Date.now() - startTime,
      };
    }
    
    webhookUrl = data.config?.url || data.url;
  }
  
  if (!webhookUrl) {
    return {
      success: false,
      error: 'No webhook URL configured',
      duration: Date.now() - startTime,
    };
  }
  
  if (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
    return {
      success: false,
      error: 'Invalid webhook URL format',
      duration: Date.now() - startTime,
    };
  }
  
  await log(ctx, 'info', 'Executing webhook node', { url: webhookUrl }, node.id);
  
  // Forward via forward-webhook Edge Function for security
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const payload = {
    event: 'workflow_execution',
    executionId: ctx.executionId,
    nodeId: node.id,
    data: input,
    timestamp: new Date().toISOString(),
  };
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.NODE_TIMEOUT);
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/forward-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        targetUrl: webhookUrl,
        payload,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const responseData = await response.json();
    
    if (responseData.ok) {
      await log(ctx, 'info', 'Webhook delivered successfully', { status: responseData.status }, node.id);
      return {
        success: true,
        output: {
          status: responseData.status,
          statusText: responseData.statusText,
          response: responseData.text,
        },
        duration: Date.now() - startTime,
        apiCallsMade: 1,
      };
    } else {
      await log(ctx, 'warn', 'Webhook delivery failed', { error: responseData.error }, node.id);
      return {
        success: false,
        error: responseData.error || 'Webhook delivery failed',
        duration: Date.now() - startTime,
      };
    }
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: `Webhook timeout after ${CONFIG.NODE_TIMEOUT}ms`,
        duration: Date.now() - startTime,
      };
    }
    
    return {
      success: false,
      error: error.message || 'Webhook execution failed',
      duration: Date.now() - startTime,
    };
  }
}

async function executeSlackNode(node: Node, input: any, ctx: ExecutionContext): Promise<NodeExecutionResult> {
  const startTime = Date.now();
  const integrationId = node.data?.config?.integrationId || node.data?.webhookUrl;
  
  if (!integrationId) {
    return {
      success: false,
      error: 'Slack integration not configured',
      duration: Date.now() - startTime,
    };
  }
  
  // Fetch Slack integration
  const { data, error } = await ctx.supabase
    .from('user_integrations')
    .select('url, config')
    .eq('id', integrationId)
    .eq('user_id', ctx.userId)
    .eq('type', 'slack')
    .single();
  
  if (error || !data?.url) {
    return {
      success: false,
      error: 'Slack integration not found',
      duration: Date.now() - startTime,
    };
  }
  
  await log(ctx, 'info', 'Executing Slack node', {}, node.id);
  
  const payload = {
    text: node.data?.config?.message || 'Workflow notification',
    data: input,
    executionId: ctx.executionId,
  };
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.NODE_TIMEOUT);
  
  try {
    const response = await fetch(data.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      await log(ctx, 'info', 'Slack message sent', {}, node.id);
      return {
        success: true,
        output: { status: 'sent' },
        duration: Date.now() - startTime,
        apiCallsMade: 1,
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        error: `Slack API error: ${response.status} - ${errorText}`,
        duration: Date.now() - startTime,
      };
    }
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    return {
      success: false,
      error: error.name === 'AbortError' ? 'Slack timeout' : error.message,
      duration: Date.now() - startTime,
    };
  }
}

async function executeConditionNode(node: Node, input: any, ctx: ExecutionContext): Promise<NodeExecutionResult> {
  const startTime = Date.now();
  const condition = node.data?.condition || node.data?.config?.condition;
  
  if (!condition) {
    return {
      success: false,
      error: 'Condition not configured',
      duration: Date.now() - startTime,
    };
  }
  
  await log(ctx, 'info', 'Evaluating condition', { condition }, node.id);
  
  try {
    // Simple expression evaluation (enhance with safe eval library if needed)
    // For now, support basic comparisons
    const passed = evaluateCondition(condition, input);
    
    await log(ctx, 'info', `Condition ${passed ? 'passed' : 'failed'}`, {}, node.id);
    
    return {
      success: true,
      output: {
        passed,
        condition,
        input,
      },
      duration: Date.now() - startTime,
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Condition evaluation error: ${error.message}`,
      duration: Date.now() - startTime,
    };
  }
}

function evaluateCondition(condition: string, input: any): boolean {
  // Simple condition evaluator - extend as needed
  // Example: "status === 'success'" or "value > 100"
  try {
    // Safety: only allow simple expressions
    if (!/^[\w\s\.\[\]'"\=\!\>\<\&\|\+\-\*\/\(\)]+$/.test(condition)) {
      throw new Error('Invalid condition syntax');
    }
    
    // Create safe evaluation context
    const context = typeof input === 'object' ? input : { value: input };
    const func = new Function(...Object.keys(context), `return ${condition}`);
    return func(...Object.values(context));
  } catch {
    return false;
  }
}

async function executeGenericNode(node: Node, input: any, ctx: ExecutionContext): Promise<NodeExecutionResult> {
  const startTime = Date.now();
  
  await log(ctx, 'info', `Executing ${node.type} node`, {}, node.id);
  
  // Generic pass-through for transform, trigger, start, etc.
  return {
    success: true,
    output: {
      type: node.type,
      input,
      processed: true,
    },
    duration: Date.now() - startTime,
  };
}

// ============================================================================
// Node Execution with Retry Logic
// ============================================================================

async function executeNodeWithRetry(
  node: Node,
  input: any,
  ctx: ExecutionContext,
  timelineId: string
): Promise<NodeExecutionResult> {
  let lastError: string = '';
  let retriesUsed = 0;
  
  for (let attempt = 0; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    // Update timeline status
    await ctx.supabase
      .from('execution_timeline')
      .update({
        status: attempt === 0 ? 'running' : 'retrying',
        attempt_number: attempt + 1,
        retry_count: attempt,
        started_at: new Date().toISOString(),
      })
      .eq('id', timelineId);
    
    // Route to appropriate executor
    let result: NodeExecutionResult;
    
    try {
      switch (node.type) {
        case 'gpt':
          result = await executeGPTNode(node, input, ctx);
          break;
        case 'action':
          if (node.data?.actionType === 'webhook' || node.data?.actionType === 'Webhook') {
            result = await executeWebhookNode(node, input, ctx);
          } else if (node.data?.actionType === 'slack') {
            result = await executeSlackNode(node, input, ctx);
          } else {
            result = await executeGenericNode(node, input, ctx);
          }
          break;
        case 'condition':
          result = await executeConditionNode(node, input, ctx);
          break;
        default:
          result = await executeGenericNode(node, input, ctx);
      }
      
      if (result.success) {
        // Success - update timeline and return
        await ctx.supabase
          .from('execution_timeline')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            duration_ms: result.duration,
            output_data: result.output,
            retry_count: retriesUsed,
          })
          .eq('id', timelineId);
        
        return { ...result, retriesUsed };
      }
      
      // Failed - check if should retry
      lastError = result.error || 'Unknown error';
      retriesUsed = attempt;
      
      if (attempt < CONFIG.MAX_RETRIES) {
        const delay = CONFIG.RETRY_DELAYS[attempt] || CONFIG.RETRY_DELAYS[CONFIG.RETRY_DELAYS.length - 1];
        await log(ctx, 'warn', `Node failed, retrying in ${delay}ms`, { error: lastError, attempt: attempt + 1 }, node.id);
        
        // Calculate next retry time
        const nextRetryAt = new Date(Date.now() + delay);
        await ctx.supabase
          .from('execution_timeline')
          .update({
            next_retry_at: nextRetryAt.toISOString(),
            error_details: { message: lastError, attempt: attempt + 1 },
          })
          .eq('id', timelineId);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error) {
      lastError = error.message || 'Unexpected error';
      await log(ctx, 'error', 'Node execution exception', { error: lastError }, node.id);
      
      if (attempt >= CONFIG.MAX_RETRIES) {
        break;
      }
    }
  }
  
  // All retries exhausted - mark as failed
  await ctx.supabase
    .from('execution_timeline')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_details: { message: lastError, retriesUsed },
    })
    .eq('id', timelineId);
  
  await log(ctx, 'error', `Node failed after ${retriesUsed + 1} attempts`, { error: lastError }, node.id);
  
  return {
    success: false,
    error: lastError,
    duration: 0,
    retriesUsed,
  };
}

// ============================================================================
// Main Orchestrator
// ============================================================================

async function executeWorkflow(
  request: ExecutionRequest,
  userId: string,
  supabase: any
): Promise<{ executionId: string; status: string; timeline: any[]; summary: any }> {
  const startTime = Date.now();
  
  // Validation
  if (!request.workflowModel?.nodes || request.workflowModel.nodes.length === 0) {
    throw new Error('Workflow must contain at least one node');
  }
  
  if (request.workflowModel.nodes.length > CONFIG.MAX_NODES) {
    throw new Error(`Workflow exceeds maximum ${CONFIG.MAX_NODES} nodes`);
  }
  
  // Detect cycles
  try {
    topologicalSort(request.workflowModel.nodes, request.workflowModel.edges);
  } catch (error) {
    throw new Error('Workflow validation failed: ' + error.message);
  }
  
  // Create execution record
  const { data: execution, error: execError } = await supabase
    .from('workflow_executions')
    .insert({
      user_id: userId,
      workflow_id: request.workflowId || null,
      workflow_snapshot: request.workflowModel,
      input_payload: request.inputPayload || {},
      trigger_type: request.triggerType || 'manual',
      trigger_source: request.triggerSource || 'api',
      execution_mode: request.executionMode || 'production',
      status: 'pending',
      nodes_total: request.workflowModel.nodes.length,
    })
    .select()
    .single();
  
  if (execError || !execution) {
    throw new Error('Failed to create execution record: ' + execError?.message);
  }
  
  const executionId = execution.id;
  
  // Build execution context
  const ctx: ExecutionContext = {
    executionId,
    userId,
    supabase,
    flowData: new Map(),
    globalContext: { ...request.inputPayload },
    debugMode: request.executionMode === 'debug',
  };
  
  await log(ctx, 'info', 'Starting workflow execution', {
    nodeCount: request.workflowModel.nodes.length,
    edgeCount: request.workflowModel.edges.length,
  });
  
  // Update status to running
  await supabase
    .from('workflow_executions')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .eq('id', executionId);
  
  // Execute nodes in topological order
  const sortedNodes = topologicalSort(request.workflowModel.nodes, request.workflowModel.edges);
  let nodesCompleted = 0;
  let nodesFailed = 0;
  let totalApiCalls = 0;
  let totalCredits = 0;
  
  const timeline: any[] = [];
  
  try {
    for (const node of sortedNodes) {
      // Check total timeout
      if (Date.now() - startTime > CONFIG.TOTAL_EXECUTION_TIMEOUT) {
        throw new Error('Workflow execution timeout');
      }
      
      // Update current node
      await supabase
        .from('workflow_executions')
        .update({ current_node_id: node.id })
        .eq('id', executionId);
      
      // Create timeline entry
      const { data: timelineEntry, error: timelineError } = await supabase
        .from('execution_timeline')
        .insert({
          execution_id: executionId,
          node_id: node.id,
          node_type: node.type,
          node_label: node.data?.label || node.type,
          status: 'pending',
          input_data: ctx.globalContext,
          max_retries: CONFIG.MAX_RETRIES,
        })
        .select()
        .single();
      
      if (timelineError || !timelineEntry) {
        throw new Error('Failed to create timeline entry');
      }
      
      // Execute node with retry logic
      const result = await executeNodeWithRetry(node, ctx.globalContext, ctx, timelineEntry.id);
      
      if (result.success) {
        nodesCompleted++;
        
        // Update flow context with node output
        ctx.flowData.set(node.id, result.output);
        ctx.globalContext = {
          ...ctx.globalContext,
          [`${node.id}_output`]: result.output,
          lastNodeOutput: result.output,
        };
        
        // Track resource usage
        totalApiCalls += result.apiCallsMade || 0;
        totalCredits += result.creditsConsumed || 0;
        
        timeline.push({
          nodeId: node.id,
          label: node.data?.label || node.type,
          type: node.type,
          status: 'completed',
          duration: result.duration,
          retriesUsed: result.retriesUsed || 0,
        });
        
      } else {
        nodesFailed++;
        
        timeline.push({
          nodeId: node.id,
          label: node.data?.label || node.type,
          type: node.type,
          status: 'failed',
          error: result.error,
          duration: result.duration,
          retriesUsed: result.retriesUsed || 0,
        });
        
        // Stop execution on failure (can make this configurable)
        await log(ctx, 'error', 'Stopping execution due to node failure', { nodeId: node.id, error: result.error });
        break;
      }
      
      // Update progress
      await supabase
        .from('workflow_executions')
        .update({
          nodes_completed: nodesCompleted,
          nodes_failed: nodesFailed,
          api_calls_made: totalApiCalls,
          credits_consumed: totalCredits,
        })
        .eq('id', executionId);
    }
    
    // Determine final status
    const finalStatus = nodesFailed > 0 ? 'failed' : 'completed';
    const totalDuration = Date.now() - startTime;
    
    // Update execution record
    await supabase
      .from('workflow_executions')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        duration_ms: totalDuration,
        output_result: ctx.globalContext,
        nodes_completed: nodesCompleted,
        nodes_failed: nodesFailed,
        api_calls_made: totalApiCalls,
        credits_consumed: totalCredits,
      })
      .eq('id', executionId);
    
    await log(ctx, 'info', 'Workflow execution completed', {
      status: finalStatus,
      duration: totalDuration,
      nodesCompleted,
      nodesFailed,
    });
    
    return {
      executionId,
      status: finalStatus,
      timeline,
      summary: {
        totalNodes: sortedNodes.length,
        nodesCompleted,
        nodesFailed,
        duration: totalDuration,
        apiCallsMade: totalApiCalls,
        creditsConsumed: totalCredits,
      },
    };
    
  } catch (error) {
    // Handle catastrophic failure
    await supabase
      .from('workflow_executions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        error_details: {
          message: error.message,
          type: 'orchestrator_error',
        },
        nodes_completed: nodesCompleted,
        nodes_failed: nodesFailed + 1,
      })
      .eq('id', executionId);
    
    await log(ctx, 'critical', 'Workflow execution failed', { error: error.message });
    
    throw error;
  }
}

// ============================================================================
// HTTP Handler
// ============================================================================

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Extract user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse request
    const request: ExecutionRequest = await req.json();
    
    // Execute workflow
    const result = await executeWorkflow(request, user.id, supabase);
    
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[execute-workflow] Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Execution failed',
        details: error.toString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
