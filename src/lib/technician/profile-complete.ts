/** Fields required before a technician can receive job assignments (sanaei-style onboarding). */
export type TechnicianProfileRow = {
  national_id: string | null;
  governorate: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  id_card_photo_url: string | null;
};

export type TechnicianProfileMissingField =
  | 'national_id'
  | 'governorate'
  | 'bio'
  | 'profile_photo_url'
  | 'id_card_photo_url'
  | 'skills';

export const TECHNICIAN_PROFILE_MISSING_LABELS: Record<
  TechnicianProfileMissingField,
  { en: string; ar: string }
> = {
  national_id: { en: 'National ID', ar: 'الرقم القومي' },
  governorate: { en: 'Governorate', ar: 'المحافظة' },
  bio: { en: 'Bio', ar: 'نبذة عنك' },
  profile_photo_url: { en: 'Profile photo', ar: 'صورة شخصية' },
  id_card_photo_url: { en: 'ID card photo', ar: 'صورة البطاقة' },
  skills: { en: 'At least one service/skill', ar: 'تخصص واحد على الأقل' },
};

export function getTechnicianProfileMissingFields(
  profile: TechnicianProfileRow | null | undefined,
  skillsCount = 0,
): TechnicianProfileMissingField[] {
  const missing: TechnicianProfileMissingField[] = [];
  if (!profile) {
    return ['national_id', 'governorate', 'bio', 'profile_photo_url', 'id_card_photo_url', 'skills'];
  }
  if (!profile.national_id) missing.push('national_id');
  if (!profile.governorate) missing.push('governorate');
  if (!profile.bio) missing.push('bio');
  if (!profile.profile_photo_url) missing.push('profile_photo_url');
  if (!profile.id_card_photo_url) missing.push('id_card_photo_url');
  if (skillsCount <= 0) missing.push('skills');
  return missing;
}

export function isTechnicianProfileComplete(
  profile: TechnicianProfileRow | null | undefined,
  skillsCount = 0,
): boolean {
  return getTechnicianProfileMissingFields(profile, skillsCount).length === 0;
}
