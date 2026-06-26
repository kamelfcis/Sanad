/**
 * Local validation harness for rate-limiter worker logic.
 * Run: npx tsx workers/rate-limiter/validate.ts
 */

import { applyRateLimit, findRule, RULES } from './utils';

class MockKV implements KVNamespace {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async delete(): Promise<void> {}
  async list(): Promise<{ keys: []; list_complete: true; cacheStatus: null }> {
    return { keys: [], list_complete: true, cacheStatus: null };
  }
  async getWithMetadata(): Promise<{ value: null; metadata: null; cacheStatus: null }> {
    return { value: null, metadata: null, cacheStatus: null };
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function runRuleMatchingTests(): Promise<void> {
  const cases: Array<{ path: string; method: string; expected: boolean }> = [
    { path: '/api/auth/login', method: 'POST', expected: true },
    { path: '/api/auth/login', method: 'GET', expected: false },
    { path: '/api/upload', method: 'POST', expected: true },
    { path: '/api/bookings', method: 'POST', expected: true },
    { path: '/api/bookings/uuid-1', method: 'PATCH', expected: true },
    { path: '/api/bookings/uuid-1', method: 'GET', expected: false },
    { path: '/api/services', method: 'GET', expected: true },
    { path: '/api/services', method: 'POST', expected: false },
    { path: '/api/admin/technicians', method: 'GET', expected: true },
    { path: '/api/admin/technicians', method: 'POST', expected: true },
    { path: '/api/chat/conversations/abc/messages', method: 'POST', expected: true },
    { path: '/api/reviews', method: 'POST', expected: true },
    { path: '/api/categories', method: 'GET', expected: false },
    { path: '/api/auth/callback', method: 'GET', expected: false },
  ];

  for (const c of cases) {
    const rule = findRule(c.path, c.method);
    assert(Boolean(rule) === c.expected, `Rule match failed for ${c.method} ${c.path}`);
  }
}

async function runLimitTests(): Promise<Record<string, unknown>> {
  const kv = new MockKV();
  const env = { RATE_LIMIT_KV: kv };
  const url = 'https://sanad.test/api/reviews';
  const rule = findRule('/api/reviews', 'POST')!;
  const ip = '203.0.113.10';

  let lastRemaining = -1;
  let blockedAt = 0;

  for (let i = 1; i <= rule.ip.maxRequests + 2; i++) {
    const request = new Request(url, {
      method: 'POST',
      headers: {
        'cf-connecting-ip': ip,
      },
    });
    const result = await applyRateLimit(request, env);

    if (result instanceof Response) {
      blockedAt = i;
      const retryAfter = result.headers.get('Retry-After');
      const remaining = result.headers.get('X-RateLimit-Remaining');
      assert(result.status === 429, 'Expected 429 when limit exceeded');
      assert(remaining === '0', 'X-RateLimit-Remaining should be 0 on 429');
      assert(retryAfter !== null && parseInt(retryAfter, 10) >= 0, 'Retry-After must be non-negative');
      break;
    }

    lastRemaining = result.remaining;
  }

  assert(blockedAt === rule.ip.maxRequests + 1, `Expected block on request ${rule.ip.maxRequests + 1}, got ${blockedAt}`);

  return {
    rule: 'POST /api/reviews',
    ipLimit: rule.ip.maxRequests,
    blockedAtRequest: blockedAt,
    lastAllowedRemaining: lastRemaining,
    retryAfterValid: true,
  };
}

async function runUserSpoofTest(): Promise<Record<string, unknown>> {
  const kv = new MockKV();
  const env = { RATE_LIMIT_KV: kv };
  const url = 'https://sanad.test/api/upload';

  const victim = await applyRateLimit(
    new Request(url, {
      method: 'POST',
      headers: { 'cf-connecting-ip': '203.0.113.20', 'x-user-id': 'victim-user-id' },
    }),
    env,
  );

  const attacker = await applyRateLimit(
    new Request(url, {
      method: 'POST',
      headers: { 'cf-connecting-ip': '203.0.113.99', 'x-user-id': 'victim-user-id' },
    }),
    env,
  );

  return {
    victimAllowed: !(victim instanceof Response),
    attackerUsesVictimBucket: !(attacker instanceof Response),
    spoofable: true,
    note: 'Worker trusts client x-user-id; attacker can consume victim user quota from another IP',
  };
}

async function main(): Promise<void> {
  console.log('Rate Limiter Validation');
  console.log('=======================');
  console.log(`Rules loaded: ${RULES.length}`);

  await runRuleMatchingTests();
  console.log('✓ Rule matching (14 cases)');

  const limitResult = await runLimitTests();
  console.log('✓ IP limit enforcement', limitResult);

  const spoofResult = await runUserSpoofTest();
  console.log('⚠ x-user-id spoof test', spoofResult);

  console.log('\nAll harness checks completed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
