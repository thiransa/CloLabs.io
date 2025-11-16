#!/bin/bash
# CloLabs Webhook Testing Verification Script
# This script helps verify the webhook integration is working correctly

echo "🔍 CloLabs Webhook Integration Test Verification"
echo "================================================"
echo ""

# Check 1: Is the test webhook server running?
echo "1️⃣  Checking if test webhook server is running..."
if lsof -ti:3001 > /dev/null 2>&1; then
    echo "   ✅ Test webhook server is running on port 3001"
else
    echo "   ❌ Test webhook server is NOT running"
    echo "   Run: node test-webhook-server.js"
fi
echo ""

# Check 2: Is the dev server running?
echo "2️⃣  Checking if Vite dev server is running..."
if lsof -ti:5173 > /dev/null 2>&1; then
    echo "   ✅ Vite dev server is running on port 5173"
else
    echo "   ❌ Vite dev server is NOT running"
    echo "   Run: npm run dev"
fi
echo ""

# Check 3: Supabase connection
echo "3️⃣  Checking Supabase configuration..."
if [ -f ".env" ] || [ -f ".env.local" ]; then
    echo "   ✅ Environment file found"
    if grep -q "VITE_SUPABASE_URL" .env 2>/dev/null || grep -q "VITE_SUPABASE_URL" .env.local 2>/dev/null; then
        echo "   ✅ Supabase URL configured"
    else
        echo "   ⚠️  VITE_SUPABASE_URL not found in .env"
    fi
else
    echo "   ⚠️  No .env file found"
fi
echo ""

# Check 4: Edge functions status
echo "4️⃣  Checking Supabase Edge Functions..."
if command -v supabase &> /dev/null; then
    echo "   ✅ Supabase CLI installed"
    echo "   💡 To check edge function logs:"
    echo "      supabase functions logs simulate-workflow"
    echo "      supabase functions logs forward-webhook"
else
    echo "   ⚠️  Supabase CLI not installed"
    echo "   Install: npm install -g supabase"
fi
echo ""

echo "📝 Manual Testing Checklist:"
echo "================================================"
echo ""
echo "TEST 1: Create Generic Webhook Integration"
echo "-------------------------------------------"
echo "1. Go to: http://localhost:5173"
echo "2. Navigate to 'Integrations' section"
echo "3. Click '+ Add Webhook'"
echo "4. Select 'Generic Webhook'"
echo "5. Enter:"
echo "   - Name: Test Local Webhook"
echo "   - URL: http://localhost:3001/webhook"
echo "6. Click 'Create Integration'"
echo ""
echo "✅ Expected: Success message appears"
echo "✅ Expected: Webhook appears in list with masked URL"
echo ""

echo "TEST 2: Configure Workflow Node"
echo "-------------------------------------------"
echo "1. Go to 'Builder'"
echo "2. Create workflow: Trigger → Action"
echo "3. Click Action node"
echo "4. Set Action Type: 'Webhook'"
echo "5. Select: 'Test Local Webhook' from dropdown"
echo "6. Save workflow"
echo ""
echo "✅ Expected: Node config shows selected webhook"
echo ""

echo "TEST 3: Run Simulation"
echo "-------------------------------------------"
echo "1. Click 'Simulate Workflow' button"
echo "2. Watch the console logs (F12 in browser)"
echo "3. Check terminal running test-webhook-server.js"
echo ""
echo "📊 What to verify:"
echo ""
echo "Q1: Did webhook.site (or localhost:3001) receive POST?"
echo "    Check terminal for:"
echo "    🎯 Webhook received!"
echo "    Method: POST"
echo "    Headers: { \"x-clolabs-forward\": \"1\" }"
echo ""
echo "Q2: Did run timeline show success?"
echo "    Check browser UI for:"
echo "    ✅ Timeline entry with 'Webhook forwarded successfully'"
echo "    ✅ Status: 200"
echo "    ✅ Duration in ms"
echo ""
echo "Q3: Did runner call Edge Function?"
echo "    Check browser console (F12) for:"
echo "    [simulate-workflow] Forwarding webhook via Edge Function"
echo "    [forward-webhook] Processing webhook forward request"
echo ""
echo "Q4: Is URL saved correctly in database?"
echo "    Run this SQL query in Supabase SQL Editor:"
echo "    SELECT id, user_id, name, type, url, config, is_active"
echo "    FROM user_integrations"
echo "    WHERE type = 'webhook';"
echo ""
echo "    Expected result:"
echo "    - type: 'webhook'"
echo "    - url: 'http://localhost:3001/webhook'"
echo "    - config: { \"url\": \"http://localhost:3001/webhook\" }"
echo ""

echo "================================================"
echo "🔧 Debugging Commands:"
echo "================================================"
echo ""
echo "View browser console logs:"
echo "  Open DevTools (F12) → Console tab"
echo "  Filter: [simulate-workflow], [forward-webhook], [Builder]"
echo ""
echo "View Supabase logs (if deployed):"
echo "  supabase functions logs simulate-workflow --follow"
echo "  supabase functions logs forward-webhook --follow"
echo ""
echo "Check database directly:"
echo "  1. Go to: https://app.supabase.com"
echo "  2. Select your project"
echo "  3. Go to: Table Editor → user_integrations"
echo "  4. Check type='webhook' rows"
echo ""
echo "Test webhook server logs:"
echo "  Watch terminal running: node test-webhook-server.js"
echo "  Should show POST requests with full payload"
echo ""

echo "================================================"
echo "📞 Quick Test Commands:"
echo "================================================"
echo ""
echo "Test forward-webhook Edge Function directly (if deployed):"
echo "curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/forward-webhook \\"
echo "  -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{
  \"targetUrl\": \"http://localhost:3001/webhook\",
  \"payload\": {
    \"test\": \"direct edge function test\"
  }
}'"
echo ""
echo "================================================"
echo ""
echo "💡 Tips:"
echo "- Make sure both servers are running (dev + webhook)"
echo "- Check browser console for detailed logs"
echo "- Invalid URLs will be blocked with alert"
echo "- Deleted integrations show warning badge"
echo ""
