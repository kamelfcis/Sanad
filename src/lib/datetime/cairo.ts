const CAIRO_TIME_ZONE = 'Africa/Cairo';

/** Z or a numeric offset at the end of an ISO string. A bare datetime-local value has neither. */
const HAS_EXPLICIT_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i;

const WALL_TIME =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/;

export type CairoDateTimeOptions = Intl.DateTimeFormatOptions & {
  /** Arabic when the app is Arabic. Omit to follow the document language, defaulting to Arabic. */
  locale?: 'ar' | 'en';
};

function resolveLocale(locale?: 'ar' | 'en'): string {
  if (locale === 'en') return 'en-US';
  if (locale === 'ar') return 'ar-EG';
  if (typeof document !== 'undefined' && document.documentElement.lang.toLowerCase().startsWith('en')) {
    return 'en-US';
  }
  return 'ar-EG';
}

/** Milliseconds to add to UTC to get the Africa/Cairo wall clock at that instant. */
function cairoOffsetMs(utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CAIRO_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));

  const bag: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') bag[part.type] = part.value;
  }

  let hour = Number(bag.hour);
  if (hour === 24) hour = 0;

  const asUtc = Date.UTC(
    Number(bag.year),
    Number(bag.month) - 1,
    Number(bag.day),
    hour,
    Number(bag.minute),
    Number(bag.second),
  );
  return asUtc - utcMs;
}

/**
 * `datetime-local` has no offset. On the server, `new Date("YYYY-MM-DDTHH:mm")` is UTC,
 * so 19:00 is stored as 19:00Z and renders as 21:00 in Cairo (UTC+2).
 * Interpret a zoneless value as Africa/Cairo wall time and return the true UTC instant.
 * Strings that already end in Z or a numeric offset are parsed as that instant — not shifted again.
 */
export function preferredTimeLocalToIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (HAS_EXPLICIT_OFFSET.test(trimmed)) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const match = WALL_TIME.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] != null ? Number(match[6]) : 0;
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) {
    return null;
  }

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  let utcMs = utcGuess - cairoOffsetMs(utcGuess);
  const refined = cairoOffsetMs(utcMs);
  if (refined !== cairoOffsetMs(utcGuess)) {
    utcMs = utcGuess - refined;
  }

  const result = new Date(utcMs);
  return Number.isNaN(result.getTime()) ? null : result.toISOString();
}

/** Format an instant in Africa/Cairo. Uses ar-EG when the app language is Arabic. */
export function formatCairoDateTime(
  iso: string,
  options: CairoDateTimeOptions = { dateStyle: 'medium', timeStyle: 'short' },
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const { locale, ...formatOptions } = options;
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    ...formatOptions,
    timeZone: CAIRO_TIME_ZONE,
  }).format(date);
}
