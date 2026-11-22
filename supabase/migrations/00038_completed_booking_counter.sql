-- Keep each provider's completed job count in sync with completed bookings.

CREATE INDEX IF NOT EXISTS idx_bookings_completed_technician
  ON public.bookings (technician_id)
  WHERE status = 'completed';

UPDATE public.technician_profiles AS tp
SET completed_jobs = counts.completed_jobs
FROM (
  SELECT
    profile.id,
    COUNT(booking.id)::integer AS completed_jobs
  FROM public.technician_profiles AS profile
  LEFT JOIN public.bookings AS booking
    ON booking.technician_id = profile.id
   AND booking.status = 'completed'
  GROUP BY profile.id
) AS counts
WHERE tp.id = counts.id
  AND tp.completed_jobs IS DISTINCT FROM counts.completed_jobs;

CREATE OR REPLACE FUNCTION public.sync_technician_completed_jobs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'completed' AND NEW.technician_id IS NOT NULL THEN
      UPDATE public.technician_profiles
      SET completed_jobs = COALESCE(completed_jobs, 0) + 1
      WHERE id = NEW.technician_id;
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'completed'
     AND OLD.technician_id IS NOT NULL
     AND (NEW.status IS DISTINCT FROM 'completed'
       OR OLD.technician_id IS DISTINCT FROM NEW.technician_id) THEN
    UPDATE public.technician_profiles
    SET completed_jobs = GREATEST(COALESCE(completed_jobs, 0) - 1, 0)
    WHERE id = OLD.technician_id;
  END IF;

  IF NEW.status = 'completed'
     AND NEW.technician_id IS NOT NULL
     AND (OLD.status IS DISTINCT FROM 'completed'
       OR OLD.technician_id IS DISTINCT FROM NEW.technician_id) THEN
    UPDATE public.technician_profiles
    SET completed_jobs = COALESCE(completed_jobs, 0) + 1
    WHERE id = NEW.technician_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_technician_completed_jobs ON public.bookings;
CREATE TRIGGER sync_technician_completed_jobs
  AFTER INSERT OR UPDATE
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_technician_completed_jobs();

REVOKE ALL ON FUNCTION public.sync_technician_completed_jobs() FROM PUBLIC;
