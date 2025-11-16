// Shared utility for logging AI requests to database
// Import this in edge functions to track usage and costs

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface AIRequestLog {
  user_id?: string;
  model: string;
  prompt_summary: string;
  tokens_used?: number;
  tokens_estimated?: number;
  cost_estimate?: number;
  status?: string;
  error_message?: string;
  function_name: string;
}

// Pricing per 1K tokens (as of 2024)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
};

/**
 * Calculate estimated cost based on model and token usage
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-3.5-turbo'];
  
  const inputCost = (promptTokens / 1000) * pricing.input;
  const outputCost = (completionTokens / 1000) * pricing.output;
  
  return inputCost + outputCost;
}

/**
 * Estimate tokens in text (rough approximation: ~4 chars per token)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Log AI request to database
 */
export async function logAIRequest(
  supabaseUrl: string,
  supabaseServiceKey: string,
  logData: AIRequestLog
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('ai_requests')
      .insert({
        user_id: logData.user_id || null,
        model: logData.model,
        prompt_summary: logData.prompt_summary.substring(0, 200), // First 200 chars
        tokens_used: logData.tokens_used || null,
        tokens_estimated: logData.tokens_estimated || null,
        cost_estimate: logData.cost_estimate || null,
        status: logData.status || 'success',
        error_message: logData.error_message || null,
        function_name: logData.function_name,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('[logAIRequest] Failed to log request:', error);
      // Don't throw - logging failure shouldn't break the main function
    } else {
      console.log('[logAIRequest] Successfully logged request:', logData.function_name);
    }
  } catch (err) {
    console.error('[logAIRequest] Exception:', err);
    // Swallow error - logging is non-critical
  }
}

/**
 * Extract user ID from Authorization header
 */
export function extractUserId(authHeader: string | null, supabaseJwtSecret: string): string | null {
  if (!authHeader) return null;
  
  try {
    const token = authHeader.replace('Bearer ', '');
    // In production, you'd verify the JWT and extract the user ID
    // For now, return null (anonymous requests)
    return null;
  } catch (err) {
    console.error('[extractUserId] Failed to extract user ID:', err);
    return null;
  }
}
