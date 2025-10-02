-- Migration: Add content_restrictions column to websites table
-- This adds support for storing content niche acceptance, link types, and special conditions

-- Add the content_restrictions column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'websites' 
        AND column_name = 'content_restrictions'
    ) THEN
        ALTER TABLE websites ADD COLUMN content_restrictions JSONB DEFAULT '{}'::jsonb;
        
        -- Add comment explaining the structure
        COMMENT ON COLUMN websites.content_restrictions IS 'JSON object containing content guidelines: {"accepted_niches": ["cbd", "casino"], "niche_pricing": {"cbd": "100"}, "link_types": {"dofollow": true}, "special_conditions": "text"}';
        
        -- Create index for better performance on JSON queries
        CREATE INDEX IF NOT EXISTS idx_websites_content_restrictions ON websites USING GIN (content_restrictions);
        
        RAISE NOTICE 'Added content_restrictions column to websites table';
    ELSE
        RAISE NOTICE 'content_restrictions column already exists';
    END IF;
END $$; 