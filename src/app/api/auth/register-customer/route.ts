import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { parseJsonBody } from '@/lib/api/validate';
import { registerSchema } from '@/lib/validations/auth';

export async function POST(request: NextRequest) {
  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: 'خدمة التسجيل غير متاحة حالياً. تواصل مع الدعم.' },
      { status: 503 },
    );
  }

  const body = await parseJsonBody(request, registerSchema);
  if ('response' in body) return body.response;

  if (body.data.role !== 'customer') {
    return NextResponse.json({ error: 'تسجيل الفني يتم من نموذج الفني' }, { status: 400 });
  }

  const { fullName, email, password } = body.data;
  const supabase = createServiceRoleClient();

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingProfile) {
    return NextResponse.json({ error: 'هذا البريد مسجل بالفعل' }, { status: 409 });
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'customer',
    },
  });

  if (authError || !authData.user) {
    const message =
      authError?.message.includes('already') || authError?.code === 'email_exists'
        ? 'هذا البريد مسجل بالفعل'
        : authError?.message ?? 'فشل إنشاء الحساب';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const userId = authData.user.id;
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      role: 'customer',
    },
    { onConflict: 'id' },
  );

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId });
}
