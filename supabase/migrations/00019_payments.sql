-- 00019: Manual Payments (InstaPay + Vodafone Cash)
-- Manual verification workflow — no payment gateways

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('instapay', 'vodafone_cash');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method payment_method NOT NULL,
  screenshot_url TEXT NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own payments"
  ON payments FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Customers create own payments"
  ON payments FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers update own resubmittable payments"
  ON payments FOR UPDATE
  USING (customer_id = auth.uid() AND status IN ('pending', 'rejected'))
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Admins manage all payments"
  ON payments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Singleton payment settings (fixed id for upserts)
CREATE TABLE IF NOT EXISTS payment_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  instapay_number TEXT NOT NULL DEFAULT '',
  instapay_name TEXT NOT NULL DEFAULT '',
  vodafone_cash_number TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read payment settings"
  ON payment_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage payment settings"
  ON payment_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO payment_settings (id, instapay_number, instapay_name, vodafone_cash_number, instructions)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '01234567890',
  'Sanad Platform',
  '01012345678',
  'قم بتحويل المبلغ المطلوب عبر InstaPay أو Vodafone Cash، ثم ارفع لقطة شاشة للتحويل. سيتم مراجعة الدفع خلال 24 ساعة.'
)
ON CONFLICT (id) DO NOTHING;
