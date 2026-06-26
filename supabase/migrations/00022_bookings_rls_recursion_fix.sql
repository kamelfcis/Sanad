-- Break RLS recursion between bookings ↔ booking_assignments (mirrors profiles is_admin fix)

CREATE OR REPLACE FUNCTION public.customer_owns_booking(p_booking_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE id = p_booking_id AND customer_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.technician_has_booking_assignment(p_booking_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.booking_assignments
    WHERE booking_id = p_booking_id AND technician_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.customer_owns_booking(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.technician_has_booking_assignment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.customer_owns_booking(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.technician_has_booking_assignment(uuid) TO authenticated, anon, service_role;

DROP POLICY IF EXISTS "Customers read own booking assignments" ON booking_assignments;
CREATE POLICY "Customers read own booking assignments"
  ON booking_assignments FOR SELECT
  USING (public.customer_owns_booking(booking_id));

DROP POLICY IF EXISTS "Technicians read assigned bookings" ON bookings;
CREATE POLICY "Technicians read assigned bookings"
  ON bookings FOR SELECT
  USING (
    technician_id = auth.uid()
    OR public.technician_has_booking_assignment(id)
    OR (
      status = 'pending'
      AND service_id IN (
        SELECT ts.service_id FROM technician_skills ts
        WHERE ts.technician_id = auth.uid() AND ts.is_active = true
      )
    )
  );
