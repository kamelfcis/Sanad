-- 00007: Booking Assignments + Matching Engine
-- Creates booking_assignments table, auto-matching function, RLS policies, and indexes

-- 1. booking_assignments table
CREATE TABLE IF NOT EXISTS booking_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(booking_id, technician_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_booking_assignments_booking
  ON booking_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_assignments_technician
  ON booking_assignments(technician_id);
CREATE INDEX IF NOT EXISTS idx_booking_assignments_status
  ON booking_assignments(status);

-- 3. Auto-matching function
CREATE OR REPLACE FUNCTION match_technicians_for_booking(p_booking_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_id UUID;
  v_category_id UUID;
  v_match_count INTEGER;
BEGIN
  -- Get booking's service
  SELECT service_id INTO v_service_id
  FROM bookings WHERE id = p_booking_id;
  
  IF v_service_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Get service's category
  SELECT category_id INTO v_category_id
  FROM services WHERE id = v_service_id;
  
  -- Insert top 3 matching verified, available technicians
  INSERT INTO booking_assignments (booking_id, technician_id)
  SELECT p_booking_id, tp.id
  FROM technician_profiles tp
  WHERE tp.is_available = true
    AND tp.verification_status = 'verified'
    AND tp.id IN (
      SELECT ts.technician_id
      FROM technician_skills ts
      JOIN services s ON s.id = ts.service_id
      WHERE s.category_id = v_category_id
        AND ts.is_active = true
    )
    AND tp.id NOT IN (
      -- Exclude technicians who already rejected this booking
      SELECT ba.technician_id
      FROM booking_assignments ba
      WHERE ba.booking_id = p_booking_id
        AND ba.status = 'rejected'
    )
  ORDER BY tp.average_rating DESC, tp.completed_jobs DESC
  LIMIT 3;
  
  GET DIAGNOSTICS v_match_count = ROW_COUNT;
  
  -- Update booking status if matches found
  IF v_match_count > 0 THEN
    UPDATE bookings
    SET status = 'matched', updated_at = now()
    WHERE id = p_booking_id AND status = 'pending';
  END IF;
  
  RETURN v_match_count;
END;
$$;

-- 4. Function to get next available match when a tech rejects
CREATE OR REPLACE FUNCTION assign_next_available_tech(p_booking_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_count INTEGER;
BEGIN
  v_match_count := match_technicians_for_booking(p_booking_id);
  
  -- If still no matches after retry, revert to pending
  IF v_match_count = 0 THEN
    UPDATE bookings
    SET status = 'pending', updated_at = now()
    WHERE id = p_booking_id AND status = 'matched';
  END IF;
  
  RETURN v_match_count;
END;
$$;

-- 5. RLS policies
ALTER TABLE booking_assignments ENABLE ROW LEVEL SECURITY;

-- Technicians can read their own assignments
CREATE POLICY "Technicians read own assignments"
  ON booking_assignments FOR SELECT
  USING (technician_id = auth.uid());

-- Technicians can update their own assignments (accept/reject)
CREATE POLICY "Technicians update own assignments"
  ON booking_assignments FOR UPDATE
  USING (technician_id = auth.uid())
  WITH CHECK (technician_id = auth.uid());

-- Customers can see assignments on their bookings
CREATE POLICY "Customers read own booking assignments"
  ON booking_assignments FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE customer_id = auth.uid()
    )
  );

-- Admin full access
CREATE POLICY "Admin full access booking_assignments"
  ON booking_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Update bookings RLS to allow technicians to see matched bookings
-- This policy may already exist, adding for completeness
DROP POLICY IF EXISTS "Technicians read assigned bookings" ON bookings;
CREATE POLICY "Technicians read assigned bookings"
  ON bookings FOR SELECT
  USING (
    technician_id = auth.uid()
    OR (
      status = 'matched'
      AND id IN (
        SELECT booking_id FROM booking_assignments
        WHERE technician_id = auth.uid()
      )
    )
    OR (
      status = 'pending'
      AND service_id IN (
        SELECT ts.service_id FROM technician_skills ts
        WHERE ts.technician_id = auth.uid() AND ts.is_active = true
      )
    )
  );
