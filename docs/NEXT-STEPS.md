# Sanad — Next Steps

> Generated from full project analysis (June 2025). Prioritized action plan before Phase 8+ feature expansion.

---

## Priority 1 — Critical

### 1.1 Production Hardening (Phase 9 — Security & RLS)

| | |
|---|---|
| **Why it matters** | Marketplace handles PII, bookings, and chat. Unvalidated APIs and weak RLS expose data leakage and abuse risk before any public launch. |
| **Complexity** | High |
| **Estimated effort** | 3–5 days |
| **Business impact** | Blocks safe production launch; required for investor/regulatory trust |

**Scope:**
- Formal RLS audit on all 11 migration tables (`supabase db advisors --linked`)
- Zod validation on all 31 API route handlers (only `bookings` POST uses schemas today)
- Auth on `/api/upload` (currently unauthenticated presigned URL generation)
- Security headers in `next.config.ts` (X-Frame-Options, CSP baseline, etc.)
- Cloudflare Worker rate limiter (`workers/` folder does not exist yet)

---

### 1.2 Seed Data & Environment Parity

| | |
|---|---|
| **Why it matters** | Remote Supabase has schema but no `seed.sql`. Empty categories/services block booking flows and demo readiness. |
| **Complexity** | Low |
| **Estimated effort** | 0.5–1 day |
| **Business impact** | Enables QA, demos, and first real user onboarding |

**Scope:**
- Create `supabase/seed.sql` with service categories, services, and optional test accounts
- Document required env vars (R2, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`)
- Verify R2 credentials or graceful degradation for image uploads

---

### 1.3 API Input Validation Layer

| | |
|---|---|
| **Why it matters** | 29 of 31 API routes lack Zod validation. Malformed input can cause 500s, logic bugs, or injection-adjacent issues. |
| **Complexity** | Medium |
| **Estimated effort** | 2–3 days |
| **Business impact** | Stability, security, predictable error responses for clients |

**Scope:**
- Extend `src/lib/validations/` for chat, reviews, admin, technician, assignments
- Consistent error format: `{ error: string }` or `{ error: fieldErrors }`
- Validate query params (pagination, status filters, IDs)

---

## Priority 2 — Important

### 2.1 Mobile UX Completion (Phase 10)

| | |
|---|---|
| **Why it matters** | Saudi home-services users are predominantly mobile. No bottom navigation; header-only nav on customer/technician layouts. |
| **Complexity** | Medium |
| **Estimated effort** | 2–3 days |
| **Business impact** | Conversion and retention on mobile; matches funded-startup polish goal |

**Scope:**
- `BottomNav` for customer and technician layouts (&lt; 768px)
- Touch targets audit (min 44px)
- Bottom sheet patterns for modals on mobile
- Network offline indicator

---

### 2.2 SEO & Discoverability Expansion

| | |
|---|---|
| **Why it matters** | Foundation exists (`lib/seo.ts`, robots, sitemap, JSON-LD) but sitemap only lists 3 URLs. Service pages are not indexed. |
| **Complexity** | Low–Medium |
| **Estimated effort** | 1–2 days |
| **Business impact** | Organic acquisition for Arabic home-services keywords |

**Scope:**
- Dynamic sitemap entries for `/customer/services` and service slugs
- Per-route `pageMetadata()` on auth and dashboard pages
- Verify `NEXT_PUBLIC_SITE_URL` in production
- Arabic hreflang and structured data for `LocalBusiness` / `Service`

---

### 2.3 Notifications & Real-time Engagement

| | |
|---|---|
| **Why it matters** | Header shows notification icon but no backend. Users miss assignment updates, chat messages, and booking status changes. |
| **Complexity** | Medium–High |
| **Estimated effort** | 4–6 days |
| **Business impact** | Core marketplace loop completion; reduces support burden |

**Scope:**
- In-app notification table + Realtime subscription
- Email triggers via Supabase Auth hooks or Edge Functions (booking accepted, message received)
- Optional: push notifications (PWA foundation already in `manifest.ts`)

---

### 2.4 Payments & Escrow (Not in current roadmap)

| | |
|---|---|
| **Why it matters** | Two-sided marketplace without payments cannot monetize or guarantee satisfaction refunds. |
| **Complexity** | High |
| **Estimated effort** | 1–2 weeks |
| **Business impact** | Revenue model; trust (pay after service, dispute resolution) |

**Scope:**
- Stripe / Tap Payments integration for Saudi market
- Booking payment status column + migration
- Admin reconciliation in existing dashboard

---

### 2.5 Error Monitoring (Sentry)

| | |
|---|---|
| **Why it matters** | `ErrorBoundary`, `logger.ts`, and `GlobalErrorHandler` exist but errors only go to console. Production blind spots. |
| **Complexity** | Low |
| **Estimated effort** | 0.5–1 day |
| **Business impact** | Faster incident response; data for prioritization |

**Scope:**
- `@sentry/nextjs` with DSN env var
- Wire `reportError` and API route catch blocks
- Source maps in CI

---

### 2.6 Lighthouse & Performance Pass

| | |
|---|---|
| **Why it matters** | Production sprint targeted &gt;95 scores. Hero images, font loading, and client-heavy landing need verification. |
| **Complexity** | Medium |
| **Estimated effort** | 2–3 days |
| **Business impact** | SEO ranking, perceived quality, mobile conversion |

**Scope:**
- Run Lighthouse CI against production build
- Reduce client components on landing where possible
- Font subsetting for Cairo/Inter
- Service worker for PWA caching (optional)

---

## Priority 3 — Future

### 3.1 Map & Location Picker (Phase 10 optional)

| | |
|---|---|
| **Why it matters** | Bookings store lat/lng but UX may rely on text address only. Maps improve technician matching accuracy. |
| **Complexity** | Medium |
| **Estimated effort** | 3–4 days |
| **Business impact** | Better matching, fewer failed visits |

---

### 3.2 Auto-Matching Engine Enhancement

| | |
|---|---|
| **Why it matters** | Phase 5 delivered manual admin assignment + basic matching. Scale requires automated skill/location scoring. |
| **Complexity** | High |
| **Estimated effort** | 1 week |
| **Business impact** | Ops efficiency; faster customer response times |

---

### 3.3 Admin Settings Persistence

| | |
|---|---|
| **Why it matters** | `/admin/settings` is a placeholder with local state only. |
| **Complexity** | Low |
| **Estimated effort** | 1 day |
| **Business impact** | Platform configuration without code deploys |

---

### 3.4 Internationalization (i18n)

| | |
|---|---|
| **Why it matters** | RTL Arabic is default; English strings remain in customer nav labels and some auth toasts. |
| **Complexity** | Medium |
| **Estimated effort** | 3–5 days |
| **Business impact** | Expat market; professional polish |

---

### 3.5 E2E Test Suite

| | |
|---|---|
| **Why it matters** | No Playwright/Cypress tests. Regression risk grows with each phase. |
| **Complexity** | Medium |
| **Estimated effort** | 3–5 days |
| **Business impact** | CI confidence; safer releases |

---

## Recommended Next Phase

**Execute Priority 1.1 — Phase 9 Production Hardening** as a single focused sprint.

Rationale:
- Phases 0–8 feature work is complete; database migrated to remote Supabase (11 migrations applied)
- Partial production polish (animations, SEO base, PWA manifest, error boundary) does not replace security
- Unauthenticated upload endpoint and missing API validation are concrete, fixable risks
- Mobile UX and payments depend on a secure, stable core

**Do not start Admin Dashboard extensions** — Phase 8 admin is complete. Next work is hardening, not more admin CRUD.

---

## Technician signup flow (صنايعي)

| Route | Purpose |
|---|---|
| `/auth/register-technician` | Full sanaei-style form (manual phone/password + Google OAuth entry) |
| `/auth/register-technician?complete=1` | OAuth technicians finish national ID, photos, specialty, etc. |
| `/technician/setup` | Redirect alias → `?complete=1` |
| `/technician/jobs` | Post-signup dashboard (own bookings/assignments only) |

**Manual:** form → `POST /api/auth/register-technician` → auto sign-in → `/technician/jobs` (pending verification).

**Google:** register page Google or register-technician Google → `/api/auth/callback?role=technician` → `?complete=1` → `POST /api/auth/complete-technician-registration` → `/technician/jobs`.

Middleware sends incomplete technician profiles to `?complete=1`; complete profiles never land on customer routes after login.

---

## Execution Rules (carry forward)

- Do not rewrite working code
- Do not introduce breaking changes
- Do not change database schema without migration
- Keep TypeScript strict
- Keep ESLint clean
- Follow `lib/design-system.ts` and existing ShadCN patterns
