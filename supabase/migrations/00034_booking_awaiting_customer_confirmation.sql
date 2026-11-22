-- Two-step completion: technician marks work done; customer confirms to completed.

DO $$ BEGIN
  ALTER TYPE booking_status ADD VALUE 'awaiting_customer_confirmation';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
