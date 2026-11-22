import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/admin';

export interface TechnicianPublicIdentity {
  technician: { full_name: string | null; avatar_url: string | null } | null;
  technician_profile: { profile_photo_url: string | null } | null;
}

/**
 * Name and photo for a booking's technician. Uses the service role because
 * profile RLS does not let a customer read another user's row, and
 * technician_profiles is not a direct foreign key of bookings.
 */
export async function loadTechnicianPublicIdentities(
  technicianIds: Array<string | null | undefined>,
): Promise<Map<string, TechnicianPublicIdentity>> {
  const ids = [...new Set(technicianIds.filter((id): id is string => Boolean(id)))];
  const map = new Map<string, TechnicianPublicIdentity>();
  if (ids.length === 0 || !isServiceRoleConfigured()) return map;

  const db = createServiceRoleClient();
  const [{ data: profiles }, { data: photos }] = await Promise.all([
    db.from('profiles').select('id, full_name, avatar_url').in('id', ids),
    db.from('technician_profiles').select('id, profile_photo_url').in('id', ids),
  ]);

  const photoById = new Map(
    (photos ?? []).map((row) => [row.id as string, (row.profile_photo_url as string | null) ?? null]),
  );

  for (const id of ids) {
    const profile = (profiles ?? []).find((row) => row.id === id);
    map.set(id, {
      technician: profile
        ? {
            full_name: (profile.full_name as string | null) ?? null,
            avatar_url: (profile.avatar_url as string | null) ?? null,
          }
        : null,
      technician_profile: { profile_photo_url: photoById.get(id) ?? null },
    });
  }

  return map;
}
