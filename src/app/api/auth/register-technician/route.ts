import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { phoneToTechnicianEmail } from '@/lib/constants/technician-registration';
import { technicianRegisterSchema } from '@/lib/validations/technician-registration';
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

export async function POST(request: NextRequest) {
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
    fullName: String(formData.get('fullName') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    password: String(formData.get('password') ?? ''),
    nationalId: String(formData.get('nationalId') ?? ''),
    specialty: String(formData.get('specialty') ?? ''),
    yearsExperience: formData.get('yearsExperience'),
    governorate: String(formData.get('governorate') ?? ''),
    area: String(formData.get('area') ?? ''),
    startingPrice: formData.get('startingPrice'),
    workingHours: String(formData.get('workingHours') ?? ''),
    bio: String(formData.get('bio') ?? ''),
  };

  const parsed = technicianRegisterSchema.safeParse(raw);
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

  const data = parsed.data;
  const email = phoneToTechnicianEmail(data.phone);
  const supabase = createServiceRoleClient();

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', data.phone)
    .maybeSingle();

  if (existingProfile) {
    return NextResponse.json({ error: 'رقم الموبايل مسجل بالفعل' }, { status: 409 });
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName,
      role: 'technician',
      phone: data.phone,
    },
  });

  if (authError || !authData.user) {
    const message =
      authError?.message.includes('already registered') ||
      authError?.message.includes('already been registered')
        ? 'رقم الموبايل أو البريد مسجل بالفعل'
        : authError?.message ?? 'فشل إنشاء الحساب';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const userId = authData.user.id;

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
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: 'فشل رفع الصور. حاول مرة أخرى.' }, { status: 500 });
  }

  const result = await upsertTechnicianRegistration(
    supabase,
    userId,
    email,
    {
      fullName: data.fullName,
      phone: data.phone,
      nationalId: data.nationalId,
      specialty: data.specialty,
      yearsExperience: data.yearsExperience,
      governorate: data.governorate,
      area: data.area,
      startingPrice: data.startingPrice,
      workingHours: data.workingHours,
      bio: data.bio,
    },
    profilePhotoUrl,
    idCardPhotoUrl,
  );

  if (result.error) {
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'تم إرسال طلب التسجيل بنجاح. سيتم مراجعته قريباً.',
  });
}
