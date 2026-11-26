import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { parseJsonBody } from '@/lib/api/validate';
import {
  updateTechnicianProfileSchema,
  updateTechnicianSkillsSchema,
} from '@/lib/validations/technicians';
import { bookingStatusSchema } from '@/lib/validations/common';

const technicianBookingsQuerySchema = bookingStatusSchema.optional().transform((val) => val);

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const { data, error } = await supabase
    .from('technician_profiles')
    .select('*')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const parsed = await parseJsonBody(request, updateTechnicianProfileSchema);
  if ('response' in parsed) return parsed.response;

  const { bio, years_experience, max_distance_km, is_available, phone } = parsed.data;

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from('technician_profiles')
    .select('verification_status, is_available')
    .eq('id', auth.user.id)
    .maybeSingle();
  if (currentProfileError) {
    return NextResponse.json({ error: currentProfileError.message }, { status: 500 });
  }
  const nextIsAvailable = is_available ?? Boolean(currentProfile?.is_available);

  if (is_available === true) {
    if (!currentProfile || currentProfile.verification_status !== 'verified') {
      return NextResponse.json(
        { error: 'لا يمكن تفعيل التوفر قبل اكتمال توثيق حسابك من الإدارة.' },
        { status: 422 },
      );
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from('provider_subscriptions')
      .select('active_until')
      .eq('provider_id', auth.user.id)
      .maybeSingle();

    if (subscriptionError) {
      return NextResponse.json({ error: 'تعذر التحقق من حالة الاشتراك.' }, { status: 500 });
    }
    if (!subscription?.active_until || new Date(subscription.active_until).getTime() <= Date.now()) {
      return NextResponse.json(
        {
          code: 'PROVIDER_SUBSCRIPTION_REQUIRED',
          error: 'اشترك مقابل 10 جنيهات شهرياً لتفعيل ظهورك واستقبال الحجوزات.',
        },
        { status: 402 },
      );
    }
  }

  const updates: Record<string, unknown> = {};
  if (bio !== undefined) updates.bio = bio;
  if (years_experience !== undefined) updates.years_experience = years_experience;
  if (max_distance_km !== undefined) updates.max_distance_km = max_distance_km;
  if (is_available !== undefined) updates.is_available = nextIsAvailable;

  const { data, error } = await supabase
    .from('technician_profiles')
    .update(updates)
    .eq('id', auth.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (phone) {
    await supabase.from('profiles').update({ phone }).eq('id', auth.user.id);
  }

  return NextResponse.json(data);
}
