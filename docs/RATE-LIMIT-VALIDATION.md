# Rate Limit & Security Validation — Phase 9

**Date:** 2025-06-25  
**Scope:** Cloudflare Worker rate limiter, API auth posture, load simulation, route coverage  
**Environment:** Local Next.js dev (`localhost:3000`) + in-process worker harness (`workers/rate-limiter/validate.ts`)

---

## Executive Summary

| Area | Status | Notes |
|------|--------|-------|
| Worker logic | ✅ Pass | Rule matching, 429 headers, KV counter math verified via harness |
| Worker deployment | ⚠️ Not ready | KV namespace ID still placeholder in `wrangler.toml` |
| Next.js auth layer | ✅ Pass | Protected routes return 401 without session |
| Admin API protection | ✅ Pass | All 15 admin routes use `requireAuth` + `requireAdmin` |
| User identity for limits | ✅ Fixed (2025-06-25) | Middleware strips spoofed `x-user-id` and sets from `getUser()` |

**Post-review fixes applied:**
- `src/lib/supabase/middleware.ts` — trusted `x-user-id` from verified session
- `00014_profiles_rls_fix.sql` — `is_admin()` SECURITY DEFINER to fix profiles RLS recursion

**Phase 9 Security Validation Score: 8/10** (middleware x-user-id fix, profiles RLS fix, reviews RLS; worker deploy still required)

Worker implementation is sound for IP-based limiting, but production readiness is blocked by deployment, identity trust, and several unprotected routes. Application-layer auth is strong.

---

## 1. Worker Verification

### 1.1 KV Namespace Configuration

| Check | Result |
|-------|--------|
| Binding name `RATE_LIMIT_KV` in `wrangler.toml` | ✅ Present |
| Namespace ID | ❌ `REPLACE_WITH_KV_NAMESPACE_ID` — must be replaced before deploy |
| TTL on counters | ✅ `expirationTtl: windowSeconds + 5` |

**Action required:** Run `npx wrangler kv namespace create RATE_LIMIT_KV` and update `wrangler.toml`.

### 1.2 Retry-After Header

Tested via `workers/rate-limiter/validate.ts` against mock KV:

| Scenario | Expected | Actual |
|----------|----------|--------|
| Block on request 21 (IP limit 20 for `POST /api/reviews`) | 429 | ✅ 429 |
| `Retry-After` present | ≥ 0 seconds | ✅ Valid integer |
| `X-RateLimit-Remaining` on 429 | `0` | ✅ `0` |

Formula: `resetAt - now` where `resetAt = windowStart + windowSeconds`.

### 1.3 X-RateLimit-Remaining

| Scenario | Expected | Actual |
|----------|----------|--------|
| Last allowed request (20/20) | `0` | ✅ `0` |
| Blocked request | `0` | ✅ `0` |

Note: On success passthrough, only IP bucket remaining is forwarded (user bucket not reflected in header).

### 1.4 Rule Matching

Harness verified 14 path/method combinations:

| Route | Method | Matched |
|-------|--------|---------|
| `/api/auth/login` | POST | ✅ |
| `/api/auth/login` | GET | ❌ (pass-through) |
| `/api/upload` | POST | ✅ |
| `/api/bookings` | POST | ✅ |
| `/api/bookings/{id}` | PATCH | ✅ (new) |
| `/api/bookings/{id}` | GET | ❌ |
| `/api/services` | GET | ✅ (new) |
| `/api/admin/technicians` | GET | ✅ (new) |
| `/api/admin/technicians` | POST | ✅ (admin catch-all) |
| `/api/chat/conversations/{id}/messages` | POST | ✅ |
| `/api/reviews` | POST | ✅ |
| `/api/categories` | GET | ❌ |
| `/api/auth/callback` | GET | ❌ |

First-match wins: specific rules (`/api/admin/technicians` GET) are evaluated before the `/api/admin/` catch-all.

### 1.5 Route Bypasses (Unmatched — No Edge Limit)

These routes pass through the worker without rate limiting:

| Route | Risk | Recommendation |
|-------|------|----------------|
| `/api/categories` GET | Low | Add read limit (60/min IP) |
| `/api/reviews` GET | Medium | Scraping public reviews |
| `/api/bookings` GET | Medium | Authenticated list polling |
| `/api/auth/callback` GET | Low | OAuth callback |
| `/api/technician/*` | Medium | Assignment/profile abuse |
| `/api/chat/conversations` (non-messages) | Medium | Conversation enumeration |
| Supabase Auth (login/signup) | **High** | No `/api/auth/login` route exists; auth is client-side — use Supabase Dashboard rate limits |

---

## 2. Security Verification

### 2.1 Upload Endpoint Auth

`POST /api/upload` uses `requireAuth` before generating presigned URLs.

```8:11:src/app/api/upload/route.ts
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const auth = await requireAuth(supabase);
  if ('response' in auth) return auth.response;
```

**Live test:** 20 rapid unauthenticated POSTs → **20× 401** ✅

### 2.2 x-user-id Spoofing

| Finding | Detail |
|---------|--------|
| Next.js middleware sets `x-user-id`? | ✅ Yes — from `getUser()` after stripping client value |
| Worker reads `x-user-id`? | ✅ Yes — first priority in `getUserId()` |
| Spoofable at edge? | ⚠️ **Yes** — worker runs before Next.js; client header reaches worker unless Cloudflare strips it |
| Spoofable at origin? | ✅ **No** — `src/lib/supabase/middleware.ts` deletes inbound header and sets trusted ID |
| Impact | Edge: attacker can consume another user's rate-limit bucket; Origin: mitigated |

**Recommendation:** Add Cloudflare Transform Rule to strip `x-user-id` on ingress; worker should derive user from verified JWT or only trust header set by origin after worker→origin roundtrip is not feasible. For now, IP limits remain the primary protection.

Harness note: in-process test simulates raw client headers (edge behavior).

### 2.3 Middleware / Proxy Identity

`src/proxy.ts` delegates to `updateSession()` which:

- Validates session via `supabase.auth.getUser()` (cookie-based, not spoofable headers)
- Protects `/customer`, `/technician`, `/admin` page routes with role checks
- Does **not** propagate user ID to API request headers

**Verdict:** Page-route identity is secure; API rate-limit identity is not wired.

### 2.4 Admin Routes Protected

All 15 routes under `src/app/api/admin/` call both `requireAuth` and `requireAdmin`.

**Live test:** `GET /api/admin/dashboard` without session → **401** ✅

---

## 3. Load Test Results

### 3.1 Methodology

- **App layer:** 20 rapid `curl` requests per endpoint against `http://localhost:3000` (worker not in path)
- **Worker layer:** In-process harness with mock KV (`npx tsx workers/rate-limiter/validate.ts`)

### 3.2 App-Layer Results (No Worker in Dev)

| Scenario | Requests | Status Distribution | Rate Limited? |
|----------|----------|---------------------|---------------|
| Upload spam | 20 | 20× 401 | ❌ (auth blocks, no 429) |
| Booking spam | 20 | 20× 401 | ❌ |
| Review spam | 20 | 20× 401 | ❌ |
| Chat spam | 20 | 20× 401 | ❌ |
| Service search spam | 20 | 20× 500* | ❌ |
| Login spam | N/A | Client → Supabase Auth directly | ❌ Not via worker |

\* Services returned 500 due to unrelated RLS issue: `infinite recursion detected in policy for relation "profiles"`. Rate-limit testing unaffected; fix RLS separately.

### 3.3 Worker Harness Results

| Scenario | Limit | Blocked At | Headers |
|----------|-------|------------|---------|
| Review POST (IP) | 20/hr | Request 21 | `Retry-After` ✅, `X-RateLimit-Remaining: 0` ✅ |
| x-user-id spoof | — | Bucket shared across IPs | Confirmed vulnerability |

### 3.4 Production curl Examples (Post-Deploy)

After Cloudflare route wiring:

```bash
# Expect 429 after 10 requests (auth IP limit)
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "%{http_code} %{header_retry-after}\n" \
    -X POST https://your-domain.com/api/auth/login \
    -H "Content-Type: application/json" -d '{}'
done

# Expect 429 after 60 requests (services IP limit)
for i in $(seq 1 65); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    https://your-domain.com/api/services
done
```

---

## 4. New Rules Added (This Review)

| Route | Methods | IP Limit | User Limit | Window |
|-------|---------|----------|------------|--------|
| `/api/bookings/*` | PATCH | 30 | 15 | 1 hour |
| `/api/services` | GET | 60 | 40 | 1 min |
| `/api/admin/technicians` | GET | 40 | 30 | 1 min |

Implemented in `workers/rate-limiter/utils.ts` (9 rules total).

---

## 5. Discovered Weaknesses

| # | Severity | Issue | Mitigation |
|---|----------|-------|------------|
| 1 | High | Worker not deployed; KV ID placeholder | Deploy + configure Cloudflare route |
| 2 | High | `x-user-id` spoofable at edge worker | Cloudflare Transform Rule to strip; origin mitigated via middleware |
| 3 | High | Auth bypasses worker (Supabase client auth) | Supabase Auth rate limits in dashboard |
| 4 | Medium | `RATE_LIMIT_SECRET` defined but unused | Implement origin verification or remove |
| 5 | Medium | Many GET routes unprotected | Add read limits for reviews, bookings list |
| 6 | Medium | User limit uses `Authorization` first 32 chars | Weak user key; use JWT sub claim server-side |
| 7 | Low | No general IP fallback for unmatched routes | Consider default 120/min IP cap |
| 8 | Low | Services API 500 (RLS recursion) | ✅ Fixed in 00014 `is_admin()` |

---

## 6. Recommended Limits (Production)

| Category | IP | User | Window | Rationale |
|----------|----|------|--------|-----------|
| Auth (if proxied) | 10 | 5 | 15 min | Credential stuffing |
| Upload | 30 | 20 | 1 hr | Storage cost control |
| Booking create | 20 | 10 | 1 hr | Spam bookings |
| Booking status PATCH | 30 | 15 | 1 hr | Status flip abuse |
| Chat messages | 60 | 30 | 1 min | Real-time UX vs spam |
| Reviews POST | 20 | 10 | 1 hr | Review bombing |
| Service search GET | 60 | 40 | 1 min | Catalog scraping |
| Admin technician search | 40 | 30 | 1 min | Admin UI typeahead |
| Admin catch-all | 100 | 80 | 1 min | Back-office ops |

Also configure **Supabase Auth** limits: 30 sign-in attempts / 5 min per IP (dashboard default).

---

## 7. Production Readiness

| Gate | Status |
|------|--------|
| Worker code complete | ✅ |
| Utils extracted + harness | ✅ |
| Build passing | ✅ |
| Lint 0 errors | ✅ |
| KV namespace created | ❌ |
| Worker deployed | ❌ |
| Cloudflare route `*/api/*` → worker | ❌ |
| Trusted user identity at origin | ✅ Middleware strips + sets from session |
| Trusted user identity at edge | ❌ Strip rule needed in Cloudflare |
| Supabase Auth rate limits | ❌ (manual) |
| End-to-end 429 verified on staging | ❌ |

**Production readiness: NOT READY** — deploy checklist above must be completed before launch.

---

## 8. Validation Commands

```bash
# Worker unit/harness tests
npx tsx workers/rate-limiter/validate.ts

# App auth spot checks
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/upload \
  -H "Content-Type: application/json" -d '{"fileType":"image/jpeg"}'

# Build + lint
npm run build
npm run lint
```

---

## 9. Files Reviewed / Modified

| File | Role |
|------|------|
| `workers/rate-limiter/index.ts` | Worker entry |
| `workers/rate-limiter/utils.ts` | Rules + limit logic (new) |
| `workers/rate-limiter/validate.ts` | Local test harness (new) |
| `workers/rate-limiter/wrangler.toml` | KV binding (ID pending) |
| `docs/RATE-LIMITING.md` | Updated route table |
| `src/proxy.ts` | Session/role middleware |
| `src/lib/supabase/middleware.ts` | Auth + RBAC for pages |
| `src/lib/api/auth.ts` | `requireAuth`, `requireAdmin` |
| `src/app/api/upload/route.ts` | Upload auth |
| `src/app/api/admin/**` | Admin protection |
