-- StarryAI setup and configuration

-- Add StarryAI specific columns to images table if they don't exist
DO $$ 
BEGIN
    -- Add creation_id column to track StarryAI job IDs
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'images' AND column_name = 'creation_id') THEN
        ALTER TABLE images ADD COLUMN creation_id TEXT;
    END IF;
    
    -- Add ai_provider column to track which AI service was used
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'images' AND column_name = 'ai_provider') THEN
        ALTER TABLE images ADD COLUMN ai_provider TEXT DEFAULT 'starryai';
    END IF;
    
    -- Add model_used column to track which model was used
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'images' AND column_name = 'model_used') THEN
        ALTER TABLE images ADD COLUMN model_used TEXT DEFAULT 'lyra';
    END IF;
    
    -- Add generation_settings column to store generation parameters
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'images' AND column_name = 'generation_settings') THEN
        ALTER TABLE images ADD COLUMN generation_settings JSONB;
    END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_images_ai_provider ON images(ai_provider);
CREATE INDEX IF NOT EXISTS idx_images_creation_id ON images(creation_id);
CREATE INDEX IF NOT EXISTS idx_images_user_created ON images(user_id, created_at DESC);

-- Update existing records to have StarryAI as provider
UPDATE images 
SET ai_provider = 'starryai', model_used = 'lyra' 
WHERE ai_provider IS NULL;

-- Create a view for StarryAI statistics
CREATE OR REPLACE VIEW starryai_stats AS
SELECT 
    ai_provider,
    model_used,
    COUNT(*) as total_images,
    COUNT(DISTINCT user_id) as unique_users,
    DATE_TRUNC('day', created_at) as generation_date
FROM images 
WHERE ai_provider = 'starryai'
GROUP BY ai_provider, model_used, DATE_TRUNC('day', created_at)
ORDER BY generation_date DESC;

-- Grant necessary permissions
GRANT SELECT ON starryai_stats TO anon, authenticated;

-- Add RLS policies for the new columns
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own images
CREATE POLICY "Users can view own images" ON images
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own images
CREATE POLICY "Users can insert own images" ON images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own images
CREATE POLICY "Users can update own images" ON images
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own images
CREATE POLICY "Users can delete own images" ON images
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to clean up old placeholder images
CREATE OR REPLACE FUNCTION cleanup_placeholder_images()
RETURNS void AS $$
BEGIN
    -- Delete placeholder images older than 7 days
    DELETE FROM images 
    WHERE image_url LIKE '%placeholder%' 
    AND created_at < NOW() - INTERVAL '7 days';
    
    -- Delete images with broken URLs older than 30 days
    DELETE FROM images 
    WHERE (image_url LIKE '%via.placeholder%' OR image_url LIKE '%picsum.photos%')
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (if pg_cron is available)
-- SELECT cron.schedule('cleanup-placeholder-images', '0 2 * * *', 'SELECT cleanup_placeholder_images();');

COMMENT ON TABLE images IS 'Stores AI-generated images with StarryAI integration';
COMMENT ON COLUMN images.creation_id IS 'StarryAI job/creation ID for tracking';
COMMENT ON COLUMN images.ai_provider IS 'AI service used (starryai, dalle, etc.)';
COMMENT ON COLUMN images.model_used IS 'Specific AI model used (lyra, etc.)';
COMMENT ON COLUMN images.generation_settings IS 'JSON settings used for generation';
