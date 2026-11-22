-- Private bucket for national ID / KYC images (not web-public like generic uploads).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc',
  'kyc',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "kyc_insert_own_folder" ON storage.objects;
CREATE POLICY "kyc_insert_own_folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

DROP POLICY IF EXISTS "kyc_select_own_or_admin" ON storage.objects;
CREATE POLICY "kyc_select_own_or_admin"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
);
