import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/api/auth';
import { technicianCompleteSchema } from '@/lib/validations/technician-registration';
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from '@/lib/validations/upload';
import { uploadFileForUser } from '@/lib/storage/upload';
import { upsertTechnicianRegistration } from '@/lib/technician/register-profile';

const IMAGE_MIME_TYPES = ALLOWED_UPLOAD_MIME_TYPES.filter((t) => t.startsWith('image/'));

function validateImageFile(file: File | null, label: string): string | null {
  if (!file || file.size === 0) return `${label} مطلوبة`;
  if (!IMAGE_MIME_TYPES.includes(file.type as (typeof IMAGE_MIME_TYPES)[number])) {
    return `${label}: نوع الملف غير مدعوم (JPEG, PNG, WebP فقط)`;
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return `${label}: حجم الملف أكبر من 10 ميجابايت`;
  }
  return null;
}

/** Authenticated technician (e.g. Google OAuth) completes sanaei-style registration fields. */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email, full_name')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (profile?.role !== 'technician') {
    return NextResponse.json({ error: 'هذا الحساب ليس حساب فني' }, { status: 403 });
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: 'خدمة التسجيل غير متاحة حالياً. تواصل مع الدعم.' },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'بيانات النموذج غير صالحة' }, { status: 400 });
  }

  const raw = {
    fullName: String(formData.get('fullName') ?? profile.full_name ?? ''),
    phone: String(formData.get('phone') ?? ''),
    nationalId: String(formData.get('nationalId') ?? ''),
    specialty: String(formData.get('specialty') ?? ''),
    yearsExperience: formData.get('yearsExperience'),
    governorate: String(formData.get('governorate') ?? ''),
    area: String(formData.get('area') ?? ''),
    startingPrice: formData.get('startingPrice'),
    workingHours: String(formData.get('workingHours') ?? ''),
    bio: String(formData.get('bio') ?? ''),
  };

  const parsed = technicianCompleteSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? 'بيانات غير صالحة';
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const profilePhoto = formData.get('profilePhoto');
  const idCardPhoto = formData.get('idCardPhoto');

  const profilePhotoError = validateImageFile(
    profilePhoto instanceof File ? profilePhoto : null,
    'صورة شخصية',
  );
  if (profilePhotoError) {
    return NextResponse.json({ error: profilePhotoError }, { status: 400 });
  }

  const idCardPhotoError = validateImageFile(
    idCardPhoto instanceof File ? idCardPhoto : null,
    'صورة البطاقة',
  );
  if (idCardPhotoError) {
    return NextResponse.json({ error: idCardPhotoError }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { data: phoneOwner } = await admin
    .from('profiles')
    .select('id')
    .eq('phone', parsed.data.phone)
    .neq('id', auth.user.id)
    .maybeSingle();

  if (phoneOwner) {
    return NextResponse.json({ error: 'رقم الموبايل مسجل بالفعل' }, { status: 409 });
  }

  const userId = auth.user.id;
  const email = profile.email ?? auth.user.email ?? '';

  const profilePhotoUrl = await uploadFileForUser(
    userId,
    profilePhoto as File,
    (profilePhoto as File).type,
  );
  const idCardPhotoUrl = await uploadFileForUser(
    userId,
    idCardPhoto as File,
    (idCardPhoto as File).type,
  );

  if (!profilePhotoUrl || !idCardPhotoUrl) {
    return NextResponse.json({ error: 'فشل رفع الصور. حاول مرة أخرى.' }, { status: 500 });
  }

  const result = await upsertTechnicianRegistration(
    admin,
    userId,
    email,
    {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      nationalId: parsed.data.nationalId,
      specialty: parsed.data.specialty,
      yearsExperience: parsed.data.yearsExperience,
      governorate: parsed.data.governorate,
      area: parsed.data.area,
      startingPrice: parsed.data.startingPrice,
      workingHours: parsed.data.workingHours,
      bio: parsed.data.bio,
    },
    profilePhotoUrl,
    idCardPhotoUrl,
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'تم إرسال طلب التسجيل بنجاح. سيتم مراجعته قريباً.',
  });
}
