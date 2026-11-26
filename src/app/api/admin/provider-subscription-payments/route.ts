import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAdmin, requireAuth } from '@/lib/api/auth';
import { PROVIDER_SUBSCRIPTION_RECEIPTS_BUCKET } from '@/lib/constants/provider-subscription';

const querySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;
  const admin = await requireAdmin(supabase, auth.user);
  if ('response' in admin) return admin.response;
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: 'Admin payment review is not configured.' }, { status: 503 });
  }

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid filters.' }, { status: 400 });
  const { status, page, limit } = parsed.data;
  const offset = (page - 1) * limit;
  const serviceClient = createServiceRoleClient();
  let query = serviceClient
    .from('provider_subscription_payments')
    .select('id, provider_id, amount, status, rejection_reason, created_at, reviewed_at, receipt_path', { count: 'exact' })
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data: payments, error, count } = await query.range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: 'Unable to load subscription payment requests.' }, { status: 500 });

  const providerIds = [...new Set((payments ?? []).map((payment) => payment.provider_id))];
  const [profilesResult, providerProfilesResult] = providerIds.length
    ? await Promise.all([
        serviceClient.from('profiles').select('id, full_name, email, phone').in('id', providerIds),
        serviceClient.from('technician_profiles').select('id, provider_role, governorate, area').in('id', providerIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];

  if (profilesResult.error || providerProfilesResult.error) {
    return NextResponse.json({ error: 'Unable to load provider details.' }, { status: 500 });
  }

  const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
  const providerProfiles = new Map((providerProfilesResult.data ?? []).map((profile) => [profile.id, profile]));
  const requests = await Promise.all((payments ?? []).map(async (payment) => {
    const { data: signedReceipt } = await serviceClient.storage
      .from(PROVIDER_SUBSCRIPTION_RECEIPTS_BUCKET)
      .createSignedUrl(payment.receipt_path, 5 * 60);
    const { receipt_path: _receiptPath, ...safePayment } = payment;
    return {
      ...safePayment,
      receiptUrl: signedReceipt?.signedUrl ?? null,
      receiptType: payment.receipt_path.split('.').pop()?.toLowerCase() ?? null,
      provider: profiles.get(payment.provider_id) ?? null,
      providerProfile: providerProfiles.get(payment.provider_id) ?? null,
    };
  }));

  return NextResponse.json({ payments: requests, total: count ?? 0, page, limit });
}
