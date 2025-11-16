# Supabase Database Schema

## Tables Required

### 1. workflows
```sql
CREATE TABLE workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nodes JSONB DEFAULT '[]'::jsonb,
  connections JSONB DEFAULT '[]'::jsonb,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for user queries
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_created_at ON workflows(created_at DESC);
```

### 2. workflow_revisions
```sql
CREATE TABLE workflow_revisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nodes JSONB DEFAULT '[]'::jsonb,
  connections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for workflow queries
CREATE INDEX idx_workflow_revisions_workflow_id ON workflow_revisions(workflow_id);
CREATE INDEX idx_workflow_revisions_created_at ON workflow_revisions(created_at DESC);
```

## Row Level Security (RLS)

Enable RLS and add policies as needed:

```sql
-- Enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_revisions ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on your auth setup)
-- Allow users to read their own workflows
CREATE POLICY "Users can view own workflows"
  ON workflows FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to insert their own workflows
CREATE POLICY "Users can insert own workflows"
  ON workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to update their own workflows
CREATE POLICY "Users can update own workflows"
  ON workflows FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to delete their own workflows
CREATE POLICY "Users can delete own workflows"
  ON workflows FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Similar policies for workflow_revisions
CREATE POLICY "Users can view workflow revisions"
  ON workflow_revisions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workflows 
    WHERE workflows.id = workflow_revisions.workflow_id 
    AND (workflows.user_id = auth.uid() OR workflows.user_id IS NULL)
  ));

CREATE POLICY "Users can insert workflow revisions"
  ON workflow_revisions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workflows 
    WHERE workflows.id = workflow_revisions.workflow_id 
    AND (workflows.user_id = auth.uid() OR workflows.user_id IS NULL)
  ));
```

## Setup Instructions

1. Create a Supabase project at https://supabase.com
2. Go to the SQL Editor in your Supabase dashboard
3. Run the table creation scripts above
4. Set up RLS policies based on your authentication requirements
5. Copy your project URL and anon key to `.env` file
6. Update `.env` with your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
