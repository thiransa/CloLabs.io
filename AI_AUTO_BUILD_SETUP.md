# AI Auto-Build API - Complete Setup Guide

## Overview

The AI Auto-Build API generates complete workflow structures from natural language prompts using OpenAI's GPT models. It enforces strict JSON schema validation to ensure valid workflow outputs.

## Features

✅ **Natural Language to Workflow** - Describe workflows in plain English  
✅ **Strict JSON Schema** - Enforced structure validation  
✅ **Smart Model Selection** - Prefers GPT-4 Turbo for best results  
✅ **Automatic Validation** - Checks nodes, edges, and relationships  
✅ **Error Recovery** - Extracts JSON from markdown if needed  
✅ **Rate Limiting Ready** - Built-in request size limits  
✅ **Progress Tracking** - Client helpers for loading states  

---

## Quick Start

### 1. Deploy the Edge Function

```bash
# Set your OpenAI API key (if not already set)
supabase secrets set OPENAI_API_KEY=sk-proj-your-actual-key-here

# Deploy the function
supabase functions deploy ai-auto-build

# Test deployment
curl -X POST https://your-project.supabase.co/functions/v1/ai-auto-build \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Create a workflow that sends email when webhook is received"}'
```

### 2. Use in Your React App

```jsx
import { generateWorkflow, generateWorkflowWithProgress } from '@/lib/aiAutoBuildApi';

// Simple usage
async function handleGenerateWorkflow() {
  try {
    const result = await generateWorkflow(
      "When a webhook is received, validate the data, then send to external API"
    );
    
    console.log('Generated workflow:', result.workflow);
    console.log('Nodes:', result.workflow.nodes);
    console.log('Edges:', result.workflow.edges);
    console.log('Tokens used:', result.metadata.tokensUsed);
    
    // Load into builder
    setNodes(result.workflow.nodes);
    setEdges(result.workflow.edges);
    
  } catch (error) {
    console.error('Failed to generate:', error.message);
  }
}

// With progress feedback
async function handleGenerateWithProgress() {
  try {
    const result = await generateWorkflowWithProgress(
      "Email notification workflow when form is submitted",
      (stage) => setLoadingMessage(stage),
      { model: 'gpt-4-turbo-preview' }
    );
    
    setWorkflow(result.workflow);
    
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}
```

---

## API Reference

### Edge Function Endpoint

**POST** `/functions/v1/ai-auto-build`

#### Request Body

```json
{
  "prompt": "string (required, max 10KB)",
  "model": "string (optional, default: gpt-4-turbo-preview)"
}
```

**Available Models:**
- `gpt-4-turbo-preview` (recommended, best results)
- `gpt-4-turbo`
- `gpt-4`
- `gpt-3.5-turbo` (faster, less accurate)

#### Response (Success)

```json
{
  "success": true,
  "workflow": {
    "name": "Workflow Name",
    "description": "Description",
    "nodes": [
      {
        "id": "node-1",
        "type": "trigger",
        "label": "Webhook Trigger",
        "data": {}
      },
      {
        "id": "node-2",
        "type": "action",
        "label": "Send Email",
        "data": {}
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2"
      }
    ]
  },
  "modelOutput": "raw JSON string from AI",
  "metadata": {
    "model": "gpt-4-turbo-preview",
    "tokensUsed": 450,
    "duration": 2340,
    "nodesCount": 2,
    "edgesCount": 1
  }
}
```

#### Response (Error)

```json
{
  "error": "Invalid workflow structure",
  "message": "AI model returned malformed workflow",
  "validationErrors": [
    "Node 0: missing or invalid 'id'",
    "Edge 0: invalid 'source' - node 'xyz' does not exist"
  ],
  "hint": "Try rephrasing your prompt or being more specific"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Invalid request (missing/invalid prompt)
- `405` - Method not allowed (must use POST)
- `413` - Request too large (>10KB prompt)
- `422` - Invalid model output (non-JSON or invalid schema)
- `500` - Server error (OpenAI API key missing)
- `502` - OpenAI API error

---

## Client API Functions

### `generateWorkflow(prompt, options)`

Generate a workflow from a prompt.

```javascript
const result = await generateWorkflow(
  "Create email notification workflow",
  { model: 'gpt-4-turbo-preview' }
);

// Returns:
{
  workflow: { name, description, nodes, edges },
  metadata: { model, tokensUsed, duration, nodesCount, edgesCount },
  rawOutput: "raw JSON string"
}
```

**Throws:**
- `Error` - If prompt is invalid or generation fails

---

### `generateWorkflowWithProgress(prompt, onProgress, options)`

Generate workflow with progress callbacks.

```javascript
const result = await generateWorkflowWithProgress(
  "Webhook to Slack notification",
  (stage) => console.log(stage),
  { model: 'gpt-4' }
);

// Progress callbacks:
// "Validating prompt..."
// "Connecting to AI service..."
// "Complete! Generated 3 nodes in 2340ms"
```

---

### `validatePrompt(prompt)`

Validate a prompt before sending.

```javascript
const validation = validatePrompt(userInput);

if (!validation.valid) {
  alert(validation.error);
  console.log('Suggestions:', validation.suggestions);
}

// Returns:
{
  valid: boolean,
  error?: string,
  suggestions?: string[]
}
```

**Validation Rules:**
- Must be a non-empty string
- Minimum 10 characters
- Maximum 10,000 characters

---

### `getExamplePrompts()`

Get example prompts for inspiration.

```javascript
const examples = getExamplePrompts();

examples.forEach(ex => {
  console.log(ex.title);        // "Email Notification"
  console.log(ex.prompt);       // "When a webhook is received..."
  console.log(ex.description);  // "Simple trigger to action flow"
});

// Returns 5 example prompts with varying complexity
```

---

## Workflow Schema

The AI generates workflows following this strict schema:

```javascript
{
  name: "string (optional)",
  description: "string (optional)",
  nodes: [
    {
      id: "string (required, unique)",
      type: "trigger|action|condition|delay (required)",
      label: "string (required)",
      data: {} // optional, node-specific configuration
    }
  ],
  edges: [
    {
      id: "string (required, unique)",
      source: "string (required, must match existing node id)",
      target: "string (required, must match existing node id)"
    }
  ]
}
```

### Node Types

| Type | Description | Example |
|------|-------------|---------|
| `trigger` | Starts the workflow | Webhook received, Schedule, Manual |
| `action` | Performs an action | API call, Send email, Post webhook |
| `condition` | Decision point | If/else logic, Data validation |
| `delay` | Wait for duration | Wait 1 hour, Delay 24 hours |

---

## Integration Example: AI Workflow Builder Button

```jsx
import React, { useState } from 'react';
import { generateWorkflowWithProgress, validatePrompt, getExamplePrompts } from '@/lib/aiAutoBuildApi';

function AIWorkflowBuilder({ onWorkflowGenerated }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    // Validate prompt
    const validation = validatePrompt(prompt);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setLoading(true);
    setError('');
    setProgress('Starting...');

    try {
      const result = await generateWorkflowWithProgress(
        prompt,
        (stage) => setProgress(stage),
        { model: 'gpt-4-turbo-preview' }
      );

      // Pass to parent component
      onWorkflowGenerated(result.workflow);

      // Show success
      alert(`Generated ${result.workflow.nodes.length} nodes successfully!`);
      setPrompt(''); // Clear input

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const examples = getExamplePrompts();

  return (
    <div className="ai-workflow-builder">
      <h3>AI Workflow Generator</h3>
      
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your workflow in natural language..."
        rows={4}
        disabled={loading}
      />

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {loading && progress && (
        <div className="progress-message">
          ⏳ {progress}
        </div>
      )}

      <button 
        onClick={handleGenerate} 
        disabled={loading || !prompt.trim()}
      >
        {loading ? 'Generating...' : '✨ Generate Workflow'}
      </button>

      <div className="examples">
        <p>Examples:</p>
        {examples.slice(0, 3).map((ex, i) => (
          <button 
            key={i}
            onClick={() => setPrompt(ex.prompt)}
            className="example-button"
          >
            {ex.title}
          </button>
        ))}
      </div>
    </div>
  );
}

export default AIWorkflowBuilder;
```

---

## Security Features

### 🔒 API Key Protection
- OpenAI API key stored in Supabase secrets (server-side only)
- Never exposed to client-side code
- Uses Supabase anon key for authentication

### 🛡️ Request Validation
- Maximum prompt size: 10KB
- Required field validation
- Type checking on all inputs

### 📊 Rate Limiting (Recommended)
```sql
-- Add rate limiting table
CREATE TABLE api_rate_limits (
  user_id uuid REFERENCES auth.users,
  endpoint text NOT NULL,
  request_count int DEFAULT 0,
  window_start timestamptz DEFAULT NOW(),
  PRIMARY KEY (user_id, endpoint)
);

-- Track AI auto-build usage
CREATE OR REPLACE FUNCTION track_ai_usage()
RETURNS trigger AS $$
BEGIN
  INSERT INTO api_rate_limits (user_id, endpoint, request_count)
  VALUES (auth.uid(), 'ai-auto-build', 1)
  ON CONFLICT (user_id, endpoint)
  DO UPDATE SET
    request_count = api_rate_limits.request_count + 1,
    window_start = CASE 
      WHEN NOW() - api_rate_limits.window_start > interval '1 hour'
      THEN NOW()
      ELSE api_rate_limits.window_start
    END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 🔐 CORS Configuration
- Allows all origins by default (`*`)
- Customize in edge function if needed:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

---

## Cost Management

### Token Usage Tracking

The API returns token usage in metadata:

```javascript
const result = await generateWorkflow(prompt);
console.log('Tokens used:', result.metadata.tokensUsed);

// Track costs
const costPerToken = 0.00001; // $0.01 per 1K tokens (GPT-4 Turbo)
const cost = result.metadata.tokensUsed * costPerToken;
console.log(`Request cost: $${cost.toFixed(4)}`);
```

### Cost Estimates (GPT-4 Turbo)

| Workflow Complexity | Avg Tokens | Avg Cost |
|---------------------|------------|----------|
| Simple (2-3 nodes) | 300-500 | $0.003-$0.005 |
| Medium (4-6 nodes) | 500-800 | $0.005-$0.008 |
| Complex (7+ nodes) | 800-1500 | $0.008-$0.015 |

**Monthly Budget Example:**
- 1,000 workflow generations
- Average 600 tokens each
- Total: 600,000 tokens
- Cost: ~$6/month

### Cost Optimization Tips

1. **Use GPT-3.5 for testing**
   ```javascript
   generateWorkflow(prompt, { model: 'gpt-3.5-turbo' }); // 10x cheaper
   ```

2. **Cache common workflows**
   ```javascript
   const cache = new Map();
   const cacheKey = prompt.toLowerCase().trim();
   
   if (cache.has(cacheKey)) {
     return cache.get(cacheKey);
   }
   
   const result = await generateWorkflow(prompt);
   cache.set(cacheKey, result);
   ```

3. **Implement daily limits per user**
   ```javascript
   const DAILY_LIMIT = 50; // generations per user per day
   ```

---

## Troubleshooting

### Error: "OpenAI API key not configured on server"

**Cause:** `OPENAI_API_KEY` secret not set in Supabase

**Solution:**
```bash
supabase secrets set OPENAI_API_KEY=sk-proj-your-key
supabase functions deploy ai-auto-build
```

---

### Error: "Invalid workflow structure"

**Cause:** AI model returned JSON that doesn't match schema

**Symptoms:**
- Missing node IDs
- Invalid node types
- Edges referencing non-existent nodes

**Solution:**
- Rephrase prompt to be more specific
- Use GPT-4 instead of GPT-3.5
- Check `validationErrors` array in response

---

### Error: "Request too large"

**Cause:** Prompt exceeds 10KB limit

**Solution:**
- Simplify workflow description
- Break into smaller workflows
- Use `validatePrompt()` before sending

---

### AI Returns Text Instead of JSON

**Cause:** Model ignored JSON-only instruction (rare with `response_format`)

**Handled Automatically:**
- Edge function tries to extract JSON from markdown
- Returns helpful error if extraction fails

**Manual Fix:** Use GPT-4 models which support `response_format: { type: 'json_object' }`

---

### Workflow Doesn't Match Intent

**Cause:** Ambiguous or unclear prompt

**Solution:**
- Be more specific about triggers and actions
- Mention exact node types needed
- Include conditional logic details

**Good Prompts:**
✅ "When webhook receives order data, check if amount > $100, then send to premium queue, else send to standard queue"

**Vague Prompts:**
❌ "Process orders differently based on value"

---

## Testing Checklist

- [ ] Deploy edge function
- [ ] Set OPENAI_API_KEY secret
- [ ] Test with simple prompt
- [ ] Verify workflow structure (nodes, edges)
- [ ] Test error handling (invalid prompt, empty prompt)
- [ ] Check token usage tracking
- [ ] Test with different models
- [ ] Verify CORS headers
- [ ] Test request size limits
- [ ] Integrate into React app
- [ ] Add loading states
- [ ] Handle errors gracefully

---

## Next Steps

1. **Deploy the function**
   ```bash
   supabase functions deploy ai-auto-build
   ```

2. **Add to your Builder UI**
   - Create "AI Generate" button
   - Show example prompts
   - Add loading state

3. **Implement usage tracking**
   - Log token usage per user
   - Set daily/monthly limits
   - Monitor costs

4. **Enhance prompts**
   - Add workflow templates
   - Provide context about available integrations
   - Guide users with examples

---

## Support

**Issues:**
- Check Supabase logs: `supabase functions logs ai-auto-build`
- Verify OpenAI API key is valid
- Test with curl command first

**Performance:**
- GPT-4 Turbo: 2-4 seconds per generation
- GPT-3.5: 1-2 seconds per generation
- Network latency may add 200-500ms

**Limitations:**
- Max prompt size: 10KB
- Max response size: ~2000 tokens
- Models don't have real-time data
- Workflow quality depends on prompt clarity

---

## API Changelog

**v1.0** (Current)
- Initial release
- GPT-4 Turbo support
- Strict JSON schema validation
- Error recovery from markdown
- Token usage tracking
- Request size limits
