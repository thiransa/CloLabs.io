# Webhook Integration Setup Guide

This guide explains how to set up and use the webhook integration feature in CloLabs.

## Overview

The webhook integration allows you to:
- Manage webhook endpoints from a centralized location
- Configure workflow nodes to send data to external services
- Securely forward webhook payloads through an edge function
- Test webhooks directly from the workflow builder

## Setup Instructions

### 1. Database Migration

Run the SQL migration to create the `user_integrations` table:

```bash
# In Supabase SQL Editor, run:
supabase/migrations/20251112_create_user_integrations.sql
```

This creates:
- `user_integrations` table with RLS policies
- Indexes for performance
- Trigger for `updated_at` timestamp

### 2. Deploy Edge Function

Deploy the webhook forwarding edge function to Supabase:

```bash
# Using Supabase CLI
supabase functions deploy forward-webhook

# Or manually upload the function in Supabase Dashboard:
# Functions > Create new function > Upload supabase/functions/forward-webhook/index.ts
```

The edge function:
- Validates webhook URLs (must be http/https)
- Forwards payloads with proper headers
- Limits response size to 50KB
- Returns status, headers, and response data

### 3. Configure Environment Variables

Ensure your `.env` file has:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Usage

### Managing Webhooks

1. Navigate to `/integrations` page
2. Click "New Webhook" button
3. Enter:
   - **Name**: Friendly name (e.g., "Slack Notifications")
   - **URL**: Target endpoint (e.g., `https://hooks.slack.com/...`)
4. Click "Create Webhook"

**Features:**
- Toggle webhooks active/inactive
- Delete unused webhooks
- View webhook metadata (type, creation date)

### Configuring Workflow Nodes

1. Open Builder (`/builder`)
2. Add an "Action" node to your workflow
3. Select the node to open configuration panel
4. In "Action Type" dropdown, select "Webhook"
5. Choose either:
   - **Saved Webhook**: Select from your configured webhooks
   - **Custom URL**: Enter a one-time URL

6. Click "Save Configuration"

### Testing Webhooks

1. In Builder, switch to "Test" tab in right sidebar
2. Click "Run Test" button
3. The workflow will:
   - Find all webhook action nodes
   - Send test payloads through the edge function
   - Display results (status, duration)

**Test Payload Format:**
```json
{
  "workflowId": "uuid-or-local-id",
  "workflowName": "My Workflow",
  "nodeId": "node-1",
  "nodeLabel": "Send to Slack",
  "timestamp": "2025-11-12T10:30:00.000Z",
  "data": {
    // Node configuration data
  }
}
```

## Architecture

### Components

1. **Database** (`user_integrations` table)
   - Stores webhook configurations per user
   - RLS policies ensure users only access their webhooks

2. **Edge Function** (`forward-webhook`)
   - Receives: `{ targetUrl, payload }`
   - Validates URL format
   - Performs server-side fetch
   - Returns: `{ status, headers, responseText, duration }`

3. **Frontend API** (`src/lib/integrationsApi.js`)
   - CRUD operations for webhooks
   - `forwardWebhook()` function for execution

4. **Integrations Page** (`src/pages/Integrations.jsx`)
   - Webhook management UI
   - Create, view, toggle, delete webhooks

5. **Builder Integration** (`src/Builder.jsx`)
   - Loads user webhooks on mount
   - Dropdown for webhook selection
   - Custom URL input field
   - Simulation/execution logic

### Security Features

- **RLS Policies**: Users can only access their own webhooks
- **URL Validation**: Only http/https URLs allowed
- **Server-Side Forwarding**: Webhook calls go through edge function (not directly from browser)
- **Response Limiting**: Response bodies capped at 50KB
- **CORS Headers**: Proper CORS configuration for browser requests

### Error Handling

- Validates webhook URL format before saving
- Checks for authentication before database operations
- Handles edge function errors gracefully
- Provides user-friendly error messages
- Logs all operations to console for debugging

## API Reference

### `fetchUserIntegrations()`
Fetches all webhooks for the authenticated user.

**Returns:** `{ data: Array, error: any }`

### `createIntegration({ name, url, type })`
Creates a new webhook integration.

**Parameters:**
- `name` (string): Webhook name
- `url` (string): Target URL
- `type` (string, optional): Default 'webhook'

**Returns:** `{ data: object, error: any }`

### `deleteIntegration(id)`
Deletes a webhook by ID.

**Parameters:**
- `id` (string): Webhook UUID

**Returns:** `{ data: any, error: any }`

### `forwardWebhook(targetUrl, payload)`
Forwards payload to target URL via edge function.

**Parameters:**
- `targetUrl` (string): Destination URL
- `payload` (object): Data to send

**Returns:** `{ data: { status, headers, responseText, duration }, error: any }`

## Troubleshooting

### "Supabase not configured" error
- Check `.env` file has correct credentials
- Restart dev server after updating `.env`

### Webhooks not appearing in dropdown
- Check browser console for API errors
- Verify RLS policies in Supabase
- Ensure user is authenticated

### Edge function errors
- Check function is deployed: `supabase functions list`
- View function logs in Supabase Dashboard
- Verify CORS headers if seeing network errors

### Webhook execution fails
- Verify target URL is accessible
- Check target service accepts JSON POST requests
- Review edge function logs for detailed errors

## Future Enhancements

Potential improvements:
- Webhook authentication (API keys, OAuth)
- Request headers customization
- Retry logic for failed webhooks
- Webhook execution history/logs
- Batch webhook execution
- Conditional webhook triggers
- Response data mapping
- Webhook templates for popular services

## Files Created/Modified

**New Files:**
- `supabase/migrations/20251112_create_user_integrations.sql`
- `supabase/functions/forward-webhook/index.ts`
- `src/pages/Integrations.jsx`
- `src/pages/Integrations.css`
- `src/lib/integrationsApi.js`

**Modified Files:**
- `src/main.jsx` - Added /integrations route
- `src/Builder.jsx` - Added webhook loading, config UI, and execution

## Support

For issues or questions:
1. Check browser console for error logs
2. Review Supabase function logs
3. Verify database RLS policies
4. Check network tab for failed requests
