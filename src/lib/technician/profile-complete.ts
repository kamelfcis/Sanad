export type TechnicianProfileFields = {
  national_id?: string | null;
  governorate?: string | null;
  bio?: string | null;
  profile_photo_url?: string | null;
  id_card_photo_url?: string | null;
} | null;

const REQUIRED_FIELDS = [
  'national_id',
  'governorate',
  'profile_photo_url',
  'id_card_photo_url',
] as const;

export function getTechnicianProfileMissingFields(
  profile: TechnicianProfileFields,
  skillsCount: number,
): string[] {
  const missing: string[] = [];
  if (!profile) return [...REQUIRED_FIELDS, 'skills'];
  for (const field of REQUIRED_FIELDS) {
    const value = profile[field];
    if (!value || String(value).trim().length === 0) missing.push(field);
  }
  if (skillsCount < 1) missing.push('skills');
  return missing;
}

export function isTechnicianProfileComplete(
  profile: TechnicianProfileFields,
  skillsCount: number,
): boolean {
  return getTechnicianProfileMissingFields(profile, skillsCount).length === 0;
}
