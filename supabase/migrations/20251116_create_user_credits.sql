-- Migration: Create user_credits table for credit tracking system
-- Date: 2025-01-16
-- Purpose: Track beta user credits (500/month limit)

-- Create user_credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_credits INTEGER NOT NULL DEFAULT 500,
    used_credits INTEGER NOT NULL DEFAULT 0,
    credits_remaining INTEGER GENERATED ALWAYS AS (total_credits - used_credits) STORED,
    reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and update their own credits
CREATE POLICY "Users can view their own credits"
    ON public.user_credits
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
    ON public.user_credits
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_reset_date ON public.user_credits(reset_date);

-- Function to create credits for new users (auto-trigger)
CREATE OR REPLACE FUNCTION public.create_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_credits (user_id, total_credits, used_credits)
    VALUES (NEW.id, 500, 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create credits when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_credits();

-- Function to reset monthly credits (call manually or via cron)
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void AS $$
BEGIN
    UPDATE public.user_credits
    SET 
        used_credits = 0,
        reset_date = CURRENT_DATE + INTERVAL '1 month',
        updated_at = NOW()
    WHERE reset_date <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_credits() TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_monthly_credits() TO service_role;

-- Comments for documentation
COMMENT ON TABLE public.user_credits IS 'Tracks user AI credit usage - 500 credits/month for beta users';
COMMENT ON COLUMN public.user_credits.total_credits IS 'Total credits allocated per month (default: 500)';
COMMENT ON COLUMN public.user_credits.used_credits IS 'Number of credits used this billing cycle';
COMMENT ON COLUMN public.user_credits.credits_remaining IS 'Computed column: total_credits - used_credits';
COMMENT ON COLUMN public.user_credits.reset_date IS 'Date when credits will reset to total_credits';
COMMENT ON FUNCTION public.create_user_credits() IS 'Auto-creates credit record when user signs up';
COMMENT ON FUNCTION public.reset_monthly_credits() IS 'Resets credits for users whose reset_date has passed';
