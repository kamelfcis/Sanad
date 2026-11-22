import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { createQuoteRequestSchema } from '@/lib/validations/quote-requests';

const QUOTE_SELECT = `
  id,
  customer_id,
  contractor_id,
  specialty,
  project_description,
  address,
  status,
  quoted_amount,
  booking_id,
  created_at,
  updated_at,
  contractor:profiles!quote_requests_contractor_id_fkey(full_name),
  customer:profiles!quote_requests_customer_id_fkey(full_name)
`;

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: 'خدمة العروض غير متاحة حالياً' }, { status: 503 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle();

  const role = profile?.role;
  if (role !== 'customer' && role !== 'technician' && role !== 'admin') {
    return NextResponse.json({ error: 'غير مسموح' }, { status: 403 });
  }

  const admin = createServiceRoleClient();
  let query = admin.from('quote_requests').select(QUOTE_SELECT).order('created_at', { ascending: false });
  if (role === 'customer') query = query.eq('customer_id', auth.user.id);
  if (role === 'technician') query = query.eq('contractor_id', auth.user.id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quotes: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: 'خدمة العروض غير متاحة حالياً' }, { status: 503 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (profile?.role !== 'customer') {
    return NextResponse.json({ error: 'طلب العرض متاح للعملاء فقط' }, { status: 403 });
  }

  const body = await parseJsonBody(request, createQuoteRequestSchema);
  if ('response' in body) return body.response;

  const admin = createServiceRoleClient();
  const { data: contractor } = await admin
    .from('technician_profiles')
    .select('id, provider_role, capacity_tier, verification_status')
    .eq('id', body.data.contractor_id)
    .maybeSingle();

  if (!contractor || contractor.provider_role !== 'contractor') {
    return NextResponse.json({ error: 'المقاول غير موجود' }, { status: 404 });
  }
  if (contractor.verification_status !== 'verified') {
    return NextResponse.json({ error: 'المقاول غير موثّق بعد' }, { status: 422 });
  }
  if (contractor.capacity_tier === 'none') {
    return NextResponse.json({ error: 'المقاول غير متاح لشغل جديد' }, { status: 422 });
  }

  const { data, error } = await admin
    .from('quote_requests')
    .insert({
      customer_id: auth.user.id,
      contractor_id: body.data.contractor_id,
      specialty: body.data.specialty ?? null,
      project_description: body.data.project_description,
      address: body.data.address,
      status: 'submitted',
    })
    .select('id, status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quote: data }, { status: 201 });
}
