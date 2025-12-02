# Live Execution Orchestrator - Deployment Checklist

## ✅ What's Already Done
- [x] Migration file created: `supabase/migrations/20251122_create_workflow_executions.sql`
- [x] Edge Function created: `supabase/functions/execute-workflow/index.ts`
- [x] Client API created: `src/lib/executionApi.js`
- [x] UI integrated: Builder.jsx with Execute button

## 🚀 Deployment Steps

### 1. Run Database Migration
```bash
# Option A: Via Supabase Dashboard
# 1. Go to https://supabase.com/dashboard/project/uecckpbdinbbbulmgfqx/sql/new
# 2. Copy entire contents of: supabase/migrations/20251122_create_workflow_executions.sql
# 3. Paste and click "Run"

# Option B: Via CLI (when maintenance is complete)
supabase db push --project-ref uecckpbdinbbbulmgfqx
```

### 2. Deploy Edge Function
```bash
# Wait for Supabase maintenance to complete (estimated: Sat, 22 Nov 2025 13:15:00 GMT)
# Then run:
cd /Users/thiransamuthumala/CloLabs.io
supabase functions deploy execute-workflow --project-ref uecckpbdinbbbulmgfqx
```

### 3. Verify Deployment
```bash
# Check function is deployed
supabase functions list --project-ref uecckpbdinbbbulmgfqx

# Test the function
curl -X POST \
  'https://uecckpbdinbbbulmgfqx.supabase.co/functions/v1/execute-workflow' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "workflowModel": {
      "nodes": [{"id":"1","type":"start","data":{"label":"Test"}}],
      "edges": []
    },
    "inputPayload": {"test": true}
  }'
```

### 4. Test in UI
1. Open Builder: http://localhost:5174/builder
2. Create a simple workflow (Start → Action)
3. Click **Test** tab → **Execute (Live Run)**
4. Should see execution log panel with real-time progress

## 🔧 Troubleshooting

### "Network error: Unable to connect to execution service"
**Cause**: Edge Function not deployed yet  
**Fix**: Complete Step 2 above after maintenance window

### "Execution failed: Failed to create execution record"
**Cause**: Database migration not run  
**Fix**: Complete Step 1 above

### "OPENAI_API_KEY not configured"
**Cause**: Environment variable missing in Edge Function  
**Fix**: Set secret:
```bash
supabase secrets set OPENAI_API_KEY=sk-... --project-ref uecckpbdinbbbulmgfqx
```

### "Insufficient credits"
**Cause**: Credits system integration needed  
**Fix**: Ensure user_credits table has records for your user

## 📊 Verify Everything Works

### Check Database Tables
```sql
-- In Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('workflow_executions', 'execution_timeline', 'execution_logs');
```

### Check Edge Function
```sql
-- In Supabase Functions dashboard
-- Should see: execute-workflow (status: active)
```

### End-to-End Test
1. Create workflow with 2 nodes
2. Click Execute
3. Verify in database:
```sql
SELECT * FROM workflow_executions ORDER BY created_at DESC LIMIT 1;
SELECT * FROM execution_timeline WHERE execution_id = 'YOUR_EXECUTION_ID';
```

## 🎯 Current Status

**Maintenance Window**: Sat, 22 Nov 2025 13:15:00 GMT  
**Waiting For**: Supabase deployment service to come back online

**Next Step**: Run Step 1 (database migration) immediately, then Step 2 after maintenance completes.
