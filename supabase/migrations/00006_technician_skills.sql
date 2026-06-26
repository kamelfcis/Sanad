-- Create technician_skills table
CREATE TABLE IF NOT EXISTS technician_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID NOT NULL REFERENCES technician_profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  price_override DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(technician_id, service_id)
);

-- Enable RLS
ALTER TABLE technician_skills ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Technicians can manage own skills"
  ON technician_skills FOR ALL
  USING (technician_id = auth.uid())
  WITH CHECK (technician_id = auth.uid());

CREATE POLICY "Anyone can view active technician skills"
  ON technician_skills FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all skills"
  ON technician_skills FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_technician_skills_technician_id ON technician_skills(technician_id);
CREATE INDEX IF NOT EXISTS idx_technician_skills_service_id ON technician_skills(service_id);
CREATE INDEX IF NOT EXISTS idx_technician_profiles_verification ON technician_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_technician_profiles_availability ON technician_profiles(is_available);
