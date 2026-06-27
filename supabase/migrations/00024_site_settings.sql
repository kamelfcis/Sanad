-- 00024: Site-wide settings (currency, etc.)
-- Singleton row pattern — same id used for upserts

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000002'::uuid,
  currency TEXT NOT NULL DEFAULT 'EGP'
    CHECK (currency IN ('EGP', 'SAR', 'AED', 'USD', 'KWD', 'QAR', 'BHD', 'OMR', 'JOD')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read for currency display on landing / browse pages
CREATE POLICY "Anyone read site settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage site settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO site_settings (id, currency)
VALUES ('00000000-0000-0000-0000-000000000002'::uuid, 'EGP')
ON CONFLICT (id) DO NOTHING;
