import type { SupabaseClient } from '@supabase/supabase-js';
import type { TechnicianSpecialtyValue } from '@/lib/constants/technician-registration';
import { specialtyToCategorySlug } from '@/lib/constants/technician-registration';
import { notifyAdminsNewTechnicianApplication } from '@/lib/notifications/events';

export type TechnicianRegistrationData = {
  fullName: string;
  phone: string;
  nationalId: string;
  specialty: string;
  yearsExperience: number;
  governorate: string;
  area: string;
  startingPrice: number;
  workingHours: string;
  bio: string;
};

export async function resolveServiceIdForSpecialty(
  supabase: SupabaseClient,
  specialty: string,
): Promise<string | null> {
  const categorySlug = specialtyToCategorySlug(specialty as TechnicianSpecialtyValue);

  const { data: category } = await supabase
    .from('service_categories')
    .select('id')
    .eq('slug', categorySlug)
    .maybeSingle();

  if (!category) return null;

  const { data: service } = await supabase
    .from('services')
    .select('id')
    .eq('category_id', category.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  return service?.id ?? null;
}

export async function upsertTechnicianRegistration(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  data: TechnicianRegistrationData,
  profilePhotoUrl: string,
  idCardPhotoUrl: string,
  options?: { notifyAdmin?: boolean },
): Promise<{ error?: string }> {
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name: data.fullName,
      phone: data.phone,
      role: 'technician',
      avatar_url: profilePhotoUrl,
    },
    { onConflict: 'id' },
  );

  if (profileError) return { error: profileError.message };

  const { error: techProfileError } = await supabase.from('technician_profiles').upsert({
    id: userId,
    bio: data.bio,
    years_experience: data.yearsExperience,
    national_id: data.nationalId,
    governorate: data.governorate,
    area: data.area,
    starting_price: data.startingPrice,
    working_hours: data.workingHours,
    profile_photo_url: profilePhotoUrl,
    id_card_photo_url: idCardPhotoUrl,
    id_document_url: idCardPhotoUrl,
    verification_docs: [idCardPhotoUrl],
    verification_status: 'pending',
    is_available: false,
  });

  if (techProfileError) return { error: techProfileError.message };

  const serviceId = await resolveServiceIdForSpecialty(supabase, data.specialty);
  if (serviceId) {
    await supabase.from('technician_skills').upsert(
      {
        technician_id: userId,
        service_id: serviceId,
        price_override: data.startingPrice,
        is_active: true,
      },
      { onConflict: 'technician_id,service_id' },
    );
  }

  if (options?.notifyAdmin !== false) {
    await notifyAdminsNewTechnicianApplication(userId, data.fullName);
  }

  return {};
}
