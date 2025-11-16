# 🤖 AI Workflow Generator - User Guide

## ✨ What's New

Your AI Helper Chat now has **intelligent workflow generation** built in! Just describe what you want, and it will automatically generate and add workflows to your canvas.

## 🎯 How to Use

### 1. Open AI Helper Chat
Click the blue chat button in the bottom-right corner of the Builder.

### 2. Describe Your Workflow
Type a message that describes the workflow you want to create. Examples:

**Simple Examples:**
- "Create a workflow that sends an email when a form is submitted"
- "Build a workflow for processing new customer signups"
- "Make an automation that posts to Slack when a payment succeeds"

**Complex Examples:**
- "Create a workflow that: 1) receives a webhook from Stripe, 2) saves the data to a database, 3) sends a confirmation email, 4) posts to Slack"
- "Build an automation for new user onboarding with email verification and welcome sequence"
- "Design a workflow that monitors form submissions, filters spam, and notifies the sales team"

### 3. Auto-Detection
The AI automatically detects if you're asking for workflow creation by looking for keywords like:
- "create workflow"
- "build workflow"
- "make automation"
- "workflow that"
- "automate"

### 4. Generation
When detected, the AI:
- 🔮 Generates the complete workflow structure
- 📊 Shows you how many nodes it created
- 🎨 Offers to add it to your canvas

### 5. Add to Canvas
Click the **"Add to Canvas"** button, and the workflow magically appears on your canvas with:
- ✅ All nodes properly positioned
- ✅ Connections between nodes
- ✅ Smart layout (no overlapping)
- ✅ Ready to configure

## 🎨 Features

### Smart Positioning
- New workflows are placed below existing ones
- No overlap with current nodes
- Automatic spacing and layout

### Workflow Structure
Generated workflows include:
- **Trigger nodes** (webhooks, forms, schedules)
- **Action nodes** (email, HTTP requests, data processing)
- **Condition nodes** (filters, routing logic)
- **Connections** (proper flow between nodes)

### Full Integration
- Works with your existing workflows
- Preserves all current nodes
- Supports all node types (Trigger, Action, GPT AI, etc.)
- Token usage tracking

## 💡 Tips

### Be Specific
The more details you provide, the better the workflow:
- ❌ "Create a workflow"
- ✅ "Create a workflow that sends email notifications when a payment webhook is received"

### Iterate
You can generate multiple workflows and combine them:
1. Generate base workflow
2. Ask for additional automation
3. Combine or keep separate

### Edit After Generation
All generated nodes are fully editable:
- Click any node to configure it
- Adjust positions
- Add more nodes
- Modify connections

## 🔧 Technical Details

### Powered By
- **GPT-4 Turbo** for intelligent generation
- **Strict JSON Schema** for reliable structure
- **Cost Tracking** logged to `ai_requests` table

### Limitations
- Maximum 2000 characters per prompt
- Best results with 3-10 node workflows
- Complex logic may need manual adjustment

### Cost
Each generation costs approximately:
- Simple workflow (3-5 nodes): ~$0.01-0.02
- Complex workflow (10+ nodes): ~$0.03-0.05
- All costs tracked in your database

## 🚀 Examples

### Example 1: Email Notification
**Prompt:**
> "Create a workflow that sends an email when a form is submitted"

**Result:**
- Form Trigger node
- Email Action node
- Connection between them

### Example 2: Payment Processing
**Prompt:**
> "Build a workflow that receives a Stripe webhook, updates the database, and sends a receipt email"

**Result:**
- Webhook Trigger (Stripe)
- Database Action (update record)
- Email Action (send receipt)
- Proper connections

### Example 3: Content Moderation
**Prompt:**
> "Create an automation that monitors new posts, checks for spam with GPT, and either approves or flags them"

**Result:**
- Webhook Trigger (new post)
- GPT Node (spam detection)
- Condition Node (spam check)
- Two branches: Approve or Flag
- Notification actions

## 📊 Monitoring

All AI workflow generations are tracked in the `ai_requests` table:
- Model used (GPT-4 Turbo)
- Tokens consumed
- Estimated cost
- Success/failure status
- Prompt summary

## 🐛 Troubleshooting

### "No workflow generated"
- Try rephrasing your prompt
- Be more specific about what you want
- Check console for errors

### Nodes overlap
- The system tries to avoid this
- Manually drag nodes if needed
- Use zoom controls for better view

### Wrong node types
- Edit generated nodes
- Right-click to change type
- Regenerate with clearer prompt

## 🎓 Learning Resources

- See `IMPLEMENTATION_SUMMARY.md` for technical details
- Check `GPT_INTEGRATION_COMPLETE.md` for GPT node info
- Review generated workflows to learn patterns

---

**Enjoy building workflows faster with AI! 🚀**
