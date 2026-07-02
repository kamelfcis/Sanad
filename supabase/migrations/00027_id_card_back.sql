-- Back side of the national ID card for technician verification
ALTER TABLE technician_profiles
  ADD COLUMN IF NOT EXISTS id_card_back_photo_url TEXT;

COMMENT ON COLUMN technician_profiles.id_card_back_photo_url IS 'Public URL for the back side of the national ID card photo';
