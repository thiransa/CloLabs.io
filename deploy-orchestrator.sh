#!/bin/bash
# Quick deployment script for live-run orchestrator

PROJECT_REF="uecckpbdinbbbulmgfqx"
SUPABASE_URL="https://uecckpbdinbbbulmgfqx.supabase.co"

echo "🚀 Deploying Live-Run Orchestrator"
echo "=================================="
echo ""

# Step 1: Deploy Edge Function
echo "📦 Step 1: Deploying execute-workflow Edge Function..."
supabase functions deploy execute-workflow --project-ref $PROJECT_REF

if [ $? -eq 0 ]; then
  echo "✅ Edge Function deployed successfully!"
else
  echo "❌ Edge Function deployment failed. Supabase might be under maintenance."
  echo "   Try again later or check: https://status.supabase.com"
  exit 1
fi

echo ""
echo "=================================="
echo "✅ Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Run the database migration manually in Supabase SQL Editor:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo ""
echo "2. Copy and run: supabase/migrations/20251122_create_workflow_executions.sql"
echo ""
echo "3. Test in your app:"
echo "   - Open Builder"
echo "   - Create a workflow"
echo "   - Click 'Execute (Live Run)'"
echo ""
echo "🔗 Function URL: $SUPABASE_URL/functions/v1/execute-workflow"
