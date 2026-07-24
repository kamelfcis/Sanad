-- Optional free-text reason when a customer (or admin flow) cancels a booking
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

COMMENT ON COLUMN public.bookings.cancellation_reason IS 'Optional reason provided when the booking was cancelled';
