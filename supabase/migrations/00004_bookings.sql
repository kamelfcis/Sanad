-- Create booking status enum
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending', 'matched', 'accepted', 'in_progress',
    'completed', 'cancelled', 'disputed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  technician_id UUID REFERENCES profiles(id),
  status booking_status NOT NULL DEFAULT 'pending',
  description TEXT,
  location_address TEXT,
  location_lat DECIMAL(10,7),
  location_lng DECIMAL(10,7),
  preferred_time TIMESTAMPTZ,
  price_quote DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create booking_images table
CREATE TABLE IF NOT EXISTS booking_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT DEFAULT 'customer' CHECK (image_type IN ('customer', 'technician', 'review')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for bookings
CREATE POLICY "Customers can view their own bookings"
  ON bookings FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update their own bookings"
  ON bookings FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Technicians can view assigned bookings"
  ON bookings FOR SELECT
  USING (technician_id = auth.uid());

CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS policies for booking_images
CREATE POLICY "Customers can manage their booking images"
  ON booking_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_images.booking_id
      AND bookings.customer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_images.booking_id
      AND bookings.customer_id = auth.uid()
    )
  );

CREATE POLICY "Technicians can view assigned booking images"
  ON booking_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_images.booking_id
      AND bookings.technician_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all booking images"
  ON booking_images FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_technician_id ON bookings(technician_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_images_booking_id ON booking_images(booking_id);

-- Updated_at trigger
CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
