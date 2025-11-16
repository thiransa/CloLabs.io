# Quick Start Guide - Webhook Integration

## 🚀 Get Started in 5 Minutes

### Step 1: Database Setup (2 minutes)

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20251112_create_user_integrations.sql`
4. Click **Run**
5. Verify success message

### Step 2: Deploy Edge Function (1 minute)

**Option A: Using Supabase CLI**
```bash

```cd /Users/thiransamuthumala/CloLabs.io
supabase functions deploy forward-webhook

**Option B: Manual Upload**
1. Go to Supabase Dashboard > **Edge Functions**
2. Click **New Function**
3. Name it `forward-webhook`
4. Copy contents of `supabase/functions/forward-webhook/index.ts`
5. Paste and **Deploy**

### Step 3: Test the Integration (2 minutes)

1. **Start your dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Create a test webhook**:
   - From Dashboard, click **"Integrations"** in the sidebar
   - Click "+ Add Webhook"
   - Name: `Test Webhook`
   - URL: `https://webhook.site/unique-url` (get free URL from webhook.site)
   - Click "Create Webhook"

3. **Configure a workflow**:
   - Go to Builder (`/builder`)
   - In the left sidebar under "Basic" section, click **"Action"** (purple ⚡ icon)
   - Click on the Action node that appears on the canvas
   - In the right sidebar, set "Action Type" dropdown to **"Webhook"**
   - Select "Test Webhook" from the webhook dropdown
   - Click "Save Configuration"

4. **Run a test**:
   - Switch to "Test" tab in right sidebar
   - Click "Run Test"
   - Check webhook.site to see the received payload!

## ✅ Verification Checklist

- [ ] Database table `user_integrations` exists
- [ ] Edge function `forward-webhook` is deployed
- [ ] Can access Integrations section in Dashboard
- [ ] Can create a webhook
- [ ] Webhook appears in Builder dropdown
- [ ] "Run Test" executes and shows success message
- [ ] Webhook.site receives the test payload

## 🎯 What You Can Do Now

### Manage Webhooks
- Create unlimited webhooks
- Toggle active/inactive status
- Delete unused webhooks
- View all webhooks in one place

### Configure Workflows
- Select saved webhooks from dropdown
- Use custom one-off URLs
- Configure multiple webhook nodes per workflow
- Save configuration for reuse

### Execute Webhooks
- Click "Run Test" to execute all webhooks in workflow
- See real-time success/error feedback
- View execution duration
- Check console logs for details

## 🔧 Troubleshooting

### "Supabase not configured" error
```bash
# Check your .env file has correct values
cat .env

# Should show:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key

# Restart dev server
npm run dev
```

### Webhooks not loading
1. Open browser console (F12)
2. Look for `[integrationsApi]` or `[Builder]` logs
3. Check for authentication errors
4. Verify you're logged in

### Edge function not found
```bash
# List deployed functions
supabase functions list

# Should show: forward-webhook

# If not found, deploy it:
supabase functions deploy forward-webhook
```

## 📖 Example Use Cases

### 1. Slack Notification
```
Name: Slack Alert
URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 2. Discord Message
```
Name: Discord Bot
URL: https://discord.com/api/webhooks/YOUR/WEBHOOK
```

### 3. Custom API
```
Name: My API
URL: https://api.myservice.com/webhook
```

### 4. Zapier Integration
```
Name: Zapier Trigger
URL: https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID
```

### 5. Make.com (Integromat)
```
Name: Make Scenario
URL: https://hook.us1.make.com/YOUR_WEBHOOK_ID
```

## 📚 Next Steps

- Read full documentation: `WEBHOOK_INTEGRATION.md`
- Explore API reference
- Set up authentication headers (coming soon)
- Create webhook templates
- Build complex workflows

## 🎉 You're Ready!

Your CloLabs instance now has full webhook integration capabilities. Start automating!

---

**Need Help?**
- Check console logs (browser and Supabase)
- Review `WEBHOOK_INTEGRATION.md` for detailed docs
- Verify all environment variables are set
- Ensure Supabase project is accessible
