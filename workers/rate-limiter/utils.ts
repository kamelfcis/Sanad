export interface Env {
  RATE_LIMIT_KV: KVNamespace;
  RATE_LIMIT_SECRET?: string;
}

interface RateLimitRule {
  windowSeconds: number;
  maxRequests: number;
}

export interface RateLimitConfig {
  match: RegExp;
  methods?: string[];
  ip: RateLimitRule;
  user?: RateLimitRule;
}

export const RULES: RateLimitConfig[] = [
  {
    match: /^\/api\/auth\/(login|signup|register)/,
    methods: ['POST'],
    ip: { windowSeconds: 900, maxRequests: 10 },
    user: { windowSeconds: 900, maxRequests: 5 },
  },
  {
    match: /^\/api\/upload/,
    methods: ['POST'],
    ip: { windowSeconds: 3600, maxRequests: 30 },
    user: { windowSeconds: 3600, maxRequests: 20 },
  },
  {
    match: /^\/api\/bookings$/,
    methods: ['POST'],
    ip: { windowSeconds: 3600, maxRequests: 20 },
    user: { windowSeconds: 3600, maxRequests: 10 },
  },
  {
    match: /^\/api\/bookings\/[^/]+$/,
    methods: ['PATCH'],
    ip: { windowSeconds: 3600, maxRequests: 30 },
    user: { windowSeconds: 3600, maxRequests: 15 },
  },
  {
    match: /^\/api\/services$/,
    methods: ['GET'],
    ip: { windowSeconds: 60, maxRequests: 60 },
    user: { windowSeconds: 60, maxRequests: 40 },
  },
  {
    match: /^\/api\/admin\/technicians$/,
    methods: ['GET'],
    ip: { windowSeconds: 60, maxRequests: 40 },
    user: { windowSeconds: 60, maxRequests: 30 },
  },
  {
    match: /^\/api\/chat\/conversations\/[^/]+\/messages$/,
    methods: ['POST'],
    ip: { windowSeconds: 60, maxRequests: 60 },
    user: { windowSeconds: 60, maxRequests: 30 },
  },
  {
    match: /^\/api\/reviews$/,
    methods: ['POST'],
    ip: { windowSeconds: 3600, maxRequests: 20 },
    user: { windowSeconds: 3600, maxRequests: 10 },
  },
  {
    match: /^\/api\/admin\//,
    ip: { windowSeconds: 60, maxRequests: 100 },
    user: { windowSeconds: 60, maxRequests: 80 },
  },
];

export function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

export function getUserId(request: Request): string | null {
  return request.headers.get('x-user-id') ?? request.headers.get('authorization')?.slice(0, 32) ?? null;
}

export function findRule(pathname: string, method: string): RateLimitConfig | null {
  for (const rule of RULES) {
    if (!rule.match.test(pathname)) continue;
    if (rule.methods && !rule.methods.includes(method)) continue;
    return rule;
  }
  return null;
}

export async function checkLimit(
  kv: KVNamespace,
  key: string,
  rule: RateLimitRule,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % rule.windowSeconds);
  const kvKey = `${key}:${windowStart}`;

  const current = parseInt((await kv.get(kvKey)) ?? '0', 10);
  const next = current + 1;

  await kv.put(kvKey, String(next), { expirationTtl: rule.windowSeconds + 5 });

  const resetAt = windowStart + rule.windowSeconds;
  return {
    allowed: next <= rule.maxRequests,
    remaining: Math.max(0, rule.maxRequests - next),
    resetAt,
  };
}

export async function applyRateLimit(
  request: Request,
  env: Env,
): Promise<Response | { remaining: number; passthrough: true }> {
  const url = new URL(request.url);
  const rule = findRule(url.pathname, request.method);

  if (!rule) {
    return { remaining: -1, passthrough: true };
  }

  const ip = getClientIp(request);
  const userId = getUserId(request);

  const ipResult = await checkLimit(env.RATE_LIMIT_KV, `ip:${ip}:${url.pathname}`, rule.ip);

  if (!ipResult.allowed) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.max(0, ipResult.resetAt - Math.floor(Date.now() / 1000))),
        'X-RateLimit-Remaining': '0',
      },
    });
  }

  if (rule.user && userId) {
    const userResult = await checkLimit(
      env.RATE_LIMIT_KV,
      `user:${userId}:${url.pathname}`,
      rule.user,
    );

    if (!userResult.allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.max(0, userResult.resetAt - Math.floor(Date.now() / 1000))),
          'X-RateLimit-Remaining': '0',
        },
      });
    }
  }

  return { remaining: ipResult.remaining, passthrough: true };
}
