-- 00023: Dynamic hero carousel slides (admin-managed)

CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  subtitle_ar TEXT NOT NULL DEFAULT 'خدمة احترافية',
  icon_key TEXT,
  service_category_slug TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hero_slides_sort ON hero_slides (sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_hero_slides_active ON hero_slides (is_active) WHERE is_active = true;

ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active hero slides"
  ON hero_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage hero slides"
  ON hero_slides FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

INSERT INTO hero_slides (image_url, title_ar, subtitle_ar, icon_key, service_category_slug, sort_order) VALUES
  (
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80',
    'كهرباء',
    'خدمة احترافية',
    'zap',
    'electrical',
    1
  ),
  (
    'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&q=80',
    'سباكة',
    'خدمة احترافية',
    'droplet',
    'plumbing',
    2
  ),
  (
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80',
    'تكييف وتبريد',
    'خدمة احترافية',
    'snowflake',
    'ac-repair',
    3
  );
