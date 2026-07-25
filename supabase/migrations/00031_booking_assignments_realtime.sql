-- Enable Supabase Realtime for the technician jobs list so newly matched
-- assignments push live (useTechnicianAssignmentsRealtime). Without this, the
-- postgres_changes subscription on booking_assignments never fires and the tech
-- must refresh to see new jobs. RLS still applies to subscribers: the existing
-- "Technicians read own assignments" (technician_id = auth.uid()) policy scopes
-- delivery to each technician's own rows.
-- Guarded so re-running is a ao-op if the table is already published.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'booking_assignments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_assignments;
  END IF;
END $$;
