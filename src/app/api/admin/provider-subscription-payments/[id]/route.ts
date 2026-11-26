import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAdmin, requireAuth } from '@/lib/api/auth';

const paramsSchema = z.object({ id: z.string().uuid() });
const bodySchema = z.object({
  decision: z.enum(['approve', 'reject']),
  rejectionReason: z.string().trim().max(500).optional(),
}).refine((body) => body.decision !== 'reject' || Boolean(body.rejectionReason), {
  message: 'A rejection reason is required.',
  path: ['rejectionReason'],
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) return NextResponse.json({ error: 'Invalid payment request ID.' }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;
  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: 'Payment review is not configured.' }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsedBody = bodySchema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json({ error: parsedBody.error.issues[0]?.message ?? 'Invalid decision.' }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();
  const { data, error } = await serviceClient.rpc('review_provider_subscription_payment', {
    p_payment_id: parsedParams.data.id,
    p_decision: parsedBody.data.decision,
    p_admin_id: auth.user.id,
    p_rejection_reason: parsedBody.data.rejectionReason ?? null,
  });

  if (error) {
    if (error.message.includes('payment_not_found')) {
      return NextResponse.json({ error: 'Payment request not found.' }, { status: 404 });
    }
    if (error.message.includes('payment_already_reviewed')) {
      return NextResponse.json({ error: 'This payment request has already been reviewed.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Unable to review this payment request.' }, { status: 500 });
  }

  return NextResponse.json({ result: data });
}
