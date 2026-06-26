-- Additional fields for technician registration (Sanad / register-technician flow)
ALTER TABLE technician_profiles
  ADD COLUMN IF NOT EXISTS national_id TEXT,
  ADD COLUMN IF NOT EXISTS governorate TEXT,
  ADD COLUMN IF NOT EXISTS area TEXT,
  ADD COLUMN IF NOT EXISTS starting_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS working_hours TEXT,
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS id_card_photo_url TEXT;

COMMENT ON COLUMN technician_profiles.national_id IS 'Egyptian national ID (14 digits)';
COMMENT ON COLUMN technician_profiles.governorate IS 'Governorate / محافظة';
COMMENT ON COLUMN technician_profiles.area IS 'Area or neighborhood / المنطقة';
COMMENT ON COLUMN technician_profiles.starting_price IS 'Starting service price in EGP';
COMMENT ON COLUMN technician_profiles.working_hours IS 'Working hours description';
COMMENT ON COLUMN technician_profiles.profile_photo_url IS 'Public URL for profile photo';
COMMENT ON COLUMN technician_profiles.id_card_photo_url IS 'Public URL for national ID card photo';
