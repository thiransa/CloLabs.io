-- Create ai_requests table for tracking AI usage and costs
CREATE TABLE IF NOT EXISTS public.ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  prompt_summary TEXT,
  tokens_used INTEGER,
  tokens_estimated INTEGER,
  cost_estimate NUMERIC(10, 6),
  status TEXT DEFAULT 'success',
  error_message TEXT,
  function_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for user queries
CREATE INDEX IF NOT EXISTS idx_ai_requests_user_id ON public.ai_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_created_at ON public.ai_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_requests_function_name ON public.ai_requests(function_name);

-- Enable Row Level Security
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests
CREATE POLICY "Users can view own ai_requests"
  ON public.ai_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert any request
CREATE POLICY "Service role can insert ai_requests"
  ON public.ai_requests
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view aggregate stats (optional)
CREATE POLICY "Users can view aggregate stats"
  ON public.ai_requests
  FOR SELECT
  USING (true);

-- Add comment for documentation
COMMENT ON TABLE public.ai_requests IS 'Tracks all AI API requests for usage monitoring and cost estimation';
COMMENT ON COLUMN public.ai_requests.model IS 'OpenAI model used (e.g., gpt-3.5-turbo, gpt-4)';
COMMENT ON COLUMN public.ai_requests.prompt_summary IS 'First 200 chars of the prompt for reference';
COMMENT ON COLUMN public.ai_requests.tokens_used IS 'Actual tokens used from OpenAI response';
COMMENT ON COLUMN public.ai_requests.tokens_estimated IS 'Estimated tokens before API call';
COMMENT ON COLUMN public.ai_requests.cost_estimate IS 'Estimated cost in USD';
COMMENT ON COLUMN public.ai_requests.function_name IS 'Edge function that made the request (openai-chat, ai-auto-build, simulate-workflow)';
