-- Storage bucket oluştur
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true);

-- Storage politikaları
CREATE POLICY "Users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'generated-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'generated-images');

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'generated-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
