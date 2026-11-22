-- Provider role, contractor kind, capacity, team size, catalog, quotes, and complaints.
-- capacity_tier: none = unavailable for new work, low = limited, high = large.
-- team_size is required only for contractors (5, 10, or 20).

ALTER TABLE technician_profiles
  ADD COLUMN IF NOT EXISTS contractor_kind TEXT NOT NULL DEFAULT 'specialist'
    CHECK (contractor_kind IN ('integrated', 'specialist')),
  ADD COLUMN IF NOT EXISTS capacity_tier TEXT NOT NULL DEFAULT 'none'
    CHECK (capacity_tier IN ('none', 'low', 'high')),
  ADD COLUMN IF NOT EXISTS provider_role TEXT NOT NULL DEFAULT 'technician',
  ADD COLUMN IF NOT EXISTS team_size INTEGER;

ALTER TABLE technician_profiles
  DROP CONSTRAINT IF EXISTS technician_profiles_provider_role_check;
ALTER TABLE technician_profiles
  ADD CONSTRAINT technician_profiles_provider_role_check
  CHECK (provider_role IN ('technician', 'contractor'));

ALTER TABLE technician_profiles
  DROP CONSTRAINT IF EXISTS technician_profiles_team_size_check;
ALTER TABLE technician_profiles
  ADD CONSTRAINT technician_profiles_team_size_check
  CHECK (team_size IS NULL OR team_size IN (5, 10, 20));

ALTER TABLE technician_profiles
  DROP CONSTRAINT IF EXISTS technician_profiles_contractor_team_required;
ALTER TABLE technician_profiles
  ADD CONSTRAINT technician_profiles_contractor_team_required
  CHECK (
    (provider_role = 'contractor' AND team_size IN (5, 10, 20))
    OR (provider_role = 'technician' AND team_size IS NULL)
  );

COMMENT ON COLUMN technician_profiles.provider_role IS 'technician books a service; contractor is quoted for a project';
COMMENT ON COLUMN technician_profiles.capacity_tier IS 'none = unavailable for new work, low = limited, high = large';
COMMENT ON COLUMN technician_profiles.team_size IS 'Contractor crew size: 5, 10, or 20. Null for technicians.';

INSERT INTO service_categories (name_ar, name_en, slug, description, icon, sort_order, is_active)
VALUES
  (
    'مقاول متكامل',
    'General Contractor',
    'general-contractor',
    'مقاول متكامل لأعمال البناء والتشطيب.',
    'building',
    90,
    true
  ),
  ('خرسانة', 'Concrete', 'concrete', 'أعمال خرسانة وأساسات.', 'layers', 91, true),
  ('محارة', 'Plaster', 'plaster', 'محارة وتشطيبات داخلية.', 'brush', 92, true),
  ('رخام', 'Marble', 'marble', 'تركيب وصيانة الرخام.', 'gem', 93, true)
ON CONFLICT (slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

DO $$
DECLARE
  gc_id UUID;
  concrete_id UUID;
  plaster_id UUID;
  marble_id UUID;
BEGIN
  SELECT id INTO gc_id FROM service_categories WHERE slug = 'general-contractor';
  SELECT id INTO concrete_id FROM service_categories WHERE slug = 'concrete';
  SELECT id INTO plaster_id FROM service_categories WHERE slug = 'plaster';
  SELECT id INTO marble_id FROM service_categories WHERE slug = 'marble';

  IF gc_id IS NOT NULL THEN
    INSERT INTO services (category_id, name_ar, name_en, slug, description, price, price_type, sort_order, is_active)
    VALUES
      (gc_id, 'مقاول متكامل', 'General Contracting', 'general-contracting', 'تنفيذ مشروع متكامل.', 500.00, 'estimate', 1, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;

  IF concrete_id IS NOT NULL THEN
    INSERT INTO services (category_id, name_ar, name_en, slug, description, price, price_type, sort_order, is_active)
    VALUES
      (concrete_id, 'صب خرسانة', 'Concrete Pouring', 'concrete-pouring', 'صب وتجهيز الخرسانة.', 300.00, 'estimate', 1, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;

  IF plaster_id IS NOT NULL THEN
    INSERT INTO services (category_id, name_ar, name_en, slug, description, price, price_type, sort_order, is_active)
    VALUES
      (plaster_id, 'محارة وتشطيب', 'Plaster Work', 'plaster-work', 'محارة جدران وأسقف.', 180.00, 'hourly', 1, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;

  IF marble_id IS NOT NULL THEN
    INSERT INTO services (category_id, name_ar, name_en, slug, description, price, price_type, sort_order, is_active)
    VALUES
      (marble_id, 'تركيب رخام', 'Marble Installation', 'marble-installation', 'تركيب وصقل الرخام.', 250.00, 'estimate', 1, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) >= 10),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS complaints_booking_customer_once ON complaints (booking_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_technician ON complaints(technician_id);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers insert own complaints"
  ON complaints FOR INSERT
  WITH CHECK (
    customer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND b.customer_id = auth.uid()
        AND b.technician_id = technician_id
    )
  );

CREATE POLICY "Customers read own complaints"
  ON complaints FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Admin manage complaints"
  ON complaints FOR ALL
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

CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialty TEXT,
  project_description TEXT NOT NULL CHECK (char_length(project_description) >= 10),
  address TEXT NOT NULL CHECK (char_length(address) >= 5),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'quoted', 'accepted', 'declined')),
  quoted_amount NUMERIC(12, 2),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_requests_customer ON quote_requests(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_requests_contractor ON quote_requests(contractor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);

ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers insert own quote requests"
  ON quote_requests FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers read own quote requests"
  ON quote_requests FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Customers update own quote requests"
  ON quote_requests FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Contractors read their quote requests"
  ON quote_requests FOR SELECT
  USING (contractor_id = auth.uid());

CREATE POLICY "Contractors update their quote requests"
  ON quote_requests FOR UPDATE
  USING (contractor_id = auth.uid())
  WITH CHECK (contractor_id = auth.uid());

CREATE POLICY "Admin read quote requests"
  ON quote_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.complaints TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.quote_requests TO authenticated;
GRANT ALL ON public.complaints TO service_role;
GRANT ALL ON public.quote_requests TO service_role;

NOTIFY pgrst, 'reload schema';
