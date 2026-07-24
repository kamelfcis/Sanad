import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit } from './limiter';

interface Rule {
  name: string;
  test: (pathname: string) => boolean;
  limit: number;
  windowMs: number;
}

// Ordered most-specific first. Auth mutation endpoints get the tightest budget.
const RULES: Rule[] = [
  { name: 'auth', test: (p) => p.startsWith('/api/auth/'), limit: 10, windowMs: 60_000 },
  { name: 'api', test: (p) => p.startsWith('/api/'), limit: 120, windowMs: 60_000 },
];

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Applies best-effort IP throttling to API routes. Returns a 429 response when
 * the caller is over budget, or null to let the request proceed. Disabled when
 * `RATE_LIMIT_ENABLED` is explicitly set to `false` (useful for E2E/local runs).
 */
export function applyRateLimit(request: NextRequest): NextResponse | null {
  if (process.env.RATE_LIMIT_ENABLED === 'false') return null;

  const pathname = request.nextUrl.pathname;
  const rule = RULES.find((r) => r.test(pathname));
  if (!rule) return null;

  const key = `${rule.name}:${getClientIp(request)}`;
  const result = checkRateLimit(key, rule.limit, rule.windowMs);
  if (result.ok) return null;

  return NextResponse.json(
    { error: 'عدد كبير من الطلبات. يرجى المحاولة بعد قليل.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSec),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
      },
    },
  );
}
