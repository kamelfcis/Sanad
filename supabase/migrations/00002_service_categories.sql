-- Create service_categories table
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active categories"
  ON service_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage categories"
  ON service_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed categories
INSERT INTO service_categories (name_ar, name_en, slug, description, icon, sort_order) VALUES
  ('سباكة', 'Plumbing', 'plumbing', 'Professional plumbing services for repairs, installations, and maintenance.', 'droplet', 1),
  ('كهرباء', 'Electrical', 'electrical', 'Licensed electricians for wiring, fixtures, and electrical repairs.', 'zap', 2),
  ('تكييف', 'AC Repair', 'ac-repair', 'AC installation, repair, and maintenance services.', 'snowflake', 3),
  ('نجارة', 'Carpentry', 'carpentry', 'Custom furniture, woodwork, and carpentry repairs.', 'hammer', 4),
  ('دهان', 'Painting', 'painting', 'Interior and exterior painting services for homes and offices.', 'paintbrush', 5),
  ('تنظيف', 'Cleaning', 'cleaning', 'Deep cleaning, regular cleaning, and specialized cleaning services.', 'sparkles', 6),
  ('حدادة', 'Metalwork', 'metalwork', 'Custom metal fabrication, gates, railings, and structural work.', 'wrench', 7),
  ('زجاج', 'Glass Work', 'glass-work', 'Glass installation, repair, and replacement for windows and doors.', 'square', 8),
  ('جبس', 'Drywall', 'drywall', 'Drywall installation, repair, and decorative gypsum work.', 'grid', 9),
  ('سيراميك', 'Tiling', 'tiling', 'Tile installation and repair for floors, walls, and bathrooms.', 'layout-grid', 10),
  ('صيانة عامة', 'General Maintenance', 'general-maintenance', 'Comprehensive home maintenance and handyman services.', 'tool', 11)
ON CONFLICT (slug) DO NOTHING;
