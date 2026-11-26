-- Monthly visibility subscription for technicians and contractors.
-- Subscription approval is manual; InstaPay transfers are verified by an admin.

CREATE TABLE IF NOT EXISTS public.provider_subscriptions (
  provider_id UUID PRIMARY KEY REFERENCES public.technician_profiles(id) ON DELETE CASCADE,
  active_until TIMESTAMPTZ NOT NULL DEFAULT 'epoch'::timestamptz,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.technician_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 10.00 CHECK (amount = 10.00),
  receipt_path TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_subscription_payments_provider_created_idx
  ON public.provider_subscription_payments (provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS provider_subscription_payments_status_created_idx
  ON public.provider_subscription_payments (status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS provider_subscription_one_pending_payment_idx
  ON public.provider_subscription_payments (provider_id)
  WHERE status = 'pending';

ALTER TABLE public.provider_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS provider_subscriptions_read_own_or_admin ON public.provider_subscriptions;
CREATE POLICY provider_subscriptions_read_own_or_admin
  ON public.provider_subscriptions FOR SELECT TO authenticated
  USING (
    provider_id = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin')
  );

DROP POLICY IF EXISTS provider_subscription_payments_read_own_or_admin ON public.provider_subscription_payments;
CREATE POLICY provider_subscription_payments_read_own_or_admin
  ON public.provider_subscription_payments FOR SELECT TO authenticated
  USING (
    provider_id = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin')
  );

-- Private proof bucket: uploads and signed links are issued only by authenticated server routes.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'provider-subscription-receipts',
  'provider-subscription-receipts',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS provider_subscription_receipts_admin_read ON storage.objects;
CREATE POLICY provider_subscription_receipts_admin_read
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'provider-subscription-receipts'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin')
  );

CREATE OR REPLACE FUNCTION public.review_provider_subscription_payment(
  p_payment_id UUID,
  p_decision TEXT,
  p_admin_id UUID,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.provider_subscription_payments%ROWTYPE;
  v_active_until TIMESTAMPTZ;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;

  IF p_decision NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'invalid_decision' USING ERRCODE = '22023';
  END IF;

  IF p_decision = 'reject' AND NULLIF(trim(p_rejection_reason), '') IS NULL THEN
    RAISE EXCEPTION 'rejection_reason_required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_payment
  FROM public.provider_subscription_payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_payment.status <> 'pending' THEN
    RAISE EXCEPTION 'payment_already_reviewed' USING ERRCODE = '23505';
  END IF;

  IF p_decision = 'approve' THEN
    INSERT INTO public.provider_subscriptions (provider_id, active_until, updated_at)
    VALUES (v_payment.provider_id, now() + interval '1 month', now())
    ON CONFLICT (provider_id) DO UPDATE
      SET active_until = greatest(provider_subscriptions.active_until, now()) + interval '1 month',
          updated_at = now()
    RETURNING active_until INTO v_active_until;

    UPDATE public.provider_subscription_payments
    SET status = 'approved', reviewed_by = p_admin_id, reviewed_at = now(), rejection_reason = NULL
    WHERE id = p_payment_id;
  ELSE
    UPDATE public.provider_subscription_payments
    SET status = 'rejected', reviewed_by = p_admin_id, reviewed_at = now(),
        rejection_reason = trim(p_rejection_reason)
    WHERE id = p_payment_id;
  END IF;

  RETURN jsonb_build_object(
    'payment_id', p_payment_id,
    'provider_id', v_payment.provider_id,
    'status', CASE WHEN p_decision = 'approve' THEN 'approved' ELSE 'rejected' END,
    'active_until', v_active_until
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_provider_subscription_payment(UUID, TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_provider_subscription_payment(UUID, TEXT, UUID, TEXT) TO service_role;
