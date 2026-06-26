-- Hide moderated reviews from public SELECT; owners and admins can still read
DROP POLICY IF EXISTS "Anyone read reviews" ON reviews;

CREATE POLICY "Anyone read visible reviews"
  ON reviews FOR SELECT
  USING (
    is_hidden = false
    OR customer_id = auth.uid()
    OR public.is_admin()
  );
