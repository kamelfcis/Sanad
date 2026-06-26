-- Align uploads bucket MIME allowlist with API validation (jpeg, png, webp, pdf only)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
]::text[]
WHERE id = 'uploads';
