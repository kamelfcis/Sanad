# Remaining Implementation Audit — Sanad

**Generated:** 2026-06-26  
**Scope:** `src/`, `e2e/`, `scripts/`, `workers/` (excludes `node_modules`, `.next`, lock files)  
**Patterns searched:** `TODO`, `FIXME`, `HACK`, `XXX`, `Not implemented`, `throw new Error`, `return null`, `return undefined`, `console.log(`, `console.error(`

---

## Executive Summary

| Category | Findings | Critical | High | Medium | Low |
|----------|----------|:--------:|:----:|:------:|:---:|
| Explicit markers (`TODO` / `FIXME` / `HACK` / `Not implemented`) | 0 | 0 | 0 | 0 | 0 |
| Incomplete / stub features | 5 | 0 | 2 | 2 | 1 |
| `throw new Error` (application code) | 58 | 0 | 0 | 2 | 40 |
| Meaningful `return null` / `return undefined` | 12 | 0 | 1 | 6 | 3 |
| `console.log` / `console.error` / `console.warn` | 24 | 0 | 0 | 8 | 16 |
| **Curated actionable items** | **~22** | **0** | **3** | **10** | **9** |

**Headline:** No `TODO`/`FIXME` comments remain in application code. Gaps are **operational** (monitoring, rate limiter, email) and **silent failure paths** (upload, geocode, notification DB errors) rather than unfinished feature stubs.

---

## 1. Explicit Markers — None Found

| File | Line | Severity | Impact | Recommendation |
|------|------|----------|--------|----------------|
| — | — | — | No `TODO`, `FIXME`, `HACK`, or `Not implemented` strings in `src/`. | Maintain discipline; add ticket IDs if deferred work is needed. |

**False positive (excluded):** `technician-setup-wizard.tsx:250` — placeholder text `+966 5X XXX XXXX` (not a marker).

---

## 2. Incomplete / Stub Features

| File | Line | Severity | Impact | Recommendation |
|------|------|----------|--------|----------------|
| `src/lib/email/index.ts` | 25–59 | **High** | Email notifications are stubbed; `ENABLE_EMAIL_NOTIFICATIONS` defaults off. Users only get in-app notifications. | Set `ENABLE_EMAIL_NOTIFICATIONS=true`, configure `RESEND_API_KEY` or `SENDGRID_API_KEY`, verify deliverability in staging. |
| `src/lib/email/index.ts` | 128–131 | **High** | When email enabled but no provider key, `console.warn` only — no user/admin signal. | Return structured failure to caller or surface admin dashboard warning when provider missing. |
| `src/lib/logger.ts` | 62, 68 | **Medium** | `// Future: Sentry.captureException` — errors stay in server logs only. | Wire Sentry (or Datadog) before public launch; replace ad-hoc `console.error` in API routes. |
| `workers/rate-limiter/` | — | **High** | Cloudflare rate-limiter worker exists but is **not deployed** to production edge. App relies on app-level limits only. | Deploy worker per `workers/rate-limiter/wrangler.toml`; wire `x-user-id` from auth proxy. |
| `docs/PRODUCTION-READINESS.md` | 44–50 | **Medium** | Documented partial features: Google OAuth per-env, `max_distance_km` not enforced, mock distance fallback in browse. | Track as product backlog; enforce distance filter in `lib/technicians/browse.ts` if required for launch. |
| `src/lib/auth/logout.ts` | 71–92 | **Low** | Logout retries with `console.warn` on server signOut failure; client still clears session. | Acceptable; optionally route through `logger.warn` for consistency. |

---

## 3. `throw new Error` — React Query / Fetch Pattern (53 in hooks)

Standard pattern: hooks throw on non-OK API responses so React Query surfaces errors to UI.

| File | Lines (representative) | Severity | Impact | Recommendation |
|------|------------------------|----------|--------|----------------|
| `src/hooks/use-admin.ts` | 56, 111, 117, … (20 total) | **Low** | Admin pages show error state if API fails. | **Acceptable** — ensure each page has error UI (most already use query `isError`). |
| `src/hooks/use-technician.ts` | 78, 100, 110, … (9 total) | **Low** | Technician dashboard/jobs errors bubble to UI. | Same as above. |
| `src/hooks/use-payments.ts` | 28, 44, 54, … (7 total) | **Low** | Payment flow errors visible in forms. | Same. |
| `src/hooks/use-notifications.ts` | 32–65 (6 total) | **Low** | Notification bell/page errors. | Same. |
| `src/hooks/use-chat.ts` | 50, 60, 73, 83 | **Low** | Chat load/send failures. | Same. |
| `src/hooks/use-reviews.ts` | 27, 34, 47 | **Low** | Review form errors. | Same. |
| `src/hooks/use-bookings.ts` | 39, 51, 64 | **Low** | Booking list/create errors. | Same. |
| `src/hooks/use-browse-technicians.ts` | 44, 63 | **Low** | Arabic error messages to customer browse. | Same. |
| `src/hooks/use-services.ts` | 37 | **Low** | Service catalog load failure. | Same. |
| `src/hooks/use-categories.ts` | 25 | **Low** | Category load failure. | Same. |

### Configuration / env throws (actionable)

| File | Line | Severity | Impact | Recommendation |
|------|------|----------|--------|----------------|
| `src/lib/supabase/admin.ts` | 9 | **Medium** | Missing `SUPABASE_SERVICE_ROLE_KEY` crashes service-role paths at runtime. | Validate env at boot in `instrumentation.ts` or document as required in deploy checklist. |
| `src/lib/storage/upload.ts` | 29 | **Medium** | Missing `NEXT_PUBLIC_SUPABASE_URL` throws during upload URL generation. | Same — fail fast at startup with clear deploy error. |
| `src/lib/storage/client-upload.ts` | 15, 26 | **Low** | Client upload surfaces errors to `useUpload` hook. | Acceptable. |
| `e2e/helpers.ts` | 164 | **Low** | E2E test fails loudly on booking POST error. | Acceptable for tests. |
| `scripts/seed-e2e-users.ts` | 37, 64 | **Low** | Dev seed script env validation. | Acceptable for scripts. |
| `scripts/verify-e2e-db.ts` | 11 | **Low** | Dev verify script env validation. | Acceptable for scripts. |
| `workers/rate-limiter/validate.ts` | 29 | **Low** | Test harness assertion helper. | Acceptable for worker dev tooling. |

---

## 4. Meaningful `return null` / `return undefined`

Excluded: React components returning `null` (no UI), validation helpers returning `null` = valid, map components with `useEffect` SSR guards.

| File | Line | Severity | Impact | Recommendation |
|------|------|----------|--------|----------------|
| `src/lib/storage/upload.ts` | 40, 50 | **High** | `uploadFileForUser` returns `null` when service role missing or Supabase storage fails — **no error message** to caller. | Return `Result` type or throw; technician registration / payment proof may fail silently. |
| `src/lib/storage/upload.ts` | 59, 68 | **Medium** | `deleteUploadedFile` / `getSignedUrl` return null on failure. | Log via `logger.error`; return discriminated union for admin tooling. |
| `src/lib/services/notification-service.ts` | 56, 104 | **Medium** | `createNotification` / `markAsRead` return `null` on DB error after `console.error`. | Caller may assume success; consider throwing or returning `{ ok: false, error }`. |
| `src/lib/email/index.ts` | 28, 64, 120 | **Medium** | Provider/email resolution returns null when unconfigured or profile has no email. | Expected for stub; document in env guide. |
| `src/lib/geo/geocode.ts` | 21, 25 | **Low** | Reverse geocode fails gracefully (Nominatim down / rate limit). | Acceptable; UI should show fallback address field (already present on booking form). |
| `src/lib/geo/centroids.ts` | 27 | **Low** | Unknown governorate → null centroid for distance sort. | Add missing governorates or default to Cairo centroid. |
| `src/lib/technicians/browse.ts` | 132 | **Medium** | Row skipped when `profile` join missing — technician hidden from browse without audit log. | Log skip reason; fix data integrity via admin alerts. |
| `src/lib/technicians/browse.ts` | 170 | **Low** | `return undefined` when specialty slug unknown. | Acceptable fallback to default label. |
| `src/lib/technician/register-profile.ts` | 31 | **Low** | Unknown category slug → null service mapping. | Validation should reject before this path in register flow. |
| `src/hooks/use-upload.ts` | 35 | **Low** | Upload hook returns null on catch; sets `error` state. | Acceptable — UI reads `error`. |
| `src/hooks/use-technician.ts` | 59 | **Low** | Returns null when no auth user in query fn. | Acceptable React Query pattern. |
| `src/lib/auth/safe-redirect.ts` | 3–6 | **Low** | Rejects open redirects / invalid paths. | Security feature — keep as-is. |
| `workers/rate-limiter/utils.ts` | 92 | **Low** | `findRule` returns null when no rate rule matches path. | Expected; ensure default global rule exists in `RULES`. |

---

## 5. Logging (`console.log` / `console.error` / `console.warn`)

No `console.log` in `src/` production code.

### API routes — should use structured `logger`

| File | Line | Severity | Impact | Recommendation |
|------|------|----------|--------|----------------|
| `src/app/api/bookings/route.ts` | 124 | **Medium** | Booking images save failure logged only; booking may succeed without images. | Use `logger.error`; optionally notify customer that images failed. |
| `src/app/api/bookings/route.ts` | 137 | **Medium** | Direct technician assignment failure after booking created. | Critical path — alert/monitor; may leave booking in inconsistent state. |
| `src/app/api/bookings/route.ts` | 162 | **Medium** | Auto-match RPC failure after booking created. | Same — booking stuck without assignment. |
| `src/app/api/bookings/route.ts` | 191 | **Medium** | Generic assignment catch block. | Consolidate error handling; return partial success metadata to client. |
| `src/app/api/technician/assignments/[id]/respond/route.ts` | 118 | **Medium** | Next-tech assignment after reject fails silently; booking may stay pending. | Use `logger.error` + retry queue or admin notification. |

### Services — acceptable with monitoring gap

| File | Line | Severity | Impact | Recommendation |
|------|------|----------|--------|----------------|
| `src/lib/services/notification-service.ts` | 55, 82, 103, 119, 138, 160, 196, 219 | **Medium** | DB errors on notification CRUD only logged. | Wire Sentry; consider dead-letter table for failed notifications. |
| `src/lib/email/index.ts` | 160 | **Medium** | Email send failure logged after provider call. | Acceptable until Sentry wired. |
| `src/lib/logger.ts` | 67 | **Low** | Central `logger.error` implementation uses `console.error`. | Replace sink with Sentry transport in production. |
| `src/components/auth/logout-modal.tsx` | 31 | **Low** | Logout modal failure logged. | Acceptable. |

### Dev / worker tooling (excluded from launch blockers)

| File | Line | Severity | Impact | Recommendation |
|------|------|----------|--------|----------------|
| `workers/rate-limiter/validate.ts` | 129–146 | **Low** | CLI validation harness output. | Dev-only; no action for production. |
| `scripts/seed-e2e-users.ts` | 189, 193 | **Low** | Seed script stdout/stderr. | Dev-only. |
| `scripts/verify-e2e-db.ts` | 98, 102 | **Low** | E2E DB verify script output. | Dev-only. |

---

## 6. Priority Action List

| Priority | Action | Owner hint |
|----------|--------|------------|
| P0 | Deploy `workers/rate-limiter` and route traffic through it | DevOps |
| P0 | Wire Sentry (or equivalent) via `src/lib/logger.ts` | Backend |
| P1 | Enable email notifications with Resend/SendGrid in staging | Backend |
| P1 | Fix silent `uploadFileForUser` null returns — surface errors to UI | Full-stack |
| P1 | Replace API route `console.error` with `logger.error` + alerts on booking assignment failures | Backend |
| P2 | Enforce `max_distance_km` in browse/match if product requires | Product + Backend |
| P2 | Notification service: throw or return explicit error results | Backend |
| P3 | Startup env validation for required secrets | Backend |

---

## 7. Re-run Audit

```bash
# From repo root (PowerShell)
rg -n "TODO|FIXME|HACK|Not implemented" src e2e scripts workers --glob "*.{ts,tsx}"
rg -n "throw new Error" src --glob "*.{ts,tsx}"
rg -n "console\.(log|error|warn)\(" src --glob "*.{ts,tsx}"
```

Update this document after major features land or before each release candidate.
