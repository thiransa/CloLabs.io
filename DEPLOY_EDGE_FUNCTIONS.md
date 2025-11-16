# Deploy Edge Functions to Supabase

## Prerequisites
Make sure you have Supabase CLI installed and authenticated:
```bash
# Install Supabase CLI (if not already installed)
brew install supabase/tap/supabase

# Login to Supabase
supabase login
```

## Step 1: Link Your Project
```bash
# Link to your Supabase project
supabase link --project-ref uecckpbdinbbbulmgfqx
```

## Step 2: Set OpenAI API Key
```bash
# Set your OpenAI API key as a secret
supabase secrets set OPENAI_API_KEY=your-openai-api-key-here
```

Replace `your-openai-api-key-here` with your actual OpenAI API key.

## Step 3: Deploy Edge Functions

Deploy all three AI-related edge functions:

```bash
# Deploy openai-chat function (for AI Helper Chat)
supabase functions deploy openai-chat

# Deploy ai-auto-build function (for workflow generation)
supabase functions deploy ai-auto-build

# Deploy simulate-workflow function (for GPT nodes in workflows)
supabase functions deploy simulate-workflow
```

## Step 4: Verify Deployment

Test the functions are working:

```bash
# Test openai-chat
curl -X POST https://uecckpbdinbbbulmgfqx.supabase.co/functions/v1/openai-chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'

# Test ai-auto-build
curl -X POST https://uecckpbdinbbbulmgfqx.supabase.co/functions/v1/ai-auto-build \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a simple workflow"}'
```

## Quick Deploy All

Deploy all functions at once:
```bash
supabase functions deploy openai-chat && \
supabase functions deploy ai-auto-build && \
supabase functions deploy simulate-workflow
```

## Troubleshooting

### CORS Errors
- Make sure functions are deployed
- Verify OPENAI_API_KEY is set in secrets
- Check browser console for detailed error messages

### API Key Errors
If you see "OpenAI API key not configured":
```bash
# Check current secrets
supabase secrets list

# Set the key again
supabase secrets set OPENAI_API_KEY=your-key
```

### Function Not Found
If you get 404 errors:
```bash
# Check deployed functions
supabase functions list

# Redeploy if needed
supabase functions deploy openai-chat
```
