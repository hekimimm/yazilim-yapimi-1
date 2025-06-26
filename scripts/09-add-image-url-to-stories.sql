-- AI stories tablosuna image_url kolonu ekle
ALTER TABLE public.ai_stories 
ADD COLUMN image_url TEXT;

-- Index ekle
CREATE INDEX idx_ai_stories_image_url ON public.ai_stories(image_url);

-- Yorum ekle
COMMENT ON COLUMN public.ai_stories.image_url IS 'AI tarafından oluşturulan hikaye görseli URL''si';
