# Sanad — Code Quality Audit (Phase 2)

**Audit date:** 2025-06-26  
**Method:** Grep for imports/exports, duplicate patterns, unused components, API overlap  
**Rule:** Recommendations prioritized — not all implemented (minimal refactor applied)

---

## Summary

| Metric | Finding |
|--------|---------|
| TypeScript | Strict mode; build passes |
| ESLint | 0 errors, 8 warnings (pre-existing) |
| Test files | **0** |
| API route files | 49 |
| Page routes | 42 |
| Validation coverage | ~100% Zod on API handlers (see [API-VALIDATION.md](./API-VALIDATION.md)) |
| Dead code | ~4 unused landing/shared components |
| Duplicates | FK select strings (partially fixed), inline auth checks, fetch patterns in hooks |

---

## Dead / Unused Code

### Unused components (no imports outside defining file)

| File | Notes | Priority |
|------|-------|----------|
| `src/components/landing/stats.tsx` | `StatsSection` never imported in `page.tsx` | Low — remove or wire to landing |
| `src/components/landing/app-preview.tsx` | `AppPreviewSection` unused | Low |
| `src/components/landing/technicians.tsx` | `TechniciansSection` unused (browse moved to `/services`) | Low |
| `src/components/shared/category-filter.tsx` | `CategoryFilter` unused; filters live in `services-browse-filters.tsx` | Low |

### Legacy / redirect-only routes

| Route | Status |
|-------|--------|
| `/customer/services` | Redirects to `/services` in middleware — page still exists |
| `/customer/services/[slug]` | May overlap with public `/services` browse — verify usage |
| `/technician` | Root page exists; middleware sends techs to `/technician/jobs` |
| `/technician/setup` | Referenced in profile page; wizard may duplicate register-technician flow |

### Stale type references

| File | Issue |
|------|-------|
| `src/types/env.d.ts` | Lists Cloudflare R2 vars — uploads migrated to Supabase Storage |

---

## Duplicate Patterns

### 1. PostgREST profile FK hints (FIXED in Phase 3)

**Problem:** 10 API routes used ambiguous `profiles!customer_id` instead of explicit FK names (`bookings_customer_id_fkey`, `reviews_customer_id_fkey`, etc.). Technician routes were already fixed; admin/reviews/chat/payments were not.

**Fix applied:** All `profiles!customer_id` replaced with table-specific FK hints. Shared select extracted to `src/lib/booking/select-fragments.ts`.

### 2. Booking nested select strings

**Before:** Duplicated in `technician/assignments/route.ts` and `assignments/[id]/route.ts`.

**After:** `BOOKING_WITH_CUSTOMER_PROFILE_SELECT` and `BOOKING_ASSIGNMENT_DETAIL_SELECT` in `src/lib/booking/select-fragments.ts`.

**Remaining duplication (not consolidated — lower risk):**

| Location | Pattern |
|----------|---------|
| `admin/bookings/route.ts` vs `[id]/route.ts` | Similar booking + customer/technician joins |
| `technician/bookings/route.ts` | Inline select (could import shared fragment) |
| Customer `use-bookings.ts` vs technician hooks | Parallel fetch + error handling |

### 3. Auth checks

| Pattern | Count | Recommendation |
|---------|-------|----------------|
| `requireAuth` + `requireAdmin` | Admin routes (~25 handlers) | ✅ Correct — keep |
| Inline `getUser()` + 401 | `chat/conversations`, `technicians/browse`, `technicians/[id]` | **Medium** — migrate to `requireAuth` for consistency |
| No auth on public reads | `categories`, `services`, `reviews/booking/[id]` | Intentional — document in API-AUDIT |

### 4. Zod schemas

Generally well-organized under `src/lib/validations/`. Minor overlap:

| Overlap | Files |
|---------|-------|
| Entity ID params | `adminEntityIdSchema` reused across admin + bookings — ✅ good |
| Pagination | `emptyQuerySchema`, inline `page/limit` in admin payments/reviews — could unify |
| Booking status | `bookingStatusSchema` in common.ts — reused |

No critical duplicate schema definitions found.

### 5. Client fetch hooks

All 15 hooks follow similar React Query pattern (`use-bookings`, `use-chat`, `use-admin`, etc.). Consolidation into a generic `useApiQuery` would reduce boilerplate but is **not recommended pre-launch** — high touch, low bug-fix value.

---

## API Overlap / Orphan Endpoints

| Endpoint | Usage | Notes |
|----------|-------|-------|
| `GET /api/technician/bookings` | Technician accepted jobs | Overlaps with assignments post-accept — both used |
| `GET /api/reviews` (no auth) | Public review list | GET is unauthenticated — RLS filters hidden |
| `GET /api/reviews/booking/[id]` | Public single review | No auth — relies on RLS + `is_hidden=false` |
| `POST /api/auth/register-technician` | Public signup | Uses service role internally — correct |

No fully orphaned API routes found; all have page or hook consumers.

---

## Hook Inventory

| Hook | Used by | Status |
|------|---------|--------|
| `use-auth` | Auth flows, layouts | Active |
| `use-bookings` | Customer booking pages | Active |
| `use-browse-technicians` | `/services`, booking new | Active |
| `use-admin` | Admin pages | Active |
| `use-technician` | Technician profile/jobs | Active |
| `use-chat` | Chat pages | Active |
| `use-notifications` | Bell, notifications page | Active |
| `use-payments` | Payment page | Active |
| `use-reviews` | Review page | Active |
| `use-upload` | Forms with images | Active |
| `use-services` / `use-categories` | Browse, admin | Active |
| `use-user-location` | Map browse | Active |
| `useIdleLogout` | Dashboard session manager | Active |
| `use-toast` | Global | Active |

All hooks appear referenced.

---

## Consolidation Recommendations (Prioritized)

### P1 — Do before launch (low effort, high clarity)

1. ✅ **Fix FK hints** — Done (Phase 3)
2. ✅ **Shared booking select fragment** — Done
3. **Add OSM domains to CSP** — `next.config.ts` (ops, not code quality)
4. **Remove or wire dead landing components** — 4 files (~200 LOC)

### P2 — Post-beta

5. Standardize `chat/conversations` GET on `requireAuth` helper
6. Extract admin booking list select to shared fragment
7. Remove R2 references from `env.d.ts`
8. Deprecate `/customer/services/*` pages if unused

### P3 — Nice to have

9. Generic API hook factory
10. Shared pagination Zod schema for all admin list routes
11. ESLint warning cleanup (unused vars, img elements)

---

## ESLint Warnings (non-blocking)

| File | Warning |
|------|---------|
| `booking-form.tsx` | react-hook-form incompatible-library |
| `header.tsx` | unused `profile` |
| `image-uploader.tsx` | `<img>` vs `next/image` |
| `validate.ts` | unused `ZodSchema` import |

---

## Test Debt

- **No unit, integration, or E2E tests**
- **No `test` script in `package.json`**
- Manual matrix only: [AUTHORIZATION-TESTS.md](./AUTHORIZATION-TESTS.md), [TEST-WORKFLOW.md](./TEST-WORKFLOW.md)

Deferred intentionally for launch hardening sprint — see [PRODUCTION-READINESS.md](./PRODUCTION-READINESS.md).

---

## Related

- [ARCHITECTURE-AUDIT.md](./ARCHITECTURE-AUDIT.md)
- [API-AUDIT.md](./API-AUDIT.md)
- [PRODUCTION-READINESS.md](./PRODUCTION-READINESS.md)
