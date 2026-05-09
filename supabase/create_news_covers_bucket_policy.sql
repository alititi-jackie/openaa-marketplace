-- Create news-covers bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-covers', 'news-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read news cover images
CREATE POLICY "Anyone can view news covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'news-covers');

-- Allow authenticated users to upload news cover images
CREATE POLICY "Authenticated users can upload news covers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'news-covers' AND auth.role() = 'authenticated');

-- Allow authenticated users to overwrite existing news cover images
CREATE POLICY "Authenticated users can update news covers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'news-covers' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete news cover images
CREATE POLICY "Authenticated users can delete news covers" ON storage.objects
  FOR DELETE USING (bucket_id = 'news-covers' AND auth.role() = 'authenticated');
