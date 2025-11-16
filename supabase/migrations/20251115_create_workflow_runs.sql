-- Create workflow_runs table for storing simulation/execution history
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    timeline JSONB NOT NULL,
    summary JSONB,
    status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON public.workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_user_id ON public.workflow_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_created_at ON public.workflow_runs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own runs
CREATE POLICY "Users can view their own workflow runs"
    ON public.workflow_runs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own runs
CREATE POLICY "Users can insert their own workflow runs"
    ON public.workflow_runs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own runs
CREATE POLICY "Users can delete their own workflow runs"
    ON public.workflow_runs
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflow_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflow_runs_updated_at
    BEFORE UPDATE ON public.workflow_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_runs_updated_at();

-- Grant permissions
GRANT ALL ON public.workflow_runs TO authenticated;
GRANT ALL ON public.workflow_runs TO service_role;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'workflow_runs table created successfully!';
END $$;
