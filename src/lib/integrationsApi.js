// API helper for managing user integrations (webhooks)
import { supabase } from './supabaseClient.js';

/**
 * Fetch all integrations for the current user
 * @returns {Promise<{data: Array, error: any}>}
 */
export async function fetchUserIntegrations() {
  try {
    console.log('[integrationsApi] Fetching user integrations...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[integrationsApi] Auth error:', authError);
      return { data: null, error: authError || new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[integrationsApi] Error fetching integrations:', error);
      return { data: null, error };
    }

    console.log('[integrationsApi] Fetched', data?.length || 0, 'integrations');
    return { data, error: null };
  } catch (err) {
    console.error('[integrationsApi] Unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Create a new integration
 * @param {Object} integration - Integration data
 * @param {string} integration.name - Name of the integration
 * @param {string} integration.url - Webhook URL
 * @param {string} [integration.type] - Integration type (default: 'webhook')
 * @param {Object} [integration.config] - Additional configuration data
 * @returns {Promise<{data: any, error: any}>}
 */
export async function createIntegration({ name, url, type = 'webhook', config = null }) {
  try {
    console.log('[integrationsApi] Creating integration:', name);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[integrationsApi] Auth error:', authError);
      return { data: null, error: authError || new Error('Not authenticated') };
    }

    // Validate inputs
    if (!name || !name.trim()) {
      return { data: null, error: new Error('Name is required') };
    }

    if (!url || !url.trim()) {
      return { data: null, error: new Error('URL is required') };
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return { data: null, error: new Error('Invalid URL format') };
    }

    const insertData = {
      user_id: user.id,
      name: name.trim(),
      url: url.trim(),
      type,
      is_active: true,
    };

    // Add config if provided
    if (config) {
      insertData.config = config;
    }

    const { data, error } = await supabase
      .from('user_integrations')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('[integrationsApi] Error creating integration:', error);
      return { data: null, error };
    }

    console.log('[integrationsApi] Integration created successfully:', data.id);
    return { data, error: null };
  } catch (err) {
    console.error('[integrationsApi] Unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Update an existing integration
 * @param {string} id - Integration ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: any, error: any}>}
 */
export async function updateIntegration(id, updates) {
  try {
    console.log('[integrationsApi] Updating integration:', id);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[integrationsApi] Auth error:', authError);
      return { data: null, error: authError || new Error('Not authenticated') };
    }

    // Validate URL if it's being updated
    if (updates.url) {
      try {
        new URL(updates.url);
      } catch {
        return { data: null, error: new Error('Invalid URL format') };
      }
    }

    const { data, error } = await supabase
      .from('user_integrations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns this integration
      .select()
      .single();

    if (error) {
      console.error('[integrationsApi] Error updating integration:', error);
      return { data: null, error };
    }

    console.log('[integrationsApi] Integration updated successfully');
    return { data, error: null };
  } catch (err) {
    console.error('[integrationsApi] Unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Delete an integration
 * @param {string} id - Integration ID
 * @returns {Promise<{data: any, error: any}>}
 */
export async function deleteIntegration(id) {
  try {
    console.log('[integrationsApi] Deleting integration:', id);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[integrationsApi] Auth error:', authError);
      return { data: null, error: authError || new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Ensure user owns this integration

    if (error) {
      console.error('[integrationsApi] Error deleting integration:', error);
      return { data: null, error };
    }

    console.log('[integrationsApi] Integration deleted successfully');
    return { data, error: null };
  } catch (err) {
    console.error('[integrationsApi] Unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Toggle integration active status
 * @param {string} id - Integration ID
 * @param {boolean} isActive - New active status
 * @returns {Promise<{data: any, error: any}>}
 */
export async function toggleIntegrationStatus(id, isActive) {
  try {
    console.log('[integrationsApi] Toggling integration status:', id, isActive);
    return await updateIntegration(id, { is_active: isActive });
  } catch (err) {
    console.error('[integrationsApi] Unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Forward webhook payload to target URL via edge function
 * @param {string} targetUrl - Target webhook URL
 * @param {Object} payload - Payload to send
 * @returns {Promise<{data: any, error: any}>}
 */
export async function forwardWebhook(targetUrl, payload) {
  try {
    console.log('[integrationsApi] Forwarding webhook to:', targetUrl);
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
      console.error('[integrationsApi] Supabase URL not configured');
      return { data: null, error: new Error('Supabase not configured') };
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/forward-webhook`;
    
    console.log('[integrationsApi] Calling edge function:', edgeFunctionUrl);
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ targetUrl, payload }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('[integrationsApi] Edge function error:', responseData);
      return { data: null, error: new Error(responseData.error || 'Webhook forwarding failed') };
    }

    console.log('[integrationsApi] Webhook forwarded successfully');
    return { data: responseData, error: null };
  } catch (err) {
    console.error('[integrationsApi] Unexpected error:', err);
    return { data: null, error: err };
  }
}
