# AI Helper Chat - Integration Guide

## Overview

`AIHelperChat.jsx` is a floating chat assistant that helps users with workflow building. It uses OpenAI via your secure edge function.

## Features

✅ **Floating Button** - Bottom-right corner, non-intrusive  
✅ **Chat Drawer** - Clean, modern sliding panel  
✅ **Real-time Chat** - Messages with typing indicator  
✅ **Context Aware** - Knows about current workflow (sanitized)  
✅ **Message Limits** - 2000 character max per message  
✅ **Security** - No secrets sent, only safe workflow metadata  
✅ **Token Display** - Shows API usage per message  
✅ **Error Handling** - Graceful error messages  
✅ **Responsive** - Works on mobile and desktop  

---

## Quick Integration

### Option 1: Add to Builder Page

In `Builder.jsx`, import and add at the end:

```jsx
import AIHelperChat from './components/AIHelperChat.jsx';

const Builder = () => {
  // ... existing code ...
  
  return (
    <div className="builder-wrapper">
      {/* ... existing UI ... */}
      
      {/* Add AI Helper Chat at the end */}
      <AIHelperChat currentWorkflow={workflows[activeWorkflow]} />
    </div>
  );
};
```

### Option 2: Add Globally to App

In `App.jsx`:

```jsx
import AIHelperChat from './components/AIHelperChat.jsx';

function App() {
  return (
    <Router>
      {/* ... routes ... */}
      
      {/* Add globally - available on all pages */}
      <AIHelperChat />
    </Router>
  );
}
```

---

## Props

### `currentWorkflow` (optional)
Pass the current workflow object to provide context to the AI:

```jsx
<AIHelperChat currentWorkflow={workflows[activeWorkflow]} />
```

**What gets sent to AI (sanitized):**
```javascript
{
  nodeCount: 5,
  nodeTypes: ['trigger', 'action', 'gpt', 'condition', 'action'],
  hasConnections: true,
  workflowName: 'Email Automation'
}
```

**What does NOT get sent:**
- ❌ API keys
- ❌ Webhook URLs
- ❌ User credentials
- ❌ Sensitive node configurations
- ❌ Personal data

---

## How It Works

### 1. User Opens Chat
- Clicks floating button (bottom-right)
- Chat drawer slides in from right
- Shows welcome message

### 2. User Asks Question
```
User: "How do I connect a trigger to an action?"
```

### 3. AI Responds
```
AI: "To connect nodes, hover over the trigger node, 
click the connection point, then drag to the 
action node and release. The connection will be 
created automatically."
```

### 4. Context Awareness
If user has a workflow open:
```
User: "How many nodes do I have?"

AI: "You currently have 5 nodes in your workflow:
1 trigger, 2 actions, 1 GPT node, and 1 condition."
```

---

## Message Flow

```
User types message
    ↓
Client validates (max 2000 chars)
    ↓
Adds user message to chat
    ↓
Shows "typing..." indicator
    ↓
Calls sendChatMessage() from openaiApi.js
    ↓
Edge function calls OpenAI
    ↓
Receives AI response
    ↓
Displays in chat with timestamp
    ↓
Shows token usage
```

---

## API Configuration

Uses existing OpenAI integration:
- Model: `gpt-3.5-turbo` (fast and economical)
- Max tokens: 500 per response
- Temperature: 0.7 (balanced)
- Context: Last 10 messages

**Cost per message:** ~$0.0001-0.0005 (very cheap!)

---

## UI Components

### Floating Button
```
┌──────┐
│  💬  │  ← Bottom-right corner
└──────┘
```

### Chat Drawer (Open)
```
┌─────────────────────────┐
│ 💬 AI Assistant         │ ← Header
│    Workflow Help     ⊗  │
├─────────────────────────┤
│                         │
│ 🤖 Hi! I'm your AI...   │ ← Messages
│                         │
│           Hello! 👋 You │
│                         │
│ 🤖 typing...            │
│                         │
├─────────────────────────┤
│ [Ask me anything...] 📤 │ ← Input
└─────────────────────────┘
```

---

## Example Conversations

### Workflow Help
```
User: "What's a GPT node?"
AI: "A GPT node uses AI to process text in your workflow. 
You can use it for sentiment analysis, data extraction, 
content generation, and more. Configure it by selecting 
the node and choosing your model and prompt template."
```

### Troubleshooting
```
User: "My workflow isn't running"
AI: "Let me help! Check these common issues:
1. Is your trigger configured?
2. Are all nodes connected?
3. Do action nodes have required settings filled in?
Click 'Run Test' and check the timeline for specific errors."
```

### Best Practices
```
User: "How do I build an email automation?"
AI: "Here's a basic email automation workflow:
1. Add a Trigger node (webhook or schedule)
2. Add a GPT node to process/generate content
3. Add a Condition to check if criteria are met
4. Add an Action node for sending email
5. Connect them: Trigger → GPT → Condition → Action"
```

---

## Customization

### Change Colors
In the `<style>` section:
```css
.ai-chat-fab {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Change to your brand colors */
}
```

### Change Position
```css
.ai-chat-fab, .ai-chat-drawer {
  bottom: 24px;  /* Change vertical position */
  right: 24px;   /* Change horizontal position */
}
```

### Change Size
```css
.ai-chat-drawer {
  width: 380px;      /* Change width */
  height: 600px;     /* Change height */
}
```

### Change Model
In `handleSend()`:
```javascript
const result = await sendChatMessage(apiMessages, {
  model: 'gpt-4-turbo-preview',  // Use GPT-4 for better responses
  temperature: 0.7,
  max_tokens: 1000               // Longer responses
});
```

---

## Security Features

### 1. Sanitized Workflow Context
Only safe metadata sent:
```javascript
const getWorkflowContext = () => {
  return {
    nodeCount: nodes.length,           // ✅ Safe
    nodeTypes: nodes.map(n => n.type), // ✅ Safe
    hasConnections: true,              // ✅ Safe
    workflowName: 'My Workflow'        // ✅ Safe
    // ❌ NO: API keys, URLs, credentials
  };
};
```

### 2. Message Length Limits
- Max 2000 characters per message
- Prevents abuse and excessive API costs
- Character counter shows when approaching limit

### 3. Recent Messages Only
- Only sends last 10 messages for context
- Keeps token usage low
- Prevents context window overflow

### 4. Error Handling
- Network errors caught gracefully
- API errors displayed to user
- No sensitive error details exposed

---

## Testing

### 1. Test Chat Opening
```javascript
// Click floating button
// Verify chat drawer opens
// Check welcome message appears
```

### 2. Test Message Sending
```javascript
// Type "Hello"
// Press Enter
// Verify message appears
// Verify "typing..." indicator
// Verify AI response
```

### 3. Test Context Awareness
```javascript
// Open Builder with workflow
// Ask "How many nodes?"
// Verify AI mentions actual count
```

### 4. Test Error Handling
```javascript
// Disconnect from internet
// Send message
// Verify error message displays
```

---

## Performance

### Bundle Size
- Component: ~4KB minified
- No heavy dependencies
- Pure React + Lucide icons

### API Costs
- GPT-3.5 Turbo: ~$0.0001 per message
- Average conversation (10 messages): ~$0.001
- 1000 conversations: ~$1

### Load Time
- Lazy loaded (only when opened)
- No impact on initial page load
- Minimal memory footprint

---

## Troubleshooting

### Issue: Chat button not showing
**Check:** Import added to Builder.jsx  
**Fix:** Add `import AIHelperChat from './components/AIHelperChat.jsx'`

### Issue: "Failed to get response"
**Check:** OpenAI edge function deployed  
**Fix:** 
```bash
supabase functions deploy openai-chat
```

### Issue: No context about workflow
**Check:** Passing currentWorkflow prop  
**Fix:** `<AIHelperChat currentWorkflow={workflows[activeWorkflow]} />`

### Issue: Typing indicator stuck
**Check:** Network/API error  
**Fix:** Check browser console for errors

---

## Example Integration in Builder.jsx

Complete example:

```jsx
import React, { useState } from 'react';
import AIHelperChat from './components/AIHelperChat.jsx';
import './Builder.css';

const Builder = () => {
  const [workflows, setWorkflows] = useState({ /* ... */ });
  const [activeWorkflow, setActiveWorkflow] = useState(1);
  
  return (
    <div className="builder-wrapper">
      {/* Your existing Builder UI */}
      <div className="builder-main-layout">
        {/* Left sidebar, canvas, right sidebar */}
      </div>
      
      {/* Add AI Helper Chat - floats over everything */}
      <AIHelperChat 
        currentWorkflow={workflows[activeWorkflow]}
      />
    </div>
  );
};

export default Builder;
```

---

## Future Enhancements

### Suggested Features:
1. **Voice Input** - Speech-to-text for hands-free
2. **Message History** - Save conversations locally
3. **Quick Actions** - "Create trigger node" buttons
4. **Code Generation** - Generate workflow JSON
5. **Templates** - AI suggests workflow templates
6. **Multi-language** - Support other languages
7. **Feedback** - Thumbs up/down on responses
8. **Export Chat** - Download conversation

---

## Related Files

- `src/components/AIHelperChat.jsx` - Main component
- `src/lib/openaiApi.js` - API helper functions
- `supabase/functions/openai-chat/index.ts` - Secure OpenAI proxy
- `OPENAI_API_SETUP.md` - API configuration guide

---

## Support

For issues:
1. Check browser console for errors
2. Verify OpenAI edge function is deployed
3. Test with simple "Hello" message
4. Check network tab for API calls

The AI Helper Chat is now ready to help your users build workflows! 🎉
