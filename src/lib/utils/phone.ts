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

/** Build a `wa.me` link (`20…`) from the same Egyptian number as `toTelHref`. */
export function toWhatsAppHref(phone: string, message?: string): string {
  const tel = toTelHref(phone);
  if (!tel.startsWith('tel:')) return '';

  const digits = tel.slice(4).replace(/\D/g, '');
  if (!digits) return '';

  const base = `https://wa.me/${digits}`;
  const text = message?.trim();
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
