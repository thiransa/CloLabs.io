-- Migration: Create workflow execution tracking tables
-- Created: 2025-11-22
-- Purpose: Enable production workflow execution with state persistence, timeline tracking, and audit logging

-- ============================================================================
-- Table: workflow_executions
-- Tracks each workflow execution run with status, metadata, and results
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workflow_id UUID, -- Optional: link to saved workflows table (if you add one later)
    workflow_snapshot JSONB NOT NULL, -- Complete workflow definition at execution time
    
    -- Execution state
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'timeout')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER, -- Total execution duration in milliseconds
    
    -- Input/Output
    input_payload JSONB NOT NULL DEFAULT '{}', -- Initial trigger payload
    output_result JSONB, -- Final execution result
    error_details JSONB, -- Error information if failed
    
    -- Execution metadata
    trigger_type TEXT, -- 'manual', 'webhook', 'schedule', 'api'
    trigger_source TEXT, -- Source identifier (user email, webhook name, etc.)
    execution_mode TEXT DEFAULT 'production' CHECK (execution_mode IN ('production', 'test', 'debug')),
    
    -- Progress tracking
    current_node_id TEXT, -- Currently executing node (for resumption)
    nodes_completed INTEGER DEFAULT 0,
    nodes_total INTEGER DEFAULT 0,
    nodes_failed INTEGER DEFAULT 0,
    
    -- Resource usage
    credits_consumed INTEGER DEFAULT 0, -- Track API credits used
    api_calls_made INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_workflow_executions_user_id ON public.workflow_executions(user_id);
CREATE INDEX idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX idx_workflow_executions_created_at ON public.workflow_executions(created_at DESC);
CREATE INDEX idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id) WHERE workflow_id IS NOT NULL;
CREATE INDEX idx_workflow_executions_user_status ON public.workflow_executions(user_id, status, created_at DESC);

-- ============================================================================
-- Table: execution_timeline
-- Stores detailed timeline of each node execution within a workflow run
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.execution_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
    
    -- Node identification
    node_id TEXT NOT NULL,
    node_type TEXT NOT NULL,
    node_label TEXT,
    
    -- Execution details
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped', 'retrying')),
    attempt_number INTEGER NOT NULL DEFAULT 1, -- For retry tracking
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Input/Output
    input_data JSONB, -- Data received by this node
    output_data JSONB, -- Data produced by this node
    error_details JSONB, -- Error information if failed
    
    -- Metadata
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMPTZ, -- Scheduled retry time
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for timeline queries
CREATE INDEX idx_execution_timeline_execution_id ON public.execution_timeline(execution_id, created_at);
CREATE INDEX idx_execution_timeline_node_id ON public.execution_timeline(execution_id, node_id);
CREATE INDEX idx_execution_timeline_status ON public.execution_timeline(status) WHERE status IN ('pending', 'retrying');

-- ============================================================================
-- Table: execution_logs
-- Detailed logs for debugging and audit trail
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
    timeline_id UUID REFERENCES public.execution_timeline(id) ON DELETE CASCADE, -- Optional: specific node
    
    -- Log details
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
    message TEXT NOT NULL,
    details JSONB, -- Structured log data
    
    -- Context
    node_id TEXT,
    source TEXT, -- 'orchestrator', 'node_executor', 'api_client', etc.
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for log queries
CREATE INDEX idx_execution_logs_execution_id ON public.execution_logs(execution_id, created_at DESC);
CREATE INDEX idx_execution_logs_level ON public.execution_logs(level) WHERE level IN ('error', 'critical');
CREATE INDEX idx_execution_logs_timeline_id ON public.execution_logs(timeline_id) WHERE timeline_id IS NOT NULL;

-- ============================================================================
-- RLS Policies: Users can only access their own executions
-- ============================================================================

ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;

-- Workflow Executions Policies
CREATE POLICY "Users can view their own workflow executions"
    ON public.workflow_executions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workflow executions"
    ON public.workflow_executions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflow executions"
    ON public.workflow_executions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Timeline Policies (via execution ownership)
CREATE POLICY "Users can view timeline of their executions"
    ON public.execution_timeline
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.workflow_executions
            WHERE id = execution_timeline.execution_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Service can insert timeline entries"
    ON public.execution_timeline
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workflow_executions
            WHERE id = execution_timeline.execution_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Service can update timeline entries"
    ON public.execution_timeline
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.workflow_executions
            WHERE id = execution_timeline.execution_id
            AND user_id = auth.uid()
        )
    );

-- Logs Policies
CREATE POLICY "Users can view logs of their executions"
    ON public.execution_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.workflow_executions
            WHERE id = execution_logs.execution_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Service can insert execution logs"
    ON public.execution_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workflow_executions
            WHERE id = execution_logs.execution_id
            AND user_id = auth.uid()
        )
    );

-- ============================================================================
-- Trigger: Update updated_at timestamp automatically
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workflow_executions_updated_at
    BEFORE UPDATE ON public.workflow_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_execution_timeline_updated_at
    BEFORE UPDATE ON public.execution_timeline
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper Function: Clean up old executions (optional, run periodically)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_executions(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete executions older than specified days
    -- Logs and timeline entries will cascade delete
    DELETE FROM public.workflow_executions
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep
    AND status IN ('completed', 'failed', 'cancelled');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grants: Ensure authenticated users have necessary permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.workflow_executions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.execution_timeline TO authenticated;
GRANT SELECT, INSERT ON public.execution_logs TO authenticated;

GRANT USAGE ON SEQUENCE workflow_executions_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE execution_timeline_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE execution_logs_id_seq TO authenticated;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE public.workflow_executions IS 'Tracks workflow execution runs with status, timing, and results';
COMMENT ON TABLE public.execution_timeline IS 'Detailed timeline of each node execution within a workflow run';
COMMENT ON TABLE public.execution_logs IS 'Audit logs and debug information for workflow executions';

COMMENT ON COLUMN public.workflow_executions.workflow_snapshot IS 'Complete workflow definition (nodes + edges) at execution time';
COMMENT ON COLUMN public.workflow_executions.execution_mode IS 'production = real API calls, test = mock responses, debug = verbose logging';
COMMENT ON COLUMN public.execution_timeline.attempt_number IS 'Retry attempt number (1 = first attempt, 2+ = retries)';
