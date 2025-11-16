# 🤖 OpenAI Chat API Integration - Complete Guide

## ✅ What Was Created

### **1. Supabase Edge Function: `openai-chat`**
**Location:** `supabase/functions/openai-chat/index.ts`

**Purpose:** Secure server-side proxy to OpenAI API
- Keeps API key hidden from client
- Validates requests
- Handles errors
- Rate limits with size restrictions

### **2. Client API Helper: `openaiApi.js`**
**Location:** `src/lib/openaiApi.js`

**Functions:**
- `sendChatMessage()` - Send chat completions
- `generateWorkflowFromPrompt()` - AI workflow generation
- `getWorkflowSuggestions()` - Get optimization tips

---

## 🚀 Deployment Steps

### **Step 1: Set OpenAI API Key in Supabase**

```bash
# Login to Supabase CLI
supabase login

# Link to your project (if not already)
supabase link --project-ref uecckpbdinbbbulmgfqx

# Set the OpenAI API key as a secret (server-side only)
supabase secrets set OPENAI_API_KEY=sk-proj-your-actual-key-here
```

**Why secrets?**
- Never exposed to client
- Only accessible in edge functions
- More secure than environment variables

---

### **Step 2: Deploy the Edge Function**

```bash
# Deploy the openai-chat function
supabase functions deploy openai-chat

# Verify it's deployed
supabase functions list
```

**Expected output:**
```
┌──────────────────┬────────────────────┬─────────────┐
│ Function         │ Status             │ Version     │
├──────────────────┼────────────────────┼─────────────┤
│ openai-chat      │ ACTIVE             │ v1          │
│ simulate-workflow│ ACTIVE             │ v1          │
│ forward-webhook  │ ACTIVE             │ v1          │
└──────────────────┴────────────────────┴─────────────┘
```

---

### **Step 3: Test the API**

```bash
# Test with curl
curl -X POST https://uecckpbdinbbbulmgfqx.supabase.co/functions/v1/openai-chat \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Say hello!"}
    ],
    "model": "gpt-3.5-turbo"
  }'
```

**Expected response:**
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1700000000,
  "model": "gpt-3.5-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 9,
    "total_tokens": 19
  }
}
```

---

## 📝 Usage in Your App

### **Example 1: Simple Chat**

```javascript
import { sendChatMessage } from './lib/openaiApi';

async function askAI() {
  const messages = [
    { role: 'user', content: 'What is a workflow?' }
  ];

  const { data, error } = await sendChatMessage(messages);

  if (error) {
    console.error('AI Error:', error);
    return;
  }

  console.log('AI Response:', data.choices[0].message.content);
}
```

### **Example 2: Generate Workflow from Prompt**

```javascript
import { generateWorkflowFromPrompt } from './lib/openaiApi';

async function createWorkflowWithAI() {
  const prompt = "Create a workflow that sends an email every Monday morning";

  const { data, error } = await generateWorkflowFromPrompt(prompt);

  if (error) {
    alert('Failed to generate workflow: ' + error);
    return;
  }

  console.log('Generated Workflow:', data);
  // data = { name, description, nodes, edges }
}
```

### **Example 3: Get Workflow Suggestions**

```javascript
import { getWorkflowSuggestions } from './lib/openaiApi';

async function getOptimizationTips() {
  const description = "My workflow sends emails to customers when they sign up";

  const { data, error } = await getWorkflowSuggestions(description);

  if (error) {
    alert('Failed to get suggestions: ' + error);
    return;
  }

  console.log('AI Suggestions:', data);
}
```

---

## 🔒 Security Features

### **Request Validation:**
- ✅ Max request size: 50KB
- ✅ Messages array validation
- ✅ Message format validation
- ✅ Role validation (system/user/assistant)

### **API Key Protection:**
- ✅ Never sent to client
- ✅ Stored in Supabase secrets
- ✅ Only accessible by edge function
- ✅ Not in git/environment files

### **Error Handling:**
- ✅ Invalid JSON → 400 Bad Request
- ✅ Missing messages → 400 Bad Request
- ✅ Request too large → 413 Payload Too Large
- ✅ OpenAI API errors → Pass through with details
- ✅ Server errors → 500 with safe message

---

## 📊 API Reference

### **POST /functions/v1/openai-chat**

**Request:**
```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "Hello!"}
  ],
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response (Success):**
```json
{
  "id": "chatcmpl-xxx",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help?"
      }
    }
  ],
  "usage": {
    "total_tokens": 25
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid request",
  "message": "messages field is required and must be an array"
}
```

---

## 🧪 Testing Checklist

- [ ] Edge function deployed successfully
- [ ] OPENAI_API_KEY secret set in Supabase
- [ ] Test curl command returns valid response
- [ ] Client can call sendChatMessage()
- [ ] Error handling works (invalid messages, etc.)
- [ ] Token usage is tracked
- [ ] No API key exposed in browser console

---

## 💡 Advanced: Add to Dashboard

Want to add AI chat to your Dashboard? Here's a quick example:

```javascript
// In Dashboard.jsx
import { sendChatMessage } from './lib/openaiApi';

const [aiResponse, setAiResponse] = useState('');
const [loading, setLoading] = useState(false);

const handleAskAI = async (question) => {
  setLoading(true);
  
  const { data, error } = await sendChatMessage([
    { role: 'user', content: question }
  ]);

  if (error) {
    alert('AI Error: ' + error);
  } else {
    setAiResponse(data.choices[0].message.content);
  }
  
  setLoading(false);
};

// In JSX:
<button onClick={() => handleAskAI('How do I optimize my workflow?')}>
  Ask AI
</button>
{loading && <p>Thinking...</p>}
{aiResponse && <p>{aiResponse}</p>}
```

---

## 📈 Monitoring

**View Edge Function Logs:**
```bash
# Real-time logs
supabase functions logs openai-chat --follow

# Recent logs
supabase functions logs openai-chat
```

**What to watch:**
- Request count
- Token usage (costs!)
- Error rates
- Response times

---

## 💰 Cost Management

**OpenAI Pricing (as of 2025):**
- GPT-3.5-Turbo: ~$0.002 / 1K tokens
- GPT-4: ~$0.03 / 1K tokens

**Tips:**
- Set `max_tokens` to limit cost per request
- Use GPT-3.5-turbo for most tasks
- Add rate limiting in edge function if needed
- Monitor usage in OpenAI dashboard

---

## 🐛 Troubleshooting

### **Error: "OpenAI API key not configured"**
**Fix:**
```bash
supabase secrets set OPENAI_API_KEY=sk-proj-your-key
```

### **Error: "Function not found"**
**Fix:**
```bash
supabase functions deploy openai-chat
```

### **Error: "Invalid JSON"**
**Fix:** Check request format, ensure messages array is properly formatted

### **Edge function not responding:**
**Check:**
1. Function deployed: `supabase functions list`
2. Logs for errors: `supabase functions logs openai-chat`
3. API key set: `supabase secrets list`

---

## ✅ Complete Setup Verification

Run through this checklist:

```bash
# 1. Check secrets
supabase secrets list
# Should show: OPENAI_API_KEY

# 2. Check functions
supabase functions list
# Should show: openai-chat (ACTIVE)

# 3. Test endpoint
curl -X POST https://uecckpbdinbbbulmgfqx.supabase.co/functions/v1/openai-chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
# Should return: {"id":"chatcmpl-...","choices":[...]}
```

**All working?** → ✅ **You're ready to use AI in your app!** 🚀

---

## 📚 Resources

- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Secrets Management](https://supabase.com/docs/guides/functions/secrets)

Need help? Check the logs and error messages - they're designed to be helpful! 🤖
