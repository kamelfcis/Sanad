-- Flag demo / E2E technicians so public browse can exclude them.

ALTER TABLE technician_profiles
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN technician_profiles.is_demo IS 'When true, hide from public browse (E2E fixtures, duplicates).';

CREATE INDEX IF NOT EXISTS idx_technician_profiles_public_browse
  ON technician_profiles (verification_status, is_demo)
  WHERE verification_status = 'verified' AND is_demo = false;

-- E2E and obvious test fixtures
UPDATE technician_profiles tp
SET is_demo = true
FROM profiles p
WHERE tp.id = p.id
  AND (
    p.full_name ILIKE 'E2E%'
    OR p.email ILIKE '%test%@%'
    OR p.email ILIKE '%@sanad.app'
    AND p.full_name ILIKE '%test%'
  );

-- Hide duplicate verified profiles with the same display name (keep highest completed_jobs)
WITH ranked AS (
  SELECT
    tp.id,
    ROW_NUMBER() OVER (
      PARTITION BY p.full_name
      ORDER BY tp.completed_jobs DESC NULLS LAST, tp.id
    ) AS rn
  FROM technician_profiles tp
  INNER JOIN profiles p ON p.id = tp.id
  WHERE tp.verification_status = 'verified'
    AND COALESCE(tp.is_demo, false) = false
    AND p.full_name IS NOT NULL
    AND trim(p.full_name) <> ''
),
dupes AS (
  SELECT id FROM ranked WHERE rn > 1
)
UPDATE technician_profiles
SET is_demo = true
WHERE id IN (SELECT id FROM dupes);

DROP POLICY IF EXISTS "Public can view verified non-demo technicians" ON technician_profiles;
CREATE POLICY "Public can view verified non-demo technicians"
  ON technician_profiles FOR SELECT
  TO anon, authenticated
  USING (
    verification_status = 'verified'
    AND is_demo = false
  );
