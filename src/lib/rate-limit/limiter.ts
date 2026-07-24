/**
 * In-memory fixed-window rate limiter.
 *
 * NOTE: state lives in a module-level Map, so limits are enforced *per runtime
 * instance*. On multi-instance/serverless hosting (e.g. Vercel) this is
 * best-effort burst protection, not a global guarantee — pair it with Supabase
 * Auth rate limits and, for hard global limits, a shared store (Upstash Redis)
 * or the Cloudflare worker in `workers/rate-limiter/`. See docs/ENVIRONMENT.md.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastPrune = 0;

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Opportunistic cleanup so the Map does not grow unbounded.
  if (now - lastPrune > 60_000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
    lastPrune = now;
  }

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);

  return {
    ok: bucket.count <= limit,
    limit,
    remaining,
    retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}
