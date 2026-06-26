-- Create technician_profiles table
CREATE TABLE IF NOT EXISTS technician_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  years_experience INTEGER CHECK (years_experience >= 0),
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verification_docs TEXT[],
  id_document_url TEXT,
  license_url TEXT,
  is_available BOOLEAN DEFAULT true,
  max_distance_km DECIMAL(5,1) DEFAULT 20.0,
  completed_jobs INTEGER DEFAULT 0,
  average_rating DECIMAL(2,1) DEFAULT 0.0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE technician_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Technicians can manage own profile"
  ON technician_profiles FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Anyone can view verified technician profiles"
  ON technician_profiles FOR SELECT
  USING (verification_status = 'verified');

CREATE POLICY "Customers can view technician profiles"
  ON technician_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'customer'
    )
  );

CREATE POLICY "Admins can manage all technician profiles"
  ON technician_profiles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Updated_at trigger
CREATE TRIGGER set_technician_profiles_updated_at
  BEFORE UPDATE ON technician_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
