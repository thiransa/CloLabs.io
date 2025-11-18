-- Add avatar_url column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS profile_setup_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_setup_dismissed_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_setup_completed 
ON user_profiles(user_id, profile_setup_completed);

-- Update RLS policies to allow users to update their own avatar
-- (assuming the table already has RLS enabled)
