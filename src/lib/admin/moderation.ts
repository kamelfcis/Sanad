/**
 * Guards shared by the admin block and delete routes. Both operations are
 * irreversible from the acting admin's point of view, so the same three
 * accounts are off-limits to both: other admins, the caller themselves, and the
 * seeded root admin.
 */

/** The seeded root admin. Never blockable or deletable, whatever its role says. */
export const PROTECTED_ADMIN_EMAIL = 'admin@sanad.app';

/** Machine codes the client maps to Arabic copy via `translateAdminError`. */
export const MODERATION_ERRORS = {
  SELF: 'ADMIN_MODERATE_SELF_FORBIDDEN',
  ADMIN: 'ADMIN_MODERATE_ADMIN_FORBIDDEN',
  PROTECTED: 'ADMIN_MODERATE_PROTECTED_FORBIDDEN',
} as const;

export interface ModerationTarget {
  id: string;
  role: string | null;
  email: string | null;
}

/**
 * Returns an error code when `target` must not be blocked or deleted, or null
 * when the action may proceed.
 */
export function moderationBlocker(
  target: ModerationTarget,
  actingAdminId: string,
): (typeof MODERATION_ERRORS)[keyof typeof MODERATION_ERRORS] | null {
  if (target.id === actingAdminId) return MODERATION_ERRORS.SELF;
  if (target.email?.toLowerCase() === PROTECTED_ADMIN_EMAIL) return MODERATION_ERRORS.PROTECTED;
  if (target.role === 'admin') return MODERATION_ERRORS.ADMIN;
  return null;
}

/**
 * Same rule applied to a list row so the admin screens can grey out a checkbox
 * instead of offering a bulk delete that only fails server-side. The server
 * stays the source of truth; this just keeps obviously-doomed rows out of the
 * batch. `actingAdminId` is optional because not every list knows who is
 * signed in — self-deletes then fall back to the API error.
 */
export function isUserRowDeletable(
  row: { id: string; email?: string | null; role?: string | null },
  actingAdminId?: string | null,
): boolean {
  return (
    moderationBlocker(
      { id: row.id, email: row.email ?? null, role: row.role ?? null },
      actingAdminId ?? '',
    ) === null
  );
}
