# GPT Node Execution - Implementation Guide

## Overview

The workflow execution runner now supports GPT nodes that make real OpenAI API calls during workflow execution. This enables AI-powered text processing, analysis, generation, and transformation within workflows.

## Changes Made

### 1. New Function: `executeGPTNode()`

Added to `supabase/functions/simulate-workflow/index.ts`:

```typescript
async function executeGPTNode(node: Node, flowContext: object): Promise<object>
```

**Purpose:** Execute GPT nodes with real OpenAI API calls

**Features:**
✅ **Placeholder Replacement** - Replaces `{input}`, `{data}`, `{payload}` with flow context  
✅ **OpenAI Integration** - Calls Chat Completions API with configured model  
✅ **Timeout Protection** - 30-second timeout with abort controller  
✅ **Error Handling** - Catches API errors, timeouts, network failures  
✅ **Token Tracking** - Returns token usage (prompt, completion, total)  
✅ **Response Storage** - Sets `result.response` and `result.content`  

### 2. Enhanced Flow Context Passing

Updated `simulateWorkflow()` function to pass node results between nodes:

**Before:**
```typescript
// All nodes received same samplePayload
const result = await generateMockResult(currentNode, samplePayload, userId);
```

**After:**
```typescript
// Nodes receive accumulated flow context with previous results
const result = await generateMockResult(currentNode, currentFlowContext, userId);

// GPT node results update flow context
if (currentNode.type === 'gpt' && result.ok && result.response) {
  currentFlowContext = {
    ...currentFlowContext,
    previousNodeResult: result,
    gptResponse: result.response,
    originalPayload: samplePayload
  };
}
```

### 3. Added to Node Type Switch

```typescript
switch (node.type) {
  case 'gpt':
    return await executeGPTNode(node, payload);
  
  case 'action':
    // ... existing code
}
```

---

## GPT Node Execution Flow

### 1. Configuration Check
```typescript
const config = node.data?.config;
if (!config || !config.promptTemplate) {
  return { ok: false, error: 'GPT node not configured' };
}
```

### 2. Placeholder Replacement
```typescript
let finalPrompt = config.promptTemplate;

// Replace {input} with flow context
const contextString = typeof flowContext === 'string' 
  ? flowContext 
  : JSON.stringify(flowContext, null, 2);

finalPrompt = finalPrompt.replace(/\{input\}/g, contextString);
finalPrompt = finalPrompt.replace(/\{data\}/g, contextString);
finalPrompt = finalPrompt.replace(/\{payload\}/g, contextString);
```

**Supported Placeholders:**
- `{input}` - Primary placeholder for flow context
- `{data}` - Alias for flow context
- `{payload}` - Alias for flow context

### 3. API Call with Timeout
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${openaiApiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: config.gptModel || 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: finalPrompt }],
    temperature: parseFloat(config.temperature) || 0.7,
    max_tokens: parseInt(config.maxTokens) || 1000
  }),
  signal: controller.signal
});
```

### 4. Response Processing
```typescript
const responseData = await response.json();
const aiResponse = responseData.choices[0].message.content;

return {
  ok: true,
  response: aiResponse,
  content: aiResponse, // Alias
  model: responseData.model,
  tokensUsed: responseData.usage?.total_tokens || 0,
  duration,
  promptTokens: responseData.usage?.prompt_tokens || 0,
  completionTokens: responseData.usage?.completion_tokens || 0
};
```

### 5. Timeline Entry
```typescript
timeline.push({
  nodeId: currentNode.id,
  label: currentNode.data.label || currentNode.type,
  type: 'gpt',
  result: {
    ok: true,
    response: "AI generated text...",
    model: "gpt-4-turbo-preview",
    tokensUsed: 450,
    duration: 2340
  },
  timestamp: startTime,
  duration: 2340
});
```

---

## Flow Context Structure

### Initial Context (Trigger Node)
```json
{
  "userId": "123",
  "timestamp": "2025-11-16T10:30:00Z",
  "data": "Initial payload from trigger"
}
```

### After GPT Node Execution
```json
{
  "userId": "123",
  "timestamp": "2025-11-16T10:30:00Z",
  "data": "Initial payload from trigger",
  "previousNodeResult": {
    "ok": true,
    "response": "AI analysis: The text is positive...",
    "model": "gpt-4-turbo-preview",
    "tokensUsed": 320
  },
  "gptResponse": "AI analysis: The text is positive...",
  "originalPayload": { ... }
}
```

### In Subsequent Nodes
Subsequent nodes receive the accumulated context and can access:
- `flowContext.gptResponse` - Last GPT node response
- `flowContext.previousNodeResult` - Last executed node result
- `flowContext.originalPayload` - Initial trigger payload

---

## Example Workflow Scenarios

### Scenario 1: Text Analysis Pipeline

**Nodes:**
1. **Trigger** - Webhook receives customer feedback
2. **GPT Node** - Sentiment analysis
3. **Condition** - Check if sentiment is negative
4. **Action** - Send alert if negative

**GPT Node Config:**
```json
{
  "gptModel": "gpt-4-turbo-preview",
  "promptTemplate": "Analyze the sentiment of this customer feedback and classify as positive, negative, or neutral:\n\n{input}\n\nRespond with only the classification.",
  "maxTokens": 50,
  "temperature": 0.3
}
```

**Flow Context at Each Step:**

Step 1 - Trigger:
```json
{
  "feedback": "The product is terrible and doesn't work!"
}
```

Step 2 - After GPT:
```json
{
  "feedback": "The product is terrible and doesn't work!",
  "gptResponse": "negative",
  "previousNodeResult": {
    "ok": true,
    "response": "negative",
    "tokensUsed": 28
  }
}
```

Step 3 - Condition uses `flowContext.gptResponse === 'negative'`

---

### Scenario 2: Content Generation

**Nodes:**
1. **Trigger** - Manual trigger with topic
2. **GPT Node** - Generate blog outline
3. **GPT Node** - Expand first section
4. **Action** - Save to database

**GPT Node 1 Config:**
```json
{
  "promptTemplate": "Create a detailed blog post outline for this topic:\n\n{input}\n\nInclude 5 main sections with brief descriptions.",
  "maxTokens": 500
}
```

**GPT Node 2 Config:**
```json
{
  "promptTemplate": "Based on this outline:\n\n{gptResponse}\n\nWrite a detailed introduction section (300 words).",
  "maxTokens": 800
}
```

**Note:** Second GPT node receives first GPT's response via `{gptResponse}` placeholder.

---

### Scenario 3: Data Extraction

**Nodes:**
1. **Trigger** - Email webhook
2. **GPT Node** - Extract structured data
3. **Action** - POST to CRM API

**GPT Node Config:**
```json
{
  "promptTemplate": "Extract the following information from this email:\n- Name\n- Email\n- Company\n- Phone\n\nEmail content:\n{input}\n\nReturn as JSON.",
  "maxTokens": 200,
  "temperature": 0.1
}
```

**Timeline Result:**
```json
{
  "nodeId": "node-2",
  "type": "gpt",
  "result": {
    "ok": true,
    "response": "{\n  \"name\": \"John Smith\",\n  \"email\": \"john@example.com\",\n  \"company\": \"Acme Inc\",\n  \"phone\": \"+1-555-0123\"\n}",
    "tokensUsed": 156,
    "duration": 1890
  }
}
```

---

## Error Handling

### 1. Configuration Errors

**Error:** Missing prompt template
```json
{
  "ok": false,
  "error": "GPT node not configured: missing prompt template",
  "duration": 0
}
```

**Error:** OpenAI API key not set
```json
{
  "ok": false,
  "error": "OpenAI API key not configured on server",
  "duration": 0
}
```

### 2. API Errors

**Error:** Invalid model or parameters
```json
{
  "ok": false,
  "error": "The model `gpt-5` does not exist",
  "duration": 324
}
```

**Error:** Rate limit exceeded
```json
{
  "ok": false,
  "error": "Rate limit exceeded. Please try again later.",
  "duration": 456
}
```

### 3. Timeout Errors

**Error:** Request timeout
```json
{
  "ok": false,
  "error": "GPT request timeout after 30 seconds",
  "duration": 30000
}
```

### 4. Network Errors

**Error:** Connection failed
```json
{
  "ok": false,
  "error": "Failed to connect to OpenAI API",
  "duration": 5000
}
```

---

## Timeline Display

Timeline entries for GPT nodes show:

✅ **Success:**
```json
{
  "nodeId": "gpt-node-1",
  "label": "Analyze Sentiment",
  "type": "gpt",
  "result": {
    "ok": true,
    "response": "The sentiment is positive...",
    "model": "gpt-4-turbo-preview",
    "tokensUsed": 320,
    "promptTokens": 150,
    "completionTokens": 170,
    "duration": 2340
  },
  "timestamp": 1700136000000,
  "duration": 2340
}
```

❌ **Error:**
```json
{
  "nodeId": "gpt-node-1",
  "label": "Analyze Sentiment",
  "type": "gpt",
  "result": {
    "ok": false,
    "error": "Rate limit exceeded",
    "duration": 450
  },
  "timestamp": 1700136000000,
  "duration": 450
}
```

---

## Deployment Steps

### 1. Set OpenAI API Key

```bash
# Set the secret in Supabase
supabase secrets set OPENAI_API_KEY=sk-proj-your-actual-key-here

# Verify it's set
supabase secrets list
```

### 2. Deploy Updated Edge Function

```bash
# Deploy simulate-workflow with GPT support
supabase functions deploy simulate-workflow

# Check deployment
supabase functions list
```

### 3. Test GPT Node

```bash
# Create test workflow with GPT node
curl -X POST https://your-project.supabase.co/functions/v1/simulate-workflow \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowModel": {
      "nodes": [
        {
          "id": "node-1",
          "type": "trigger",
          "data": { "label": "Start" }
        },
        {
          "id": "node-2",
          "type": "gpt",
          "data": {
            "label": "Analyze Text",
            "config": {
              "gptModel": "gpt-4-turbo-preview",
              "promptTemplate": "Summarize in one sentence: {input}",
              "maxTokens": 100,
              "temperature": 0.7
            }
          }
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
    "samplePayload": {
      "text": "This is a test message for the AI to process."
    }
  }'
```

---

## Cost Tracking

### Token Usage in Timeline

Each GPT node execution returns token counts:

```json
{
  "tokensUsed": 450,
  "promptTokens": 280,
  "completionTokens": 170
}
```

### Calculate Cost

```javascript
// Token costs (as of Nov 2025)
const COSTS = {
  'gpt-4-turbo-preview': { input: 0.01, output: 0.03 }, // per 1K tokens
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
};

function calculateCost(model, promptTokens, completionTokens) {
  const cost = COSTS[model] || COSTS['gpt-4-turbo-preview'];
  const inputCost = (promptTokens / 1000) * cost.input;
  const outputCost = (completionTokens / 1000) * cost.output;
  return inputCost + outputCost;
}

// Example
const cost = calculateCost('gpt-4-turbo-preview', 280, 170);
console.log(`Cost: $${cost.toFixed(4)}`); // $0.0079
```

### Workflow Summary Cost

```javascript
function calculateWorkflowCost(timeline) {
  let totalCost = 0;
  
  timeline.forEach(entry => {
    if (entry.type === 'gpt' && entry.result.ok) {
      const cost = calculateCost(
        entry.result.model,
        entry.result.promptTokens || 0,
        entry.result.completionTokens || 0
      );
      totalCost += cost;
    }
  });
  
  return totalCost;
}
```

---

## Performance Considerations

### Typical Response Times

| Model | Avg Response Time | Tokens/sec |
|-------|------------------|------------|
| GPT-4 Turbo | 2-4 seconds | ~40-60 |
| GPT-4 | 4-8 seconds | ~20-30 |
| GPT-3.5 Turbo | 1-2 seconds | ~80-100 |

### Optimization Tips

1. **Use GPT-3.5 for Simple Tasks**
   - Faster responses
   - 10x cheaper
   - Good for classification, extraction

2. **Reduce Max Tokens**
   - Only request what you need
   - Shorter responses = faster + cheaper

3. **Lower Temperature for Consistent Tasks**
   - Sentiment analysis: 0.0-0.3
   - Data extraction: 0.1-0.2
   - Creative writing: 0.7-1.0

4. **Cache Common Prompts**
   - Store frequent results
   - Reduce API calls

---

## Troubleshooting

### "GPT node not configured"
**Cause:** Missing `config.promptTemplate`  
**Fix:** Ensure GPTNodeEditor was saved with prompt template

### "OpenAI API key not configured on server"
**Cause:** `OPENAI_API_KEY` secret not set  
**Fix:** `supabase secrets set OPENAI_API_KEY=sk-proj-...`

### "GPT request timeout after 30 seconds"
**Cause:** OpenAI API taking too long  
**Fix:** 
- Reduce `max_tokens` setting
- Check OpenAI status page
- Retry the workflow

### Empty or Null Response
**Cause:** Model returned empty content  
**Fix:**
- Check prompt template clarity
- Increase `max_tokens`
- Review OpenAI logs

### High Token Usage
**Cause:** Large input context or long prompts  
**Fix:**
- Truncate input data before GPT node
- Use more specific prompts
- Lower `max_tokens` setting

---

## Security Notes

✅ **API Key Protection**
- Stored in Supabase secrets (server-side)
- Never exposed to client
- Separate from environment variables

✅ **Request Validation**
- Node config validated before execution
- Timeout protection (30s max)
- Error messages sanitized

✅ **Data Privacy**
- Flow context passed securely through edge function
- No client-side OpenAI calls
- All data encrypted in transit

---

## Next Steps

1. ✅ **Deploy Edge Function** - `supabase functions deploy simulate-workflow`
2. ✅ **Test GPT Node** - Create workflow with GPT node and test
3. ⬜ **Add Cost Dashboard** - Display token usage per workflow run
4. ⬜ **Implement Caching** - Cache common AI responses
5. ⬜ **Add Streaming** - Support streaming responses for long outputs
6. ⬜ **Multi-Model Support** - Add Claude, Gemini, etc.

---

## Related Files

- `supabase/functions/simulate-workflow/index.ts` - Workflow execution runner (updated)
- `src/components/GPTNodeEditor.jsx` - GPT node configuration UI
- `src/lib/openaiApi.js` - Client-side OpenAI helper
- `GPT_NODE_EDITOR_GUIDE.md` - Editor component documentation
- `OPENAI_API_SETUP.md` - OpenAI API setup guide
