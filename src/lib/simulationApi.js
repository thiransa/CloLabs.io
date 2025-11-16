// API helper for workflow simulation
import { supabase } from './supabaseClient.js';

/**
 * Simulate workflow execution without making real API calls
 * @param {Object} workflowModel - The workflow model with nodes and edges
 * @param {Object} samplePayload - Optional sample payload for testing
 * @returns {Promise<{data: any, error: any}>}
 */
export async function simulateWorkflow(workflowModel, samplePayload = {}) {
  try {
    console.log('[simulationApi] Starting workflow simulation...');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
      console.error('[simulationApi] Supabase URL not configured');
      return { data: null, error: new Error('Supabase not configured') };
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/simulate-workflow`;
    
    console.log('[simulationApi] Calling simulation endpoint:', edgeFunctionUrl);
    console.log('[simulationApi] Workflow has', workflowModel.nodes?.length || 0, 'nodes');

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
    const userId = session?.user?.id;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        workflowModel,
        samplePayload,
        userId
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('[simulationApi] Simulation error:', responseData);
      return { data: null, error: new Error(responseData.error || 'Simulation failed') };
    }

    console.log('[simulationApi] Simulation completed successfully');
    console.log('[simulationApi] Timeline entries:', responseData.timeline?.length || 0);
    
    return { data: responseData, error: null };
  } catch (err) {
    console.error('[simulationApi] Unexpected error:', err);
    return { data: null, error: err };
  }
}
