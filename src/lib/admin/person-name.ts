const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PHONE_RE = /^\+?\d[\d\s().-]{6,}$/;

/**
 * A person's name is never an email, phone, or id. Those belong on a
 * secondary contact line.
 */
export function isUsablePersonName(value: string | null | undefined): boolean {
  const name = value?.trim() ?? '';
  if (!name) return false;
  if (name.includes('@')) return false;
  if (UUID_RE.test(name)) return false;
  if (PHONE_RE.test(name)) return false;
  return true;
}

export function personDisplayName(
  fullName: string | null | undefined,
  emptyLabel: string,
): string {
  const name = fullName?.trim() ?? '';
  return isUsablePersonName(name) ? name : emptyLabel;
}
