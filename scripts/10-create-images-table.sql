-- Görsel oluşturma tablosu
CREATE TABLE public.images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  enhanced_prompt TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS politikaları
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi görsellerini görebilir
CREATE POLICY "Users can view own images" ON public.images
  FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar kendi görsellerini ekleyebilir
CREATE POLICY "Users can insert own images" ON public.images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi görsellerini silebilir
CREATE POLICY "Users can delete own images" ON public.images
  FOR DELETE USING (auth.uid() = user_id);

-- Adminler tüm görselleri görebilir
CREATE POLICY "Admins can view all images" ON public.images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- İndeksler
CREATE INDEX idx_images_user_id ON public.images(user_id);
CREATE INDEX idx_images_created_at ON public.images(created_at DESC);
