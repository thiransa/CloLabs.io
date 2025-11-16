-- Add config column to user_integrations table
-- This allows storing additional configuration data as JSON

ALTER TABLE user_integrations 
ADD COLUMN IF NOT EXISTS config JSONB;

-- Add index for config field queries
CREATE INDEX IF NOT EXISTS idx_user_integrations_config ON user_integrations USING GIN (config);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'config column added to user_integrations table successfully!';
END $$;
