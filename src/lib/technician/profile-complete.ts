/** Fields required before a technician can receive job assignments (sanaei-style onboarding). */
export type TechnicianProfileRow = {
  national_id: string | null;
  governorate: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  id_card_photo_url: string | null;
};

export function isTechnicianProfileComplete(
  profile: TechnicianProfileRow | null | undefined,
  skillsCount = 0,
): boolean {
  if (!profile) return false;
  return (
    !!profile.national_id &&
    !!profile.governorate &&
    !!profile.bio &&
    !!profile.profile_photo_url &&
    !!profile.id_card_photo_url &&
    skillsCount > 0
  );
}
