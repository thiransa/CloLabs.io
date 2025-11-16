# 🧪 Webhook Integration Testing Guide

## Quick Verification Checklist

Answer these 4 questions to verify your webhook integration is working:

---

## ✅ **Question 1: Did webhook.site (or localhost:3001) receive the POST?**

### How to Check:

**Terminal where test-webhook-server.js is running:**

Look for output like this:
```
🎯 Webhook received!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Method: POST                           ← Must be POST, not GET
URL: /webhook
Headers: {
  "content-type": "application/json",
  "x-clolabs-forward": "1",           ← This confirms it went through edge function
  "user-agent": "CloLabs-Webhook-Forwarder/1.0"
}

📦 Payload:
{
  "event": "workflow_execution",
  "workflowId": "...",
  "nodeId": "...",
  "data": { ... },
  "timestamp": "2025-11-16T..."
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### ✅ **Expected Answer: YES**
- Method is POST (not GET)
- Headers include `x-clolabs-forward: 1`
- Payload is JSON with workflow data

### ❌ **If NO:**
- Check if test server is running: `lsof -ti:3001`
- Verify URL in node config: `http://localhost:3001/webhook`
- Check browser console for errors

---

## ✅ **Question 2: Did run timeline/log show a success entry?**

### How to Check:

**In Browser UI (Builder page):**

After clicking "Simulate Workflow", look at the timeline panel on the right:

```
Timeline Entry for Webhook Node:
┌─────────────────────────────────────┐
│ ✓ Action - Webhook                  │
│                                      │
│ Status: 200 OK                       │
│ Message: Webhook forwarded           │
│          successfully (200)          │
│ Duration: 245ms                      │
│ Forwarded: true                      │
└─────────────────────────────────────┘
```

### ✅ **Expected Answer: YES**
- Timeline shows checkmark ✓
- Status: 200
- Message: "Webhook forwarded successfully"
- Duration in milliseconds
- `forwarded: true` in details

### ❌ **If NO (shows error):**

**Check what error message appears:**

| Error Message | Cause | Fix |
|--------------|-------|-----|
| "Webhook integration not found or was deleted" | Integration deleted from DB | Select valid webhook or use custom URL |
| "No webhook URL configured" | No URL set in node | Select webhook or paste URL |
| "Invalid webhook URL" | URL doesn't start with http(s) | Use valid URL format |
| "Network error" | Can't reach webhook server | Check server is running |
| "Request timeout" | Took >30 seconds | Check webhook endpoint responds faster |

**Check browser console (F12):**
```javascript
// Look for these logs:
[simulate-workflow] Processing generic webhook node: node-123
[simulate-workflow] Forwarding webhook via Edge Function
[forward-webhook] Processing webhook forward request
```

---

## ✅ **Question 3: Did the runner call your Edge Function?**

### How to Check:

**Browser Console (F12 → Console tab):**

Filter for logs containing `[simulate-workflow]` or `[forward-webhook]`:

```javascript
[simulate-workflow] Processing generic webhook node: node-abc123
[simulate-workflow] Using saved integration URL
[simulate-workflow] Forwarding webhook via Edge Function
[forward-webhook] Processing webhook forward request  ← Edge function called!
[forward-webhook] Response received in 180 ms
[simulate-workflow] Forward response: 200 true
```

### ✅ **Expected Answer: YES**
- Console shows `[forward-webhook]` logs
- Edge function processed the request
- Response received with status code

### ❌ **If NO:**

**What you'll see instead:**
```javascript
// If edge function NOT called, you might see:
[simulate-workflow] Processing generic webhook node: node-123
[simulate-workflow] Webhook request failed: Failed to fetch
// Missing [forward-webhook] logs
```

**Possible causes:**
1. **Edge function not deployed:**
   ```bash
   supabase functions deploy forward-webhook
   supabase functions deploy simulate-workflow
   ```

2. **Edge function URL incorrect:**
   Check in `simulate-workflow/index.ts`:
   ```typescript
   const forwardUrl = `${supabaseUrl}/functions/v1/forward-webhook`;
   // Should use your Supabase project URL
   ```

3. **Authorization issue:**
   Check Supabase keys in `.env`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

**To check Supabase edge function logs:**
```bash
# If deployed to Supabase
supabase functions logs forward-webhook --follow
supabase functions logs simulate-workflow --follow
```

---

## ✅ **Question 4: Did the node config save the URL correctly?**

### How to Check in Database:

**Option A: Supabase Dashboard (Web UI)**

1. Go to: https://app.supabase.com
2. Select your project
3. Go to: **Table Editor** → **user_integrations**
4. Find the row with `type = 'webhook'`
5. Check these fields:

```json
{
  "id": "abc-123-def",
  "user_id": "user-uuid",
  "name": "Test Local Webhook",
  "type": "webhook",                                    ← Must be 'webhook'
  "url": "http://localhost:3001/webhook",              ← Full URL
  "config": {
    "url": "http://localhost:3001/webhook"             ← URL inside config
  },
  "is_active": true,
  "created_at": "2025-11-16T..."
}
```

**Option B: SQL Query**

Run this in Supabase SQL Editor:
```sql
SELECT 
  id,
  user_id,
  name,
  type,
  url,
  config,
  is_active,
  created_at
FROM user_integrations
WHERE type = 'webhook'
ORDER BY created_at DESC
LIMIT 5;
```

### ✅ **Expected Answer: YES**
- Row exists in `user_integrations` table
- `type` = `'webhook'` (not 'slack')
- `url` field contains full URL
- `config` object contains `{ "url": "..." }`
- `is_active` = `true`

### ❌ **If NO (data incorrect):**

**Problem 1: type is NULL or wrong**
- Check Dashboard.jsx `handleCreateIntegration()`
- Should set: `type: 'webhook'`

**Problem 2: URL not in config**
- Check Dashboard.jsx integration data:
```javascript
integrationData = {
  name: integrationFormData.name,
  url: integrationFormData.url,
  type: 'webhook',
  config: { url: integrationFormData.url }  // ← Must include this
}
```

**Problem 3: Row doesn't exist**
- Check for errors in browser console during integration creation
- Check RLS policies allow insert:
```sql
-- Should have policy like:
CREATE POLICY "Users can insert their own integrations"
ON user_integrations FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 🎯 Complete Test Flow Diagram

```
1. User clicks "Simulate Workflow"
         ↓
2. Builder validates webhook nodes
         ↓
3. Builder sends request to simulate-workflow edge function
         ↓
4. simulate-workflow detects webhook node
         ↓
5. simulate-workflow fetches integration from user_integrations table
         ↓
6. simulate-workflow calls forward-webhook edge function
         ↓
7. forward-webhook validates and forwards to target URL
         ↓
8. Target webhook (localhost:3001) receives POST
         ↓
9. forward-webhook returns response
         ↓
10. simulate-workflow adds to timeline
         ↓
11. Builder displays success in UI
```

---

## 📊 Expected Console Output (Complete Flow)

```javascript
// === Browser Console ===
[Dashboard] Creating integration: {...}
[Dashboard] Integration created: abc-123-def

[Builder] Selected webhook: {id: "abc-123-def", name: "Test Local Webhook"}
[Builder] Starting workflow simulation...

[simulate-workflow] Processing generic webhook node: node-123
[simulate-workflow] Using saved integration URL
[simulate-workflow] Forwarding webhook via Edge Function

[forward-webhook] Processing webhook forward request
[forward-webhook] Response received in 180 ms
[forward-webhook] Response length: 95

[simulate-workflow] Forward response: 200 true
[Builder] Simulation completed successfully
```

```bash
# === Terminal (test-webhook-server.js) ===
🎯 Webhook received!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Method: POST
URL: /webhook
Headers: {
  "content-type": "application/json",
  "x-clolabs-forward": "1",
  "user-agent": "CloLabs-Webhook-Forwarder/1.0"
}

📦 Payload:
{
  "event": "workflow_execution",
  "workflowId": "workflow-123",
  "nodeId": "node-123",
  "data": {
    "workflowId": "workflow-123",
    "workflowName": "Test Workflow",
    "timestamp": "2025-11-16T10:30:00.000Z",
    "testData": {
      "message": "This is a test simulation"
    }
  },
  "timestamp": "2025-11-16T10:30:00.123Z"
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🐛 Troubleshooting Guide

### Issue: Nothing happens when clicking Simulate

**Check:**
- [ ] Workflow has at least one node
- [ ] Nodes are connected (Trigger → Action)
- [ ] No validation errors on webhook node
- [ ] Browser console shows no errors

### Issue: Alert blocks simulation

**Common alerts:**
- "Invalid webhook URL" → Fix URL format
- "Webhook integration deleted" → Select different webhook
- "No webhook URL configured" → Set URL in node config

### Issue: Simulation runs but webhook not received

**Check:**
1. Test server running: `lsof -ti:3001`
2. URL in node config matches server: `http://localhost:3001/webhook`
3. Edge functions deployed (if using Supabase)
4. Network tab (F12) shows requests to edge functions

### Issue: Database row missing or incorrect

**Fix:**
1. Go to Integrations page
2. Delete the webhook
3. Create new one with correct details
4. Verify in database again

---

## ✅ Summary Checklist

Run through this after testing:

- [ ] **Q1:** Webhook server received POST with `x-clolabs-forward: 1`
- [ ] **Q2:** Timeline shows success with status 200
- [ ] **Q3:** Console shows `[forward-webhook]` logs
- [ ] **Q4:** Database has `type='webhook'` with URL in `config`

**All 4 checked?** → ✅ **Integration working perfectly!**

**Some unchecked?** → 🔧 **Use troubleshooting guide above**

---

Need help? Check the detailed logs and match against expected outputs above! 🚀
