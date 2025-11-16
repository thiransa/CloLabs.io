# Adding GPT Node to Builder UI - Quick Integration

## What Was Built

✅ **GPTNodeEditor Component** (`src/components/GPTNodeEditor.jsx`)  
✅ **Workflow Execution Handler** (Updated `simulate-workflow` edge function)  
✅ **Flow Context Passing** (Results passed between nodes)  
✅ **Complete Documentation** (3 guide files created)  

---

## How to Add GPT Node to Builder

### Step 1: Add GPT Node Type to Left Sidebar Palette

In `Builder.jsx`, add GPT node to your node palette:

```jsx
const nodeTypes = [
  { type: 'trigger', icon: Zap, label: 'Trigger', color: '#10b981' },
  { type: 'action', icon: Play, label: 'Action', color: '#3b82f6' },
  { type: 'condition', icon: FileText, label: 'Condition', color: '#f59e0b' },
  { type: 'delay', icon: Clock, label: 'Delay', color: '#8b5cf6' },
  { type: 'gpt', icon: Sparkles, label: 'GPT AI', color: '#ec4899' }, // NEW!
];
```

### Step 2: Handle GPT Node Selection in Config Panel

In the right sidebar setup panel, add conditional rendering:

```jsx
import GPTNodeEditor from './components/GPTNodeEditor.jsx';

// Inside your setup tab rendering
{activeRightTab === 'setup' && selectedNode && (
  <>
    {/* For GPT type nodes, show GPT editor */}
    {selectedNode.type === 'gpt' ? (
      <GPTNodeEditor
        node={selectedNode}
        onSave={(config) => {
          // Update node with GPT config
          setWorkflows(prev => {
            const workflow = prev[activeWorkflow];
            const updatedNodes = workflow.nodes.map(node =>
              node.id === selectedNodeId
                ? { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      config: { 
                        ...node.data?.config, 
                        ...config 
                      } 
                    } 
                  }
                : node
            );
            return {
              ...prev,
              [activeWorkflow]: { ...workflow, nodes: updatedNodes }
            };
          });
          alert('GPT configuration saved successfully!');
        }}
      />
    ) : selectedNode.type === 'action' ? (
      // Existing action node config
      <div className="config-panel">
        {/* Your existing action config UI */}
      </div>
    ) : (
      // Other node types
      <div className="config-panel">
        {/* Your existing config UI */}
      </div>
    )}
  </>
)}
```

### Alternative: Add GPT as Action Subtype

If you prefer GPT as an action type instead of separate node:

```jsx
{selectedNode.type === 'action' && (
  <>
    <div className="config-item">
      <label className="config-label">Action Type</label>
      <select 
        className="config-select"
        value={selectedNode.data?.config?.actionType || 'API Request'}
        onChange={(e) => {
          // Handle change
        }}
      >
        <option>API Request</option>
        <option>Send Email</option>
        <option>Transform Data</option>
        <option>AI Processing</option> {/* NEW! */}
        <option>Webhook</option>
      </select>
    </div>

    {/* Show GPT editor when AI Processing selected */}
    {selectedNode.data?.config?.actionType === 'AI Processing' && (
      <GPTNodeEditor
        node={selectedNode}
        onSave={(config) => {
          // Save config
        }}
      />
    )}
  </>
)}
```

---

## Step 3: Deploy Edge Function

```bash
# Ensure OpenAI API key is set
supabase secrets set OPENAI_API_KEY=sk-proj-your-actual-key-here

# Deploy updated simulate-workflow
supabase functions deploy simulate-workflow

# Verify deployment
supabase functions list
```

---

## Step 4: Test End-to-End

### Create Test Workflow

1. Add **Trigger** node (Manual or Webhook)
2. Add **GPT** node
3. Configure GPT node:
   - Model: GPT-4 Turbo
   - Prompt: `Analyze this feedback: {input}`
   - Max Tokens: 500
   - Temperature: 0.7
4. Test with sample payload:
   ```json
   {
     "feedback": "The product is amazing!"
   }
   ```
5. Click "Run Test" or "Simulate"
6. Check timeline for GPT response

### Expected Timeline Entry

```json
{
  "nodeId": "node-2",
  "label": "GPT Analysis",
  "type": "gpt",
  "result": {
    "ok": true,
    "response": "The feedback is very positive...",
    "model": "gpt-4-turbo-preview",
    "tokensUsed": 320,
    "duration": 2340
  },
  "timestamp": 1700136000000,
  "duration": 2340
}
```

---

## Visual Integration Example

### Node Palette (Left Sidebar)

```
┌─────────────────────┐
│  Basic Nodes        │
├─────────────────────┤
│ ⚡ Trigger          │
│ ▶  Action           │
│ 📄 Condition        │
│ ⏱  Delay            │
│ ✨ GPT AI          │ ← NEW!
└─────────────────────┘
```

### Config Panel (Right Sidebar)

```
┌────────────────────────────┐
│ GPT / AI Processing        │
├────────────────────────────┤
│ Model: [GPT-4 Turbo ▼]    │
│                            │
│ Prompt Template:           │
│ ┌──────────────────────┐   │
│ │ Analyze: {input}     │   │
│ └──────────────────────┘   │
│                            │
│ Max Tokens: [1000]         │
│ Temperature: ●────○         │
│                  0.7        │
│                            │
│ Test Example:              │
│ ┌──────────────────────┐   │
│ │ Sample text...       │   │
│ └──────────────────────┘   │
│                            │
│ [▶ Test Prompt]            │
│                            │
│ ✓ Success! (320 tokens)   │
│ Response: "The text is..." │
│                            │
│ [💾 Save Configuration]    │
└────────────────────────────┘
```

---

## Complete Integration Checklist

- [ ] Import `GPTNodeEditor` component
- [ ] Add `Sparkles` icon from lucide-react
- [ ] Add 'gpt' to node types array (or 'AI Processing' to action types)
- [ ] Add conditional rendering for GPT config panel
- [ ] Implement `onSave` handler to update node config
- [ ] Test GPT node creation in canvas
- [ ] Test GPT node configuration with test button
- [ ] Set `OPENAI_API_KEY` secret in Supabase
- [ ] Deploy `simulate-workflow` edge function
- [ ] Test end-to-end workflow with GPT node
- [ ] Verify timeline shows GPT response
- [ ] Check token usage in results

---

## Minimal Integration Code

If you want the absolute minimum code to add GPT support:

```jsx
// 1. Import
import GPTNodeEditor from './components/GPTNodeEditor.jsx';
import { Sparkles } from 'lucide-react';

// 2. Add to node palette
{ type: 'gpt', icon: Sparkles, label: 'GPT AI', color: '#ec4899' }

// 3. Add to config panel
{selectedNode?.type === 'gpt' && (
  <GPTNodeEditor
    node={selectedNode}
    onSave={(config) => {
      setWorkflows(prev => {
        const workflow = prev[activeWorkflow];
        const updatedNodes = workflow.nodes.map(n =>
          n.id === selectedNodeId
            ? { ...n, data: { ...n.data, config: { ...n.data?.config, ...config } } }
            : n
        );
        return { ...prev, [activeWorkflow]: { ...workflow, nodes: updatedNodes } };
      });
    }}
  />
)}
```

That's it! 🎉

---

## Documentation Reference

1. **GPT_NODE_EDITOR_GUIDE.md** - How to use GPTNodeEditor component
2. **GPT_NODE_EXECUTION_GUIDE.md** - How GPT nodes are executed in workflows
3. **OPENAI_API_SETUP.md** - How to set up OpenAI API integration
4. **AI_AUTO_BUILD_SETUP.md** - How to use AI to generate entire workflows

---

## Next Features to Add

### 1. GPT Response Display in Timeline

Show formatted GPT responses in simulation panel:

```jsx
{entry.type === 'gpt' && entry.result.ok && (
  <div className="gpt-response-box">
    <div className="response-header">
      <Sparkles size={16} />
      <span>AI Response ({entry.result.tokensUsed} tokens)</span>
    </div>
    <div className="response-content">
      {entry.result.response.substring(0, 200)}
      {entry.result.response.length > 200 && '...'}
    </div>
  </div>
)}
```

### 2. Cost Tracking Dashboard

Track AI costs per workflow:

```jsx
const totalCost = timeline
  .filter(e => e.type === 'gpt' && e.result.ok)
  .reduce((sum, e) => {
    const cost = (e.result.promptTokens / 1000) * 0.01 + 
                 (e.result.completionTokens / 1000) * 0.03;
    return sum + cost;
  }, 0);

<div className="cost-badge">
  💰 AI Cost: ${totalCost.toFixed(4)}
</div>
```

### 3. Prompt Library

Pre-built prompt templates:

```jsx
const promptLibrary = [
  {
    name: 'Sentiment Analysis',
    template: 'Analyze the sentiment: {input}\nClassify as: positive, negative, or neutral'
  },
  {
    name: 'Data Extraction',
    template: 'Extract structured data from: {input}\nReturn as JSON'
  },
  {
    name: 'Text Summarization',
    template: 'Summarize in 2-3 sentences: {input}'
  }
];
```

---

## Support

For issues:
1. Check browser console for errors
2. Verify edge function deployment: `supabase functions list`
3. Check edge function logs: `supabase functions logs simulate-workflow`
4. Test OpenAI API key: Review OPENAI_API_SETUP.md
5. Review GPT_NODE_EXECUTION_GUIDE.md for troubleshooting

---

## Summary

You now have:
- ✅ GPT node editor UI component
- ✅ Workflow execution with real OpenAI calls
- ✅ Flow context passing between nodes
- ✅ Error handling and timeouts
- ✅ Token usage tracking
- ✅ Complete documentation

Just integrate the component into Builder.jsx and deploy! 🚀
