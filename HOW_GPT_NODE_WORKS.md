# How the GPT Node System Works - Visual Guide

## Current State: Components Built But Not Connected

You're right - you can't see anything in the UI yet! Here's why and how to fix it:

---

## 🎯 What Was Built (Backend)

### 1. **GPTNodeEditor Component** (`src/components/GPTNodeEditor.jsx`)
- A React component with forms for configuring GPT settings
- Has model dropdown, prompt textarea, test button, etc.
- **Currently NOT imported or used in Builder.jsx**

### 2. **Workflow Execution** (`supabase/functions/simulate-workflow/index.ts`)
- Updated to execute GPT nodes with OpenAI API
- **This works already!** When you run a workflow with a GPT node, it will call OpenAI

---

## 🔌 What Needs to Be Connected (Frontend)

### The Flow:

```
User clicks node in sidebar 
    ↓
Node appears on canvas
    ↓
User clicks node to select it
    ↓
Right sidebar shows config panel
    ↓
Config panel shows GPTNodeEditor component (IF node type is 'gpt')
    ↓
User configures GPT settings
    ↓
Clicks Save
    ↓
Config stored in node.data.config
    ↓
User runs workflow
    ↓
Execution engine calls OpenAI
```

---

## 📍 Current UI Structure in Your Builder.jsx

### Left Sidebar (Node Palette)
```
┌─────────────────────────────┐
│ 🔍 Search...                │
├─────────────────────────────┤
│ ⭐ Favorites               │
│   - Gmail Trigger           │
│   - Slack Message           │
├─────────────────────────────┤
│ ⚡ Basic                   │  ← HERE: Add GPT node
│   - Trigger                 │
│   - Action                  │
│   - Condition               │
│   - Delay                   │
│   - GPT AI (NEW!)          │  ← Not added yet!
├─────────────────────────────┤
│ ⚙️ Integration              │
│   - Gmail                   │
│   - Google Sheets           │
│   ...                       │
└─────────────────────────────┘
```

### Right Sidebar (Config Panel)
```
When user selects a node:

┌──────────────────────────────┐
│ Setup | Simulate | History  │  ← Tabs
├──────────────────────────────┤
│                              │
│ IF node.type === 'trigger':  │
│   → Show trigger config      │
│                              │
│ IF node.type === 'action':   │
│   → Show action dropdown     │
│   → If actionType='Webhook'  │
│       Show webhook config    │
│                              │
│ IF node.type === 'gpt':      │  ← Need to add this!
│   → Show GPTNodeEditor       │  ← Not connected yet!
│                              │
└──────────────────────────────┘
```

---

## 🛠️ Step-by-Step: How to Connect Everything

### Option 1: GPT as Separate Node Type (Recommended)

#### Step 1: Add GPT to Left Sidebar

In `Builder.jsx`, find the "Basic" section (around line 795) and add:

```jsx
{expandedSections.basic && (
  <div className="section-items">
    <div 
      className="section-item"
      onClick={() => addNode('trigger', 'Trigger', Play, 'green')}
    >
      <Play size={16} className="icon-green" />
      <span>Trigger</span>
    </div>
    <div 
      className="section-item"
      onClick={() => addNode('action', 'Action', Zap, 'purple')}
    >
      <Zap size={16} className="icon-purple" />
      <span>Action</span>
    </div>
    <div 
      className="section-item"
      onClick={() => addNode('condition', 'Condition', CheckCircle2, 'orange')}
    >
      <CheckCircle2 size={16} className="icon-orange" />
      <span>Condition</span>
    </div>
    <div 
      className="section-item"
      onClick={() => addNode('delay', 'Delay', Clock, 'blue')}
    >
      <Clock size={16} className="icon-blue" />
      <span>Delay</span>
    </div>
    
    {/* 🆕 ADD THIS: GPT Node */}
    <div 
      className="section-item"
      onClick={() => addNode('gpt', 'GPT AI', Sparkles, 'pink')}
    >
      <Sparkles size={16} className="icon-pink" />
      <span>GPT AI</span>
    </div>
  </div>
)}
```

#### Step 2: Import Required Components

At the top of `Builder.jsx`, add:

```jsx
import { 
  Search, Star, Zap, Mail, FileText, FolderOpen, Bell, 
  Database, Settings, ChevronDown, ChevronRight, Plus, Minus,
  Share2, X, Play, Clock, MessageSquare, Save, Home,
  Sparkles, CheckCircle2, Circle  // ← Sparkles already imported!
} from 'lucide-react';

// Add this import:
import GPTNodeEditor from './components/GPTNodeEditor.jsx';
```

#### Step 3: Add Config Panel for GPT Nodes

In `Builder.jsx`, find the right sidebar setup tab (around line 1204) and add:

```jsx
<div className="right-content">
  {activeRightTab === 'setup' && selectedNode && (
    <>
      {/* 🆕 ADD THIS: GPT Node Config */}
      {selectedNode.type === 'gpt' ? (
        <GPTNodeEditor
          node={selectedNode}
          onSave={(config) => {
            // Update node with GPT configuration
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
          onClose={() => {
            // Optional: handle close
            console.log('GPT editor closed');
          }}
        />
      ) : (
        /* Existing config panel for other node types */
        <div className="config-panel">
          {/* Your existing config code... */}
        </div>
      )}
    </>
  )}
</div>
```

#### Step 4: Add CSS for Pink Icon (Optional)

In `Builder.css`, add:

```css
.icon-pink {
  color: #ec4899;
}
```

---

### Option 2: GPT as Action Subtype

If you prefer GPT to be under Action nodes (like Webhook currently is):

#### Step 1: Already Have "AI Processing" in Action Types
You already have this at line 1282:
```jsx
<option>AI Processing</option>
```

#### Step 2: Add GPTNodeEditor When "AI Processing" Selected

Around line 1286, after the Webhook config section, add:

```jsx
{selectedNode.data?.config?.actionType === 'AI Processing' && (
  <GPTNodeEditor
    node={selectedNode}
    onSave={(config) => {
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
)}
```

---

## 🎬 How It Works After Integration

### User Flow:

1. **User clicks "GPT AI" in left sidebar**
   ```
   [Left Sidebar] → Basic → GPT AI (click)
   ```

2. **GPT node appears on canvas**
   ```
   [Canvas] → New node: "GPT AI" with Sparkles icon
   ```

3. **User clicks the GPT node to select it**
   ```
   [Canvas] → Node highlighted
   [Right Sidebar] → Shows GPTNodeEditor component
   ```

4. **Right sidebar shows GPT configuration**
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
   │ Temperature: ●────○────     │
   │                  0.7        │
   │                            │
   │ Test Example:              │
   │ ┌──────────────────────┐   │
   │ │ Sample text...       │   │
   │ └──────────────────────┘   │
   │                            │
   │ [▶ Test Prompt]            │
   │                            │
   │ [💾 Save Configuration]    │
   └────────────────────────────┘
   ```

5. **User configures and tests**
   - Selects model: GPT-4 Turbo
   - Enters prompt: "Analyze this feedback: {input}"
   - Enters test example: "The product is great!"
   - Clicks "Test Prompt"
   - Sees AI response preview

6. **User clicks Save**
   - Config saved to `node.data.config`:
     ```javascript
     {
       gptModel: 'gpt-4-turbo-preview',
       promptTemplate: 'Analyze this feedback: {input}',
       maxTokens: 1000,
       temperature: 0.7,
       testExample: 'The product is great!'
     }
     ```

7. **User runs the workflow**
   - Clicks "Run Test" or "Simulate" button
   - Workflow calls `simulate-workflow` edge function
   - Edge function detects `node.type === 'gpt'`
   - Calls OpenAI API with configuration
   - Returns AI response in timeline

8. **Timeline shows result**
   ```json
   {
     "nodeId": "node-2",
     "type": "gpt",
     "result": {
       "ok": true,
       "response": "The feedback is very positive...",
       "tokensUsed": 320,
       "duration": 2340
     }
   }
   ```

---

## 📦 What Each File Does

### 1. `src/components/GPTNodeEditor.jsx`
**What it is:** A React form component  
**What it does:** 
- Shows input fields for GPT configuration
- Has test button to try prompts before saving
- Validates inputs
- Calls `onSave(config)` when user clicks Save

**Analogy:** Like the webhook config panel you already have (lines 1288-1468), but for GPT settings

### 2. `supabase/functions/simulate-workflow/index.ts`
**What it is:** Backend execution engine  
**What it does:**
- Receives workflow from frontend
- Loops through nodes
- When it finds `type === 'gpt'`, calls OpenAI API
- Returns results back to frontend

**Analogy:** Like how it currently handles webhook nodes (lines 350-450), but calls OpenAI instead

### 3. `src/Builder.jsx` (Needs Updates)
**What it is:** Your main workflow builder UI  
**What it needs:**
- Import GPTNodeEditor
- Add GPT node to left sidebar palette
- Show GPTNodeEditor in right sidebar when GPT node selected

---

## 🔍 Quick Test Without Integration

Want to see GPTNodeEditor without integrating? Add this temporarily:

```jsx
// In Builder.jsx, add anywhere in the JSX (like in right sidebar)
<div style={{ padding: '20px' }}>
  <GPTNodeEditor
    node={{
      id: 'test-1',
      type: 'gpt',
      label: 'Test GPT',
      data: {}
    }}
    onSave={(config) => {
      console.log('GPT Config:', config);
      alert('Config: ' + JSON.stringify(config, null, 2));
    }}
  />
</div>
```

---

## 🎯 Minimal Integration (Copy-Paste Ready)

Here's the absolute minimum code to add to Builder.jsx:

### 1. Add import at top:
```jsx
import GPTNodeEditor from './components/GPTNodeEditor.jsx';
```

### 2. Add node to sidebar (around line 820):
```jsx
<div 
  className="section-item"
  onClick={() => addNode('gpt', 'GPT AI', Sparkles, 'pink')}
>
  <Sparkles size={16} style={{ color: '#ec4899' }} />
  <span>GPT AI</span>
</div>
```

### 3. Add config panel (around line 1204):
```jsx
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
      alert('Saved!');
    }}
  />
)}
```

That's it! Then you'll see the GPT node in your UI.

---

## ❓ Why You Can't See Anything Yet

**Simple answer:** The GPTNodeEditor component exists as a file, but it's not imported or used anywhere in Builder.jsx.

**Analogy:** 
- It's like having a tool in your toolbox but not taking it out
- Or having an app installed but never opening it

**The components work, they're just not connected to the UI yet!**

---

## 🚀 Next Steps

1. Choose Option 1 (separate GPT node) or Option 2 (GPT as action subtype)
2. Add the 3 code snippets above to Builder.jsx
3. Refresh your app
4. Look for "GPT AI" in the left sidebar
5. Click it to add to canvas
6. Click the node to see GPTNodeEditor in right sidebar
7. Configure and test!

Let me know which option you prefer and I can provide the exact code to add! 🎉
