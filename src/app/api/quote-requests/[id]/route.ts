import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import { createBookingSchema } from '@/lib/validations/booking';
import { updateQuoteRequestSchema } from '@/lib/validations/quote-requests';
import { resolveServiceIdForSpecialty } from '@/lib/technician/register-profile';
import type { TechnicianSpecialtyValue } from '@/lib/constants/technician-registration';

async function resolveBookingServiceId(
  admin: ReturnType<typeof createServiceRoleClient>,
  contractorId: string,
  specialty: string | null,
) {
  if (specialty) {
    const fromSpecialty = await resolveServiceIdForSpecialty(
      admin,
      specialty as TechnicianSpecialtyValue,
    );
    if (fromSpecialty) return fromSpecialty;
  }

  const { data: skill } = await admin
    .from('technician_skills')
    .select('service_id')
    .eq('technician_id', contractorId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  return skill?.service_id ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: 'خدمة العروض غير متاحة حالياً' }, { status: 503 });
  }

  const body = await parseJsonBody(request, updateQuoteRequestSchema);
  if ('response' in body) return body.response;

  const admin = createServiceRoleClient();
  const { data: quote, error: quoteError } = await admin
    .from('quote_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (quoteError) return NextResponse.json({ error: quoteError.message }, { status: 500 });
  if (!quote) return NextResponse.json({ error: 'طلب العرض غير موجود' }, { status: 404 });

  const isCustomer = quote.customer_id === auth.user.id;
  const isContractor = quote.contractor_id === auth.user.id;

  if (body.data.action === 'quote') {
    if (!isContractor) return NextResponse.json({ error: 'غير مسموح' }, { status: 403 });
    if (quote.status !== 'submitted') {
      return NextResponse.json({ error: 'لا يمكن تسعير هذا الطلب الآن' }, { status: 422 });
    }

    const { data, error } = await admin
      .from('quote_requests')
      .update({
        status: 'quoted',
        quoted_amount: body.data.quoted_amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, status, quoted_amount')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ quote: data });
  }

  if (body.data.action === 'decline') {
    if (!isCustomer && !isContractor) {
      return NextResponse.json({ error: 'غير مسموح' }, { status: 403 });
    }
    if (quote.status === 'accepted') {
      return NextResponse.json({ error: 'الطلب مقبول بالفعل' }, { status: 422 });
    }

    const { data, error } = await admin
      .from('quote_requests')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, status')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ quote: data });
  }

  if (!isCustomer) return NextResponse.json({ error: 'غير مسموح' }, { status: 403 });
  if (quote.status === 'accepted' && quote.booking_id) {
    return NextResponse.json({ quote, booking_id: quote.booking_id });
  }
  if (quote.status !== 'quoted' || quote.quoted_amount == null) {
    return NextResponse.json({ error: 'لا يوجد عرض سعر لقبوله' }, { status: 422 });
  }

  const serviceId = await resolveBookingServiceId(admin, quote.contractor_id, quote.specialty);
  if (!serviceId) {
    return NextResponse.json({ error: 'تعذّر تحديد خدمة الحجز' }, { status: 422 });
  }

  const bookingInput = createBookingSchema.parse({
    service_id: serviceId,
    description: quote.project_description,
    location_address: quote.address,
    technician_id: quote.contractor_id,
    image_urls: [],
  });

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .insert({
      customer_id: auth.user.id,
      service_id: bookingInput.service_id,
      technician_id: bookingInput.technician_id,
      description: bookingInput.description,
      location_address: bookingInput.location_address,
      status: 'pending',
      price_quote: Number(quote.quoted_amount),
    })
    .select('id, status, technician_id')
    .single();

  if (bookingError) return NextResponse.json({ error: bookingError.message }, { status: 500 });

  const { data: updated, error: updateError } = await admin
    .from('quote_requests')
    .update({
      status: 'accepted',
      booking_id: booking.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, status, booking_id, quoted_amount')
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ quote: updated, booking });
}
