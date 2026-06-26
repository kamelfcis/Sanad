-- Supabase Storage bucket for user uploads (booking images, chat attachments, technician docs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Authenticated users may upload only under their own folder: {userId}/...
CREATE POLICY "uploads_insert_own_folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- Public read for booking images and chat attachments
CREATE POLICY "uploads_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- Required for upsert/replace on own files
CREATE POLICY "uploads_update_own_folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
)
WITH CHECK (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

CREATE POLICY "uploads_delete_own_folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
