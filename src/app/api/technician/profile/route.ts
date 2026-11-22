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

  if (is_available === true) {
    const { data: current, error: currentError } = await supabase
      .from('technician_profiles')
      .select('verification_status')
      .eq('id', auth.user.id)
      .maybeSingle();

    if (currentError) {
      return NextResponse.json({ error: currentError.message }, { status: 500 });
    }

    if (!current || current.verification_status !== 'verified') {
      return NextResponse.json(
        { error: 'لا يمكن تفعيل التوفر قبل اكتمال توثيق حسابك من الإدارة.' },
        { status: 422 },
      );
    }
  }

  const { data, error } = await supabase
    .from('technician_profiles')
    .upsert({
      id: auth.user.id,
      bio: bio ?? null,
      years_experience: years_experience ?? null,
      max_distance_km: max_distance_km ?? 20.0,
      is_available: is_available ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (phone) {
    await supabase.from('profiles').update({ phone }).eq('id', auth.user.id);
  }

  return NextResponse.json(data);
}
