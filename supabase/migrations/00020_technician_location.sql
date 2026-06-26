-- Add optional coordinates to technician profiles for map display and distance calculation
ALTER TABLE technician_profiles
  ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS location_lng DECIMAL(10,7);

COMMENT ON COLUMN technician_profiles.location_lat IS 'Technician base latitude (optional)';
COMMENT ON COLUMN technician_profiles.location_lng IS 'Technician base longitude (optional)';
