-- Default service address for customers (Egyptian market).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS default_address text,
  ADD COLUMN IF NOT EXISTS default_location_lat double precision,
  ADD COLUMN IF NOT EXISTS default_location_lng double precision,
  ADD COLUMN IF NOT EXISTS default_apartment_number text,
  ADD COLUMN IF NOT EXISTS default_floor_number text;

COMMENT ON COLUMN profiles.default_address IS 'Preferred service address for booking prefill';
