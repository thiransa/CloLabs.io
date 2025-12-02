/**
 * Client-side API for production workflow execution
 * Handles triggering, monitoring, and managing live workflow runs
 */

import { supabase } from './supabaseClient.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Execute a workflow in production mode with full state persistence
 * 
 * @param {Object} workflowModel - Workflow definition { nodes, edges }
 * @param {Object} options - Execution options
 * @param {Object} options.inputPayload - Initial data to pass to workflow
 * @param {string} options.workflowId - Optional: saved workflow ID
 * @param {string} options.triggerType - 'manual', 'webhook', 'schedule', 'api'
 * @param {string} options.triggerSource - Source identifier
 * @param {string} options.executionMode - 'production', 'test', 'debug'
 * @returns {Promise<Object>} Execution result with executionId, status, timeline, summary
 * 
 * @example
 * const result = await executeWorkflow(workflowModel, {
 *   inputPayload: { name: 'John', email: 'john@example.com' },
 *   triggerType: 'manual',
 *   executionMode: 'production'
 * });
 * console.log('Execution ID:', result.executionId);
 */
export async function executeWorkflow(workflowModel, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration missing. Check environment variables.');
  }

  if (!workflowModel || !workflowModel.nodes || workflowModel.nodes.length === 0) {
    throw new Error('Workflow must contain at least one node');
  }

  console.log('[executionApi] Starting workflow execution with', workflowModel.nodes.length, 'nodes');

  // Get current session for authentication
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('User not authenticated. Please sign in.');
  }

  const requestBody = {
    workflowModel,
    inputPayload: options.inputPayload || {},
    workflowId: options.workflowId || null,
    triggerType: options.triggerType || 'manual',
    triggerSource: options.triggerSource || session.user.email || 'unknown',
    executionMode: options.executionMode || 'production',
  };

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/execute-workflow`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Workflow execution failed');
    }

    console.log('[executionApi] Execution completed:', data.executionId, '-', data.status);

    return {
      executionId: data.executionId,
      status: data.status,
      timeline: data.timeline || [],
      summary: data.summary || {},
    };

  } catch (error) {
    console.error('[executionApi] Execution error:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to execution service.');
    }
    
    throw error;
  }
}

/**
 * Get execution status and results
 * 
 * @param {string} executionId - Execution ID to fetch
 * @returns {Promise<Object>} Execution record with status, timeline, results
 */
export async function getExecution(executionId) {
  if (!executionId) {
    throw new Error('Execution ID is required');
  }

  try {
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (error) {
      console.error('[executionApi] Error fetching execution:', error);
      throw new Error(error.message || 'Failed to fetch execution');
    }

    if (!data) {
      throw new Error('Execution not found');
    }

    return data;

  } catch (error) {
    console.error('[executionApi] Get execution error:', error);
    throw error;
  }
}

/**
 * Get detailed timeline for an execution
 * 
 * @param {string} executionId - Execution ID
 * @returns {Promise<Array>} Timeline entries with node execution details
 */
export async function getExecutionTimeline(executionId) {
  if (!executionId) {
    throw new Error('Execution ID is required');
  }

  try {
    const { data, error } = await supabase
      .from('execution_timeline')
      .select('*')
      .eq('execution_id', executionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[executionApi] Error fetching timeline:', error);
      throw new Error(error.message || 'Failed to fetch timeline');
    }

    return data || [];

  } catch (error) {
    console.error('[executionApi] Get timeline error:', error);
    throw error;
  }
}

/**
 * Get execution logs for debugging
 * 
 * @param {string} executionId - Execution ID
 * @param {Object} options - Filter options
 * @param {string} options.level - Filter by log level (debug, info, warn, error, critical)
 * @param {number} options.limit - Max number of logs to return
 * @returns {Promise<Array>} Log entries
 */
export async function getExecutionLogs(executionId, options = {}) {
  if (!executionId) {
    throw new Error('Execution ID is required');
  }

  try {
    let query = supabase
      .from('execution_logs')
      .select('*')
      .eq('execution_id', executionId)
      .order('created_at', { ascending: true });

    if (options.level) {
      query = query.eq('level', options.level);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[executionApi] Error fetching logs:', error);
      throw new Error(error.message || 'Failed to fetch logs');
    }

    return data || [];

  } catch (error) {
    console.error('[executionApi] Get logs error:', error);
    throw error;
  }
}

/**
 * List recent executions for the current user
 * 
 * @param {Object} options - Query options
 * @param {number} options.limit - Max number of executions to return (default: 20)
 * @param {string} options.status - Filter by status
 * @param {string} options.workflowId - Filter by workflow ID
 * @returns {Promise<Array>} Execution records
 */
export async function listExecutions(options = {}) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from('workflow_executions')
      .select('id, status, started_at, completed_at, duration_ms, nodes_total, nodes_completed, nodes_failed, trigger_type, trigger_source, error_details')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.workflowId) {
      query = query.eq('workflow_id', options.workflowId);
    }

    query = query.limit(options.limit || 20);

    const { data, error } = await query;

    if (error) {
      console.error('[executionApi] Error listing executions:', error);
      throw new Error(error.message || 'Failed to list executions');
    }

    return data || [];

  } catch (error) {
    console.error('[executionApi] List executions error:', error);
    throw error;
  }
}

/**
 * Cancel a running execution
 * Note: Currently just marks as cancelled in DB. 
 * Full cancellation requires Edge Function enhancement.
 * 
 * @param {string} executionId - Execution ID to cancel
 * @returns {Promise<Object>} Updated execution record
 */
export async function cancelExecution(executionId) {
  if (!executionId) {
    throw new Error('Execution ID is required');
  }

  try {
    // Check if execution is running
    const execution = await getExecution(executionId);
    
    if (!execution) {
      throw new Error('Execution not found');
    }

    if (execution.status !== 'running' && execution.status !== 'pending') {
      throw new Error(`Cannot cancel execution with status: ${execution.status}`);
    }

    // Mark as cancelled
    const { data, error } = await supabase
      .from('workflow_executions')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        duration_ms: execution.started_at 
          ? Date.now() - new Date(execution.started_at).getTime()
          : null,
      })
      .eq('id', executionId)
      .select()
      .single();

    if (error) {
      console.error('[executionApi] Error cancelling execution:', error);
      throw new Error(error.message || 'Failed to cancel execution');
    }

    console.log('[executionApi] Execution cancelled:', executionId);

    return data;

  } catch (error) {
    console.error('[executionApi] Cancel execution error:', error);
    throw error;
  }
}

/**
 * Delete an execution and all related data
 * 
 * @param {string} executionId - Execution ID to delete
 * @returns {Promise<void>}
 */
export async function deleteExecution(executionId) {
  if (!executionId) {
    throw new Error('Execution ID is required');
  }

  try {
    const { error } = await supabase
      .from('workflow_executions')
      .delete()
      .eq('id', executionId);

    if (error) {
      console.error('[executionApi] Error deleting execution:', error);
      throw new Error(error.message || 'Failed to delete execution');
    }

    console.log('[executionApi] Execution deleted:', executionId);

  } catch (error) {
    console.error('[executionApi] Delete execution error:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time execution updates
 * 
 * @param {string} executionId - Execution ID to monitor
 * @param {Function} onUpdate - Callback for execution updates
 * @param {Function} onTimelineUpdate - Callback for timeline updates
 * @returns {Function} Unsubscribe function
 * 
 * @example
 * const unsubscribe = subscribeToExecution(
 *   executionId,
 *   (execution) => console.log('Status:', execution.status),
 *   (timeline) => console.log('Node completed:', timeline.node_label)
 * );
 * // Later: unsubscribe();
 */
export function subscribeToExecution(executionId, onUpdate, onTimelineUpdate) {
  if (!executionId) {
    throw new Error('Execution ID is required');
  }

  console.log('[executionApi] Subscribing to execution updates:', executionId);

  // Subscribe to execution changes
  const executionChannel = supabase
    .channel(`execution:${executionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'workflow_executions',
        filter: `id=eq.${executionId}`,
      },
      (payload) => {
        console.log('[executionApi] Execution update:', payload.new.status);
        onUpdate && onUpdate(payload.new);
      }
    )
    .subscribe();

  // Subscribe to timeline changes
  const timelineChannel = supabase
    .channel(`timeline:${executionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'execution_timeline',
        filter: `execution_id=eq.${executionId}`,
      },
      (payload) => {
        console.log('[executionApi] Timeline update:', payload.new?.node_label, payload.new?.status);
        onTimelineUpdate && onTimelineUpdate(payload.new || payload.old);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    console.log('[executionApi] Unsubscribing from execution:', executionId);
    supabase.removeChannel(executionChannel);
    supabase.removeChannel(timelineChannel);
  };
}

/**
 * Get execution statistics for the current user
 * 
 * @returns {Promise<Object>} Statistics summary
 */
export async function getExecutionStats() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('workflow_executions')
      .select('status, duration_ms, nodes_total, credits_consumed')
      .eq('user_id', user.id);

    if (error) {
      console.error('[executionApi] Error fetching stats:', error);
      throw new Error(error.message || 'Failed to fetch stats');
    }

    // Calculate statistics
    const stats = {
      total: data.length,
      completed: data.filter(e => e.status === 'completed').length,
      failed: data.filter(e => e.status === 'failed').length,
      running: data.filter(e => e.status === 'running').length,
      pending: data.filter(e => e.status === 'pending').length,
      totalCredits: data.reduce((sum, e) => sum + (e.credits_consumed || 0), 0),
      avgDuration: data.filter(e => e.duration_ms).length > 0
        ? Math.round(
            data.filter(e => e.duration_ms).reduce((sum, e) => sum + e.duration_ms, 0) /
            data.filter(e => e.duration_ms).length
          )
        : 0,
      totalNodes: data.reduce((sum, e) => sum + (e.nodes_total || 0), 0),
    };

    return stats;

  } catch (error) {
    console.error('[executionApi] Get stats error:', error);
    throw error;
  }
}
