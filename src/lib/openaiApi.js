// API helper for OpenAI Chat endpoint
// Calls the secure edge function that proxies to OpenAI

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Call OpenAI Chat Completions API via secure edge function
 * @param {Array} messages - Array of chat messages with role and content
 * @param {Object} options - Optional model, temperature, max_tokens
 * @returns {Promise} OpenAI chat completion response
 */
export async function sendChatMessage(messages, options = {}) {
  try {
    console.log('[openaiApi] Sending chat request with', messages.length, 'messages');

    const requestBody = {
      messages,
      model: options?.model || 'gpt-3.5-turbo',
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 1000
    };

    const response = await fetch(`${SUPABASE_URL}/functions/v1/openai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[openaiApi] Error:', data);
      return {
        data: null,
        error: data.message || data.error || 'Failed to get AI response'
      };
    }

    console.log('[openaiApi] Success! Tokens used:', data.usage?.total_tokens);
    return { data, error: null };

  } catch (error) {
    console.error('[openaiApi] Exception:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate workflow from AI prompt
 * @param {string} prompt - User's workflow description
 * @returns {Promise} Generated workflow structure
 */
export async function generateWorkflowFromPrompt(prompt) {
  const messages = [
    {
      role: 'system',
      content: `You are a workflow automation expert. Generate a workflow structure based on the user's description.
Return a JSON object with:
- name: string (workflow name)
- description: string (brief description)
- nodes: array of {id, type, label, position: {x, y}}
- edges: array of {id, source, target}

Node types: trigger, action, condition, delay
Keep it simple and practical.`
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const result = await sendChatMessage(messages, {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 1500
  });

  if (result.error || !result.data) {
    return { data: null, error: result.error };
  }

  try {
    const content = result.data.choices[0].message.content;
    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const workflow = JSON.parse(jsonMatch[0]);
      return { data: workflow, error: null };
    } else {
      return { data: null, error: 'Could not parse workflow from AI response' };
    }
  } catch (parseError) {
    console.error('[openaiApi] Parse error:', parseError);
    return { data: null, error: 'Failed to parse AI response' };
  }
}

/**
 * Get AI suggestions for workflow optimization
 * @param {string} workflowDescription - Description of current workflow
 * @returns {Promise} AI suggestions
 */
export async function getWorkflowSuggestions(workflowDescription) {
  const messages = [
    {
      role: 'system',
      content: 'You are a workflow automation expert. Provide helpful suggestions to improve the workflow.'
    },
    {
      role: 'user',
      content: `Here's my workflow: ${workflowDescription}\n\nWhat improvements would you suggest?`
    }
  ];

  const result = await sendChatMessage(messages, {
    model: 'gpt-3.5-turbo',
    temperature: 0.8,
    max_tokens: 800
  });

  if (result.error || !result.data) {
    return { data: null, error: result.error };
  }

  return {
    data: result.data.choices[0].message.content,
    error: null
  };
}
