import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { normalizeEgyptianPhone, phoneToTechnicianEmail } from '@/lib/constants/technician-registration';
import { checkRateLimit } from '@/lib/rate-limit/limiter';
import { parseJsonBody } from '@/lib/api/validate';

const schema = z.object({
  phone: z
    .string()
    .min(1)
    .transform(normalizeEgyptianPhone)
    .refine((phone) => /^01[0125]\d{8}$/.test(phone), 'رقم موبايل غير صالح'),
  nationalId: z.string().regex(/^\d{14}$/, 'الرقم القومي يجب أن يكون 14 رقم'),
  newPassword: z.string().min(8, 'كلمة المرور 8 أحرف على الأقل').max(128),
});

function clientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: NextRequest) {
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: 'الخدمة غير متاحة حالياً' }, { status: 503 });
  }

  const limit = checkRateLimit(`tech-reset:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'محاولات كثيرة. حاول بعد ساعة.' },
      { status: 429 },
    );
  }

  const parsed = await parseJsonBody(request, schema);
  if ('response' in parsed) return parsed.response;

  const { phone, nationalId, newPassword } = parsed.data;
  const email = phoneToTechnicianEmail(phone);
  const supabase = createServiceRoleClient();

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .eq('role', 'technician')
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }
  if (!profileRow) {
    return NextResponse.json({ error: 'لا يوجد حساب صنايعي بهذا الرقم' }, { status: 404 });
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profileRow.id);
  if (authError || !authUser.user) {
    return NextResponse.json({ error: 'لا يوجد حساب بهذا الرقم' }, { status: 404 });
  }
  if (authUser.user.email?.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: 'بيانات الحساب غير متطابقة' }, { status: 403 });
  }

  const { data: techProfile, error: techError } = await supabase
    .from('technician_profiles')
    .select('national_id')
    .eq('id', profileRow.id)
    .maybeSingle();

  if (techError) {
    return NextResponse.json({ error: techError.message }, { status: 500 });
  }
  if (!techProfile || techProfile.national_id !== nationalId) {
    return NextResponse.json(
      { error: 'الرقم القومي لا يطابق البيانات المسجّلة' },
      { status: 403 },
    );
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(profileRow.id, {
    password: newPassword,
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'تم تعيين كلمة مرور جديدة. يمكنك الدخول برقم الموبايل وكلمة المرور.',
  });
}
