# GPT Node Editor - Integration Guide

## Overview

`GPTNodeEditor.jsx` is a React component for configuring GPT/AI processing nodes in your workflow builder. It provides a user-friendly interface with live testing capabilities.

## Features

✅ **Model Selection** - Choose from GPT-4 Turbo, GPT-4, or GPT-3.5 Turbo  
✅ **Prompt Template** - Create dynamic prompts with `{input}` placeholders  
✅ **Max Tokens Control** - Set response length limits (100-4000)  
✅ **Temperature Slider** - Adjust creativity vs precision (0-2)  
✅ **Live Testing** - Test prompts before saving with real OpenAI API  
✅ **Token Usage Display** - See cost estimates for test runs  
✅ **Consistent Styling** - Matches existing NodeConfigPanel design  

---

## Usage in Builder.jsx

### 1. Import the Component

```jsx
import GPTNodeEditor from './components/GPTNodeEditor.jsx';
```

### 2. Add Conditional Rendering

In your node configuration panel, add GPT node handling:

```jsx
{activeRightTab === 'setup' && selectedNode && (
  <div className="config-panel">
    {/* Existing node configs... */}
    
    {/* Add GPT Node Editor */}
    {selectedNode.type === 'action' && 
     selectedNode.data?.config?.actionType === 'AI Processing' && (
      <GPTNodeEditor
        node={selectedNode}
        onSave={(config) => {
          // Save config to node
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
          
          // Show success message
          alert('GPT configuration saved successfully!');
        }}
        onClose={() => {
          // Optional: Handle close action
          console.log('GPT editor closed');
        }}
      />
    )}
  </div>
)}
```

### 3. Alternative: Replace Entire Config Panel

For a cleaner integration, you can replace the entire config panel when GPT node is selected:

```jsx
{activeRightTab === 'setup' && selectedNode && (
  <>
    {selectedNode.type === 'action' && 
     selectedNode.data?.config?.actionType === 'AI Processing' ? (
      // Show GPT Editor
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
          alert('Configuration saved!');
        }}
        onClose={() => setSelectedNodeId(null)}
      />
    ) : (
      // Show default config panel
      <div className="config-panel">
        {/* Your existing node config UI */}
      </div>
    )}
  </>
)}
```

---

## Configuration Object

When saved, the component writes this structure to `node.data.config`:

```javascript
{
  gptModel: 'gpt-4-turbo-preview',        // Selected model
  promptTemplate: 'Analyze: {input}',     // Prompt with placeholders
  maxTokens: 1000,                        // Max response length
  temperature: 0.7,                       // Creativity level (0-2)
  testExample: 'Sample test text'         // Last test input (optional)
}
```

### Accessing Config in Workflow Execution

```javascript
// During workflow execution
const gptNode = workflow.nodes.find(n => n.type === 'action' && n.data?.config?.actionType === 'AI Processing');

if (gptNode?.data?.config) {
  const { gptModel, promptTemplate, maxTokens, temperature } = gptNode.data.config;
  
  // Replace {input} with actual workflow data
  const prompt = promptTemplate.replace(/\{input\}/g, workflowData.input);
  
  // Call OpenAI
  const result = await sendChatMessage(
    [{ role: 'user', content: prompt }],
    { model: gptModel, max_tokens: maxTokens, temperature }
  );
}
```

---

## Available Models

| Model | Value | Best For | Speed | Cost |
|-------|-------|----------|-------|------|
| GPT-4 Turbo | `gpt-4-turbo-preview` | Production (recommended) | Fast | Medium |
| GPT-4 Turbo | `gpt-4-turbo` | High quality | Fast | Medium |
| GPT-4 | `gpt-4` | Maximum accuracy | Slower | High |
| GPT-3.5 Turbo | `gpt-3.5-turbo` | Testing, simple tasks | Fastest | Low |

---

## Prompt Template Examples

### Text Analysis
```
Analyze the following customer feedback and categorize it as positive, negative, or neutral:

{input}

Return only the category name.
```

### Data Extraction
```
Extract the following information from this text:
- Name
- Email
- Phone number

Text: {input}

Return as JSON.
```

### Content Generation
```
Write a professional email response to this customer inquiry:

{input}

Keep the tone friendly and helpful.
```

### Translation
```
Translate the following text to Spanish:

{input}

Maintain the original tone and formatting.
```

---

## Component Props

### `node` (required)
The workflow node being edited. Must have structure:
```javascript
{
  id: string,
  type: string,
  label: string,
  data: {
    config: {
      gptModel?: string,
      promptTemplate?: string,
      maxTokens?: number,
      temperature?: number,
      testExample?: string
    }
  }
}
```

### `onSave` (required)
Callback function when user saves configuration:
```javascript
onSave: (config) => void
```

Receives the complete config object with all GPT settings.

### `onClose` (optional)
Callback when user wants to close the editor:
```javascript
onClose: () => void
```

---

## Testing Flow

1. User enters prompt template with `{input}` placeholder
2. User enters test example text
3. User clicks "Test Prompt" button
4. Component:
   - Replaces `{input}` with test example
   - Calls OpenAI via `sendChatMessage()`
   - Shows response preview (first 300 chars)
   - Displays tokens used
5. User reviews result, adjusts settings if needed
6. User clicks "Save Configuration"

---

## Styling

The component uses existing CSS classes from `Builder.css`:
- `.config-panel` - Main container
- `.config-item` - Form field wrapper
- `.config-label` - Field labels
- `.config-select` - Inputs, textareas, selects
- `.save-test-button` - Action buttons

Additional inline styles provide GPT-specific formatting:
- Test result boxes (success/error)
- Temperature slider
- Tips section
- Token usage badges

---

## Error Handling

### Test Errors
- Empty prompt template → "Please enter a prompt template before testing"
- Empty test example → "Please enter a test example"
- API error → Shows OpenAI error message
- Network error → Shows connection error

### Save Validation
- Empty prompt template → "Prompt template is required"
- Invalid token range → Enforced by input min/max
- Invalid temperature → Enforced by slider constraints

---

## Cost Tracking

Test results show token usage:
```jsx
{testResult.tokensUsed} tokens used
```

Approximate costs (as of Nov 2025):
- GPT-3.5 Turbo: ~$0.001 per 1K tokens
- GPT-4 Turbo: ~$0.01 per 1K tokens
- GPT-4: ~$0.03 per 1K tokens

Example: A test with 500 tokens on GPT-4 Turbo ≈ $0.005

---

## Example Integration in Builder.jsx

Complete example showing GPT node in action type dropdown:

```jsx
{selectedNode.type === 'action' && (
  <>
    <div className="config-item">
      <label className="config-label">Action Type</label>
      <select 
        className="config-select"
        value={selectedNode.data?.config?.actionType || 'API Request'}
        onChange={(e) => {
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
                        actionType: e.target.value 
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
        }}
      >
        <option>API Request</option>
        <option>Send Email</option>
        <option>Transform Data</option>
        <option>AI Processing</option>
        <option>Webhook</option>
      </select>
    </div>

    {/* Show GPT Editor when AI Processing selected */}
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
  </>
)}
```

---

## Workflow Execution Example

When running the workflow, process GPT nodes like this:

```javascript
// In your workflow simulation/execution code
async function executeGPTNode(node, inputData) {
  const config = node.data?.config;
  
  if (!config || !config.promptTemplate) {
    throw new Error('GPT node not configured');
  }

  // Replace {input} placeholder with actual data
  const prompt = config.promptTemplate.replace(
    /\{input\}/g, 
    JSON.stringify(inputData)
  );

  console.log('[GPT Node] Executing with model:', config.gptModel);

  // Call OpenAI
  const result = await sendChatMessage(
    [{ role: 'user', content: prompt }],
    {
      model: config.gptModel || 'gpt-4-turbo-preview',
      max_tokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7
    }
  );

  if (result.error) {
    throw new Error(`GPT node failed: ${result.error}`);
  }

  return {
    response: result.data.choices[0].message.content,
    tokensUsed: result.data.usage?.total_tokens,
    model: result.data.model
  };
}
```

---

## Troubleshooting

### "OpenAI API key not configured"
- Ensure `openai-chat` edge function is deployed
- Verify `OPENAI_API_KEY` secret is set in Supabase:
  ```bash
  supabase secrets set OPENAI_API_KEY=sk-proj-your-key
  ```

### Test button disabled
- Check that prompt template is not empty
- Check that test example is not empty
- Both fields are required for testing

### "Failed to test GPT node"
- Check browser console for detailed error
- Verify Supabase URL and anon key in `.env`
- Test edge function directly with curl

### Response truncated in preview
- Test preview shows first 300 characters only
- Full response available in workflow execution
- Increase max tokens if responses are too short

---

## Next Steps

1. **Add to Builder**: Integrate GPTNodeEditor into your Builder.jsx action type handlers
2. **Test Workflow**: Create a workflow with GPT node and test end-to-end
3. **Add to Palette**: Add "AI Processing" node to left sidebar node palette
4. **Execution Logic**: Implement GPT node execution in your workflow runner
5. **Usage Tracking**: Log token usage per workflow run for cost monitoring

---

## Related Files

- `src/components/GPTNodeEditor.jsx` - This component
- `src/lib/openaiApi.js` - OpenAI API helper functions
- `supabase/functions/openai-chat/index.ts` - Secure OpenAI proxy endpoint
- `OPENAI_API_SETUP.md` - OpenAI API deployment guide

---

## Support

For issues or questions:
1. Check that OpenAI edge function is deployed and configured
2. Verify test button shows detailed error messages
3. Check browser console for API errors
4. Review `OPENAI_API_SETUP.md` for troubleshooting steps
