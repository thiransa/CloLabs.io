import { supabase } from './supabaseClient.js';

/**
 * Save workflow to Supabase database
 * @param {Object} workflowData - Workflow data to save
 * @param {string|null} workflowData.id - Workflow ID (null for new workflows)
 * @param {string} workflowData.name - Workflow name
 * @param {Array} workflowData.nodes - Workflow nodes
 * @param {Array} workflowData.connections - Workflow connections
 * @param {string|null} workflowData.userId - User ID (optional)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function saveWorkflowToSupabase(workflowData) {
  try {
    const { id, name, nodes, connections, userId } = workflowData;

    // Prepare workflow data
    const workflowPayload = {
      name: name || 'Untitled Workflow',
      nodes: nodes || [],
      connections: connections || [],
      user_id: userId || null,
      updated_at: new Date().toISOString()
    };

    let savedWorkflow;

    if (id) {
      // Update existing workflow
      const { data, error } = await supabase
        .from('workflows')
        .update(workflowPayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating workflow:', error);
        return { success: false, error: error.message };
      }

      savedWorkflow = data;
    } else {
      // Insert new workflow
      workflowPayload.created_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('workflows')
        .insert([workflowPayload])
        .select()
        .single();

      if (error) {
        console.error('Error creating workflow:', error);
        return { success: false, error: error.message };
      }

      savedWorkflow = data;
    }

    // Create workflow revision record
    const revisionPayload = {
      workflow_id: savedWorkflow.id,
      name: savedWorkflow.name,
      nodes: savedWorkflow.nodes,
      connections: savedWorkflow.connections,
      created_at: new Date().toISOString()
    };

    const { error: revisionError } = await supabase
      .from('workflow_revisions')
      .insert([revisionPayload]);

    if (revisionError) {
      console.error('Error creating workflow revision:', revisionError);
      // Don't fail the whole operation if revision fails
    }

    return {
      success: true,
      data: savedWorkflow
    };

  } catch (error) {
    console.error('Unexpected error saving workflow:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Load workflow from Supabase database
 * @param {string} workflowId - Workflow ID to load
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function loadWorkflowFromSupabase(workflowId) {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error) {
      console.error('Error loading workflow:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('Unexpected error loading workflow:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Delete workflow from Supabase database
 * @param {string} workflowId - Workflow ID to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteWorkflowFromSupabase(workflowId) {
  try {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId);

    if (error) {
      console.error('Error deleting workflow:', error);
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error('Unexpected error deleting workflow:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * List all workflows for a user
 * @param {string|null} userId - User ID (null for all public workflows)
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function listUserWorkflows(userId = null) {
  try {
    let query = supabase
      .from('workflows')
      .select('id, name, created_at, updated_at, nodes, connections')
      .order('updated_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.is('user_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing workflows:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('Unexpected error listing workflows:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Load a specific workflow by ID (alias for loadWorkflowFromSupabase)
 * @param {string} workflowId - Workflow ID to load
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function loadWorkflow(workflowId) {
  return loadWorkflowFromSupabase(workflowId);
}

/**
 * List all public workflow templates
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function listTemplates() {
  try {
    const { data, error } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing templates:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('Unexpected error listing templates:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}
