// API helper for workflow run persistence
import { supabase } from './supabaseClient.js';

/**
 * Save a workflow run (simulation or execution) to the database
 * @param {Object} runData - Run data to save
 * @param {string} runData.workflowId - Workflow ID (Supabase ID)
 * @param {string} runData.userId - User ID
 * @param {Array} runData.timeline - Timeline of node executions
 * @param {Object} runData.summary - Summary statistics
 * @param {string} runData.status - Run status ('success', 'partial', 'failed')
 * @returns {Promise<{data: any, error: any}>}
 */
export async function saveWorkflowRun({ workflowId, userId, timeline, summary, status }) {
  try {
    console.log('[runApi] Saving workflow run...', { workflowId, status, nodes: timeline?.length });
    
    if (!workflowId) {
      console.error('[runApi] No workflow ID provided');
      return { data: null, error: new Error('Workflow ID is required') };
    }

    if (!timeline || !Array.isArray(timeline)) {
      console.error('[runApi] Invalid timeline data');
      return { data: null, error: new Error('Timeline must be an array') };
    }

    if (!status || !['success', 'partial', 'failed'].includes(status)) {
      console.error('[runApi] Invalid status:', status);
      return { data: null, error: new Error('Status must be success, partial, or failed') };
    }

    // Get current user if not provided
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('[runApi] Auth error:', authError);
        return { data: null, error: authError || new Error('Not authenticated') };
      }
      currentUserId = user.id;
    }

    const { data, error } = await supabase
      .from('workflow_runs')
      .insert([{
        workflow_id: workflowId,
        user_id: currentUserId,
        timeline,
        summary: summary || {},
        status
      }])
      .select()
      .single();

    if (error) {
      console.error('[runApi] Error saving run:', error);
      return { data: null, error };
    }

    console.log('[runApi] Run saved successfully:', data.id);
    return { data, error: null };
  } catch (err) {
    console.error('[runApi] Unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch workflow runs for a specific workflow
 * @param {string} workflowId - Workflow ID to fetch runs for
 * @param {number} limit - Maximum number of runs to fetch (default: 20)
 * @returns {Promise<{data: Array, error: any}>}
 */
export async function fetchWorkflowRuns(workflowId, limit = 20) {
  try {
    console.log('[runApi] Fetching runs for workflow:', workflowId);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[runApi] Auth error:', authError);
      return { data: null, error: authError || new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('workflow_runs')
      .select('*')
      .eq('workflow_id', workflowId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[runApi] Error fetching runs:', error);
      return { data: null, error };
    }

    console.log('[runApi] Fetched', data?.length || 0, 'runs');
    return { data, error: null };
  } catch (err) {
    console.error('[runApi] Unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch all workflow runs for the current user
 * @param {number} limit - Maximum number of runs to fetch (default: 50)
 * @returns {Promise<{data: Array, error: any}>}
 */
export async function fetchAllUserRuns(limit = 50) {
  try {
    console.log('[runApi] Fetching all user runs...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[runApi] Auth error:', authError);
      return { data: null, error: authError || new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('workflow_runs')
      .select('*, workflows(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[runApi] Error fetching runs:', error);
      return { data: null, error };
    }

    console.log('[runApi] Fetched', data?.length || 0, 'user runs');
    return { data, error: null };
  } catch (err) {
    console.error('[runApi] Unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Delete a workflow run
 * @param {string} runId - Run ID to delete
 * @returns {Promise<{data: any, error: any}>}
 */
export async function deleteWorkflowRun(runId) {
  try {
    console.log('[runApi] Deleting run:', runId);
    
    const { error } = await supabase
      .from('workflow_runs')
      .delete()
      .eq('id', runId);

    if (error) {
      console.error('[runApi] Error deleting run:', error);
      return { data: null, error };
    }

    console.log('[runApi] Run deleted successfully');
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error('[runApi] Unexpected error:', err);
    return { data: null, error: err };
  }
}
