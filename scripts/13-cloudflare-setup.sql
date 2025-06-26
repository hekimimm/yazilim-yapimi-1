-- Cloudflare Workers AI entegrasyonu için gerekli ayarlar

-- Görsel tablosuna Cloudflare AI bilgilerini ekle
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50) DEFAULT 'cloudflare',
ADD COLUMN IF NOT EXISTS model_used VARCHAR(100) DEFAULT 'stable-diffusion-xl-base-1.0',
ADD COLUMN IF NOT EXISTS generation_params JSONB DEFAULT '{}';

-- Cloudflare AI için index ekle
CREATE INDEX IF NOT EXISTS idx_images_ai_provider ON images(ai_provider);
CREATE INDEX IF NOT EXISTS idx_images_model_used ON images(model_used);

-- Mevcut kayıtları güncelle
UPDATE images 
SET ai_provider = 'cloudflare', 
    model_used = 'stable-diffusion-xl-base-1.0'
WHERE ai_provider IS NULL;

-- Cloudflare AI istatistikleri için view oluştur
CREATE OR REPLACE VIEW cloudflare_ai_stats AS
SELECT 
    ai_provider,
    model_used,
    COUNT(*) as total_images,
    COUNT(DISTINCT user_id) as unique_users,
    DATE_TRUNC('day', created_at) as generation_date
FROM images 
WHERE ai_provider = 'cloudflare'
GROUP BY ai_provider, model_used, DATE_TRUNC('day', created_at)
ORDER BY generation_date DESC;

-- Kullanıcı başına Cloudflare AI kullanım limiti tablosu
CREATE TABLE IF NOT EXISTS user_ai_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ai_provider VARCHAR(50) NOT NULL,
    daily_usage INTEGER DEFAULT 0,
    usage_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ai_provider, usage_date)
);

-- RLS politikaları
ALTER TABLE user_ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI usage" ON user_ai_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage" ON user_ai_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI usage" ON user_ai_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Günlük kullanım sıfırlama fonksiyonu
CREATE OR REPLACE FUNCTION reset_daily_ai_usage()
RETURNS void AS $$
BEGIN
    UPDATE user_ai_usage 
    SET daily_usage = 0, updated_at = NOW()
    WHERE usage_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Kullanım artırma fonksiyonu
CREATE OR REPLACE FUNCTION increment_ai_usage(
    p_user_id UUID,
    p_ai_provider VARCHAR(50)
)
RETURNS INTEGER AS $$
DECLARE
    current_usage INTEGER;
BEGIN
    INSERT INTO user_ai_usage (user_id, ai_provider, daily_usage, usage_date)
    VALUES (p_user_id, p_ai_provider, 1, CURRENT_DATE)
    ON CONFLICT (user_id, ai_provider, usage_date)
    DO UPDATE SET 
        daily_usage = user_ai_usage.daily_usage + 1,
        updated_at = NOW()
    RETURNING daily_usage INTO current_usage;
    
    RETURN current_usage;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE user_ai_usage IS 'Kullanıcıların AI görsel oluşturma kullanım takibi';
COMMENT ON FUNCTION increment_ai_usage IS 'Kullanıcının günlük AI kullanımını artırır';
COMMENT ON FUNCTION reset_daily_ai_usage IS 'Günlük AI kullanım sayaçlarını sıfırlar';
