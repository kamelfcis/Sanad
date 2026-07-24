-- Enable Supabase Realtime for technician availability on the public /services browse.
-- Without this, the `useTechnicianAvailabilityRealtime` hook's postgres_changes
-- UPDATE subscription on technician_profiles never fires and cards won't flip live.
-- RLS still applies to subscribers: the existing "Anyone can view verified
-- technician profiles" SELECT policy governs which rows anon browsers receive.
-- Guarded so re-running is a no-op if the table is already published.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'technician_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.technician_profiles;
  END IF;
END $$;
