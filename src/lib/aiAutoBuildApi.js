/**
 * Client-side helper for AI Auto-Build API
 * Generates workflow structures from natural language prompts
 */

import { checkCredits, deductCredits } from './creditsApi.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Generate a complete workflow from a natural language prompt
 * 
 * @param {string} prompt - Natural language description of the workflow
 * @param {Object} options - Optional configuration
 * @param {string} options.model - OpenAI model to use (gpt-4-turbo-preview, gpt-4, gpt-3.5-turbo)
 * @returns {Promise<Object>} Generated workflow structure
 * 
 * @example
 * const workflow = await generateWorkflow(
 *   "Create a workflow that triggers when a webhook is received, then sends an email notification"
 * );
 * console.log(workflow.nodes, workflow.edges);
 */
export async function generateWorkflow(prompt, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration missing. Check environment variables.');
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Prompt is required and must be a non-empty string');
  }

  // Check if user has enough credits before making the API call
  console.log('[aiAutoBuildApi] Checking credits before generation...');
  const creditCheck = await checkCredits(1);
  
  if (!creditCheck.hasCredits) {
    throw new Error(
      `Insufficient credits. You have ${creditCheck.remaining} credits remaining, but need 1 credit to generate a workflow. Your credits will reset soon.`
    );
  }

  console.log('[aiAutoBuildApi] User has sufficient credits, proceeding...');

  const requestBody = {
    prompt: prompt.trim(),
    model: options.model || 'gpt-4-turbo-preview'
  };

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/ai-auto-build`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error types
      if (response.status === 413) {
        throw new Error(`Prompt too long: ${data.message || 'Maximum 10KB'}`);
      } else if (response.status === 422) {
        throw new Error(
          `Invalid workflow generated: ${data.message}\n${
            data.validationErrors ? data.validationErrors.join(', ') : ''
          }\nHint: ${data.hint || 'Try rephrasing your prompt'}`
        );
      } else {
        throw new Error(data.message || data.error || 'Failed to generate workflow');
      }
    }

    if (!data.success || !data.workflow) {
      throw new Error('Invalid response from AI auto-build service');
    }

    // Deduct 1 credit after successful generation
    console.log('[aiAutoBuildApi] Workflow generated successfully, deducting 1 credit...');
    const deductResult = await deductCredits(1);
    
    if (!deductResult.success) {
      console.error('[aiAutoBuildApi] Failed to deduct credit:', deductResult.error);
      // Still return the workflow even if credit deduction fails (they already used the API)
    } else {
      console.log('[aiAutoBuildApi] Credit deducted. Remaining:', deductResult.data.credits_remaining);
    }

    return {
      workflow: data.workflow,
      metadata: data.metadata,
      rawOutput: data.modelOutput,
      creditsRemaining: deductResult.data?.credits_remaining
    };

  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to AI service. Check your connection.');
    }
    throw error;
  }
}

/**
 * Generate workflow with detailed progress feedback
 * Useful for showing loading states and progress
 * 
 * @param {string} prompt - Natural language description
 * @param {Function} onProgress - Callback for progress updates
 * @param {Object} options - Optional configuration
 * @returns {Promise<Object>} Generated workflow
 * 
 * @example
 * const workflow = await generateWorkflowWithProgress(
 *   "Email notification workflow",
 *   (stage) => console.log(`Progress: ${stage}`),
 *   { model: 'gpt-4' }
 * );
 */
export async function generateWorkflowWithProgress(prompt, onProgress, options = {}) {
  try {
    onProgress && onProgress('Validating prompt...');
    
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Please provide a workflow description');
    }

    onProgress && onProgress('Connecting to AI service...');
    
    const startTime = Date.now();
    const result = await generateWorkflow(prompt, options);
    
    const duration = Date.now() - startTime;
    
    onProgress && onProgress(`Complete! Generated ${result.workflow.nodes.length} nodes in ${duration}ms`);
    
    return result;

  } catch (error) {
    onProgress && onProgress(`Error: ${error.message}`);
    throw error;
  }
}

/**
 * Validate a prompt before sending to AI
 * 
 * @param {string} prompt - Prompt to validate
 * @returns {Object} Validation result { valid: boolean, error?: string, suggestions?: string[] }
 * 
 * @example
 * const validation = validatePrompt(userInput);
 * if (!validation.valid) {
 *   alert(validation.error);
 * }
 */
export function validatePrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return {
      valid: false,
      error: 'Prompt must be a string'
    };
  }

  const trimmed = prompt.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Prompt cannot be empty',
      suggestions: [
        'Describe what your workflow should do',
        'Example: "Send email when webhook is received"'
      ]
    };
  }

  if (trimmed.length < 10) {
    return {
      valid: false,
      error: 'Prompt too short - please be more descriptive',
      suggestions: [
        'Add details about triggers and actions',
        'Example: "When a form is submitted, send data to Slack and email admin"'
      ]
    };
  }

  if (trimmed.length > 10000) {
    return {
      valid: false,
      error: 'Prompt too long - maximum 10,000 characters',
      suggestions: [
        'Simplify your workflow description',
        'Break complex workflows into smaller parts'
      ]
    };
  }

  return { valid: true };
}

/**
 * Get example prompts for inspiration
 * 
 * @returns {Array<Object>} Example prompts with descriptions
 */
export function getExamplePrompts() {
  return [
    {
      title: 'Email Notification',
      prompt: 'When a webhook is received, send an email notification to the admin',
      description: 'Simple trigger to action flow'
    },
    {
      title: 'Data Processing Pipeline',
      prompt: 'Receive webhook data, validate it with a condition, then post to external API if valid, otherwise log error',
      description: 'Workflow with conditional logic'
    },
    {
      title: 'Scheduled Report',
      prompt: 'Every day at 9 AM, fetch data from an API, process it, and send summary email',
      description: 'Time-based trigger with multiple actions'
    },
    {
      title: 'Alert System',
      prompt: 'When monitoring webhook detects an error, immediately notify via Slack and SMS',
      description: 'Critical alert with multiple notification channels'
    },
    {
      title: 'Delayed Follow-up',
      prompt: 'When user signs up via webhook, wait 24 hours, then send welcome email with tips',
      description: 'Workflow with time delay'
    }
  ];
}
