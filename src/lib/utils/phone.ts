import { normalizeEgyptianPhone } from '@/lib/constants/technician-registration';

/** Build a `tel:` href from a stored Egyptian phone (local 01… or +20…). */
export function toTelHref(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('+')) {
    return `tel:${trimmed.replace(/\s/g, '')}`;
  }

  const local = normalizeEgyptianPhone(trimmed);
  if (local.startsWith('0') && local.length === 11) {
    return `tel:+20${local.slice(1)}`;
  }

  return `tel:${local.replace(/\s/g, '')}`;
}
