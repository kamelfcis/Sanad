-- 00009: Reviews & Ratings
-- Creates reviews table, trigger to update technician ratings, RLS

-- 1. reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_technician ON reviews(technician_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON reviews(booking_id);

-- 3. Trigger: update technician_profiles average_rating and total_ratings
CREATE OR REPLACE FUNCTION recalculate_technician_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_technician_id UUID;
BEGIN
  -- Determine which technician to update
  IF TG_OP = 'DELETE' THEN
    v_technician_id := OLD.technician_id;
  ELSE
    v_technician_id := NEW.technician_id;
  END IF;

  UPDATE technician_profiles
  SET
    average_rating = COALESCE(
      (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE technician_id = v_technician_id),
      0.0
    ),
    total_ratings = (SELECT COUNT(*) FROM reviews WHERE technician_id = v_technician_id),
    updated_at = now()
  WHERE id = v_technician_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_technician_rating();

-- 4. RLS policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Customers can insert their own reviews for completed bookings
CREATE POLICY "Customers insert own reviews"
  ON reviews FOR INSERT
  WITH CHECK (
    customer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id
        AND customer_id = auth.uid()
        AND status = 'completed'
    )
  );

-- Customers can update/delete their own reviews
CREATE POLICY "Customers manage own reviews"
  ON reviews FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers delete own reviews"
  ON reviews FOR DELETE
  USING (customer_id = auth.uid());

-- Anyone can read reviews (public)
CREATE POLICY "Anyone read reviews"
  ON reviews FOR SELECT
  USING (true);
