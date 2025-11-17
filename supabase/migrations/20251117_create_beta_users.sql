-- Create beta_users table for landing page email signups
-- Migration: Add beta_users table
-- Created: 2025-11-17

CREATE TABLE IF NOT EXISTS beta_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'landing_page',
  status TEXT DEFAULT 'pending'
);

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_beta_users_email ON beta_users(email);
CREATE INDEX IF NOT EXISTS idx_beta_users_created_at ON beta_users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_users_status ON beta_users(status);

-- Enable Row Level Security
ALTER TABLE beta_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Anyone can insert beta emails" ON beta_users;
DROP POLICY IF EXISTS "Service role can view all beta users" ON beta_users;

-- RLS Policies: Public can insert, only service role can read
CREATE POLICY "Anyone can insert beta emails"
  ON beta_users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can view all beta users"
  ON beta_users FOR SELECT
  USING (auth.role() = 'service_role');

-- Add trigger to prevent duplicate emails with better error message
CREATE OR REPLACE FUNCTION check_beta_email_duplicate()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM beta_users WHERE email = NEW.email) THEN
    RAISE EXCEPTION 'Email already registered for beta program';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Unique constraint already handles duplicates, 
-- but this trigger provides a clearer error message
