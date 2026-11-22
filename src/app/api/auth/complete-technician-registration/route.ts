import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/api/auth';
import { technicianCompleteSchema } from '@/lib/validations/technician-registration';
import { ALLOWED_UPLOAD_MIME_TYPES } from '@/lib/validations/upload';
import { MAX_REGISTRATION_UPLOAD_BYTES } from '@/lib/validations/registration-upload';
import { uploadKycFileForUser, uploadProfilePhotoForUser } from '@/lib/storage/upload';
import {
  upsertTechnicianRegistration,
  type TechnicianRegistrationData,
} from '@/lib/technician/register-profile';

const IMAGE_MIME_TYPES = ALLOWED_UPLOAD_MIME_TYPES.filter((t) => t.startsWith('image/'));

function validateImageFile(file: File | null, label: string): string | null {
  if (!file || file.size === 0) return `${label} مطلوبة`;
  if (!IMAGE_MIME_TYPES.includes(file.type as (typeof IMAGE_MIME_TYPES)[number])) {
    return `${label}: نوع الملف غير مدعوم (JPEG, PNG, WebP فقط)`;
  }
  if (file.size > MAX_REGISTRATION_UPLOAD_BYTES) {
    const maxMb = MAX_REGISTRATION_UPLOAD_BYTES / (1024 * 1024);
    return `${label}: حجم الملف أكبر من ${maxMb} ميجابايت`;
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
    providerRole: String(formData.get('providerRole') ?? ''),
    contractorKind: String(formData.get('contractorKind') ?? ''),
    capacityTier: String(formData.get('capacityTier') ?? ''),
    teamSize: formData.get('teamSize') ?? '',
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
  const idCardBackPhoto = formData.get('idCardBackPhoto');

  const profilePhotoError = validateImageFile(
    profilePhoto instanceof File ? profilePhoto : null,
    'صورة شخصية',
  );
  if (profilePhotoError) {
    return NextResponse.json({ error: profilePhotoError }, { status: 400 });
  }

  const idCardPhotoError = validateImageFile(
    idCardPhoto instanceof File ? idCardPhoto : null,
    'صورة وش البطاقة',
  );
  if (idCardPhotoError) {
    return NextResponse.json({ error: idCardPhotoError }, { status: 400 });
  }

  const idCardBackPhotoError = validateImageFile(
    idCardBackPhoto instanceof File ? idCardBackPhoto : null,
    'صورة ضهر البطاقة',
  );
  if (idCardBackPhotoError) {
    return NextResponse.json({ error: idCardBackPhotoError }, { status: 400 });
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

  const profileUpload = await uploadProfilePhotoForUser(userId, profilePhoto as File);
  if (!profileUpload.ok && profileUpload.error !== 'storage_not_configured') {
    return NextResponse.json({ error: profileUpload.error }, { status: 400 });
  }
  const idCardUpload = await uploadKycFileForUser(
    userId,
    idCardPhoto as File,
    (idCardPhoto as File).type,
  );
  const idCardBackUpload = await uploadKycFileForUser(
    userId,
    idCardBackPhoto as File,
    (idCardBackPhoto as File).type,
  );

  if (!profileUpload.ok || !idCardUpload.ok || !idCardBackUpload.ok) {
    return NextResponse.json({ error: 'فشل رفع الصور. حاول مرة أخرى.' }, { status: 500 });
  }

  const registration: TechnicianRegistrationData = {
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    nationalId: parsed.data.nationalId,
    specialty: parsed.data.specialty,
    providerRole: parsed.data.providerRole as TechnicianRegistrationData['providerRole'],
    contractorKind: parsed.data.contractorKind as TechnicianRegistrationData['contractorKind'],
    capacityTier: parsed.data.capacityTier as TechnicianRegistrationData['capacityTier'],
    teamSize: parsed.data.teamSize,
    yearsExperience: parsed.data.yearsExperience,
    governorate: parsed.data.governorate,
    area: parsed.data.area,
    startingPrice: parsed.data.startingPrice,
    workingHours: parsed.data.workingHours,
    bio: parsed.data.bio,
  };

  const result = await upsertTechnicianRegistration(
    admin,
    userId,
    email,
    registration,
    profileUpload.url,
    idCardUpload.url,
    idCardBackUpload.url,
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'تم إرسال طلب التسجيل بنجاح. سيتم مراجعته قريباً.',
  });
}
