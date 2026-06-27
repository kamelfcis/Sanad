-- Category icon type (preset lucide name vs uploaded storage URL)
ALTER TABLE service_categories
  ADD COLUMN IF NOT EXISTS icon_type TEXT NOT NULL DEFAULT 'preset'
  CHECK (icon_type IN ('preset', 'upload'));

UPDATE service_categories
SET icon_type = 'upload'
WHERE icon IS NOT NULL
  AND (
    icon LIKE 'http://%'
    OR icon LIKE 'https://%'
    OR icon LIKE '%/storage/v1/object/public/category-icons/%'
  );

-- Dedicated bucket for category icons (public read, admin write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'category-icons',
  'category-icons',
  true,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "category_icons_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'category-icons');

CREATE POLICY "category_icons_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'category-icons'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "category_icons_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'category-icons'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'category-icons'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "category_icons_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'category-icons'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
