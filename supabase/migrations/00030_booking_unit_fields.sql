-- Apartment and floor collected on the customer booking form, alongside the
-- GPS-derived location_address/lat/lng. Both are optional free text (the form
-- caps them at 20 characters) because Egyptian floor labels are written as
-- words as often as digits ("الثاني" vs "2").
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS apartment_number TEXT,
  ADD COLUMN IF NOT EXISTS floor_number TEXT;

COMMENT ON COLUMN public.bookings.apartment_number IS 'Optional apartment/unit number for the service address';
COMMENT ON COLUMN public.bookings.floor_number IS 'Optional floor for the service address';
