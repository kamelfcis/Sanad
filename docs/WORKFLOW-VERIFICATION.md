# Sanad — Workflow Verification (Phases 6–9, 14)

**Audit date:** 2025-06-26  
**Method:** Code-path inspection + limited curl smoke tests  
**Rule:** PASS only with code evidence; browser-only steps marked **MANUAL**

**References:** [TEST-WORKFLOW.md](./TEST-WORKFLOW.md) · [DIRECT-BOOKING.md](./DIRECT-BOOKING.md) · [LAUNCH-AUDIT.md](./LAUNCH-AUDIT.md)

---

## Verification Key

| Result | Meaning |
|--------|---------|
| **PASS** | Code path complete; curl/terminal evidence where noted |
| **PASS\*** | Code complete; requires authenticated session to fully verify |
| **FAIL** | Missing implementation or known broken path |
| **MANUAL** | Must verify in browser with test accounts |

---

## Environment Preconditions

| Check | Result | Evidence |
|-------|--------|----------|
| Dev server runs | PASS | Terminal: `npm run dev` active |
| `npm run build` | PASS | Build exit 0 (2025-06-26) |
| Migrations 00001–00021 | PASS\* | 21 files in `supabase/migrations/`; remote push not verified here |
| Service role for browse | PASS\* | Browse returns 200 locally — implies key configured |
| Admin seed (00021) | MANUAL | Credentials in [ADMIN-SETUP.md](./ADMIN-SETUP.md) |

---

## Flow A — Customer: Signup → Browse → Book → Accept → Chat → Pay → Review

| Step | Result | Evidence |
|------|--------|----------|
| A1 Customer signup UI | PASS | `src/app/auth/register/page.tsx` — Supabase signup + profile |
| A2 Browse services `/services` | PASS | curl `GET /api/technicians/browse` → 200; `services-browse-view.tsx` |
| A3 Create booking (auto-match) | PASS\* | `POST /api/bookings` — RPC `match_technicians_for_booking` in route.ts |
| A3b Direct booking | PASS\* | `technician_id` branch in `bookings/route.ts`; [DIRECT-BOOKING.md](./DIRECT-BOOKING.md) |
| A4 Technician accept | PASS\* | `POST /api/technician/assignments/[id]/respond` — accept action |
| A5 Chat realtime | PASS\* | `00008_chat.sql` trigger on accept; `chat-room.tsx` + messages API |
| A6 Status in_progress/completed | PASS\* | `PATCH /api/admin/bookings/[id]/status` or customer PATCH |
| A7 Payment submit | PASS\* | `POST /api/bookings/[id]/payment`; needs `price_quote > 0` |
| A8 Review | PASS\* | `POST /api/reviews` — guards: completed, customer owner, one per booking |

**Manual browser verification required:** Full A1→A8 with real accounts, chat latency, payment screenshot upload.

---

## Flow B — Direct Booking from Technician Card

| Step | Result | Evidence |
|------|--------|----------|
| B1 Entry URL with query params | PASS | `booking-links.ts` → `?service_id=&technician_id=` |
| B2 Banner + locked service | PASS | `selected-technician-banner.tsx`, `booking-form.tsx` hidden field |
| B3 Single assignment | PASS\* | `bookings/route.ts` lines 128–154 — one insert, skip RPC |
| B4 Status `matched` on create | PASS | `status: technician_id ? 'matched' : 'pending'` |
| B5 Other techs excluded | PASS\* | No RPC call when `technician_id` set |
| B6 Map entry **احجز الآن** | PASS | `technicians-map-inner.tsx`, `map-markers.ts` |

**Terminal evidence:** Dev server logs show `GET /customer/bookings/new?service_id=...&technician_id=...` → 200.

**Manual:** Submit form, confirm DB single assignment row (SQL in DIRECT-BOOKING.md).

---

## Flow C — Technician Signup → Admin Approve → Receives Job

| Step | Result | Evidence |
|------|--------|----------|
| C1 Technician registration | PASS | `/auth/register-technician`, `POST /api/auth/register-technician` |
| C2 Pending verification | PASS | `verification_status = 'pending'` default in migration 00005 |
| C3 Admin approve | PASS\* | `PATCH /api/admin/technicians/[id]/status` action approve |
| C4 Appears in browse | PASS\* | Browse filters `verification_status = 'verified'` |
| C5 Receives assignment | PASS\* | RPC match or direct book creates `booking_assignments` |
| C6 Jobs Available tab | PASS | `GET /api/technician/assignments?status=pending` |

**Manual:** Approve tech in `/admin/technicians`, create booking, verify job visible.

---

## Flow D — Technician Google → Complete Profile

| Step | Result | Evidence |
|------|--------|----------|
| D1 OAuth redirect | PASS\* | `auth/callback/route.ts` + middleware role routing |
| D2 Incomplete → complete form | PASS | Middleware redirects to `?complete=1`; `profile-complete.ts` |
| D3 Complete registration API | PASS | `POST /api/auth/complete-technician-registration` |
| D4 Redirect to jobs when complete | PASS | `middleware.ts` `technicianHomePath()` |

**Manual:** Requires Google OAuth configured in Supabase.

---

## Flow E — Admin: Approve Technician & Payment

| Step | Result | Evidence |
|------|--------|----------|
| E1 Approve technician | PASS\* | Admin status route + audit log |
| E2 Approve payment | PASS\* | `PATCH /api/admin/payments/[id]/approve` |
| E3 Reject payment | PASS\* | `PATCH /api/admin/payments/[id]/reject` |
| E4 Payment settings | PASS | `GET/PATCH /api/admin/payment-settings` |

**Manual:** Admin login `admin@sanad.app` (see ADMIN-SETUP.md).

---

## Flow F — Logout / Role Switch

| Step | Result | Evidence |
|------|--------|----------|
| F1 Local logout | PASS | `POST /api/auth/signout` `{ scope: "local" }` — dev log 200 |
| F2 Global logout | PASS | signout route supports `global` scope |
| F3 Idle timeout | PASS | `useIdleLogout.ts`, `dashboard-session-manager.tsx` |
| F4 Role-based redirect after login | PASS | `middleware.ts` role branches |
| F5 AuthGuard client fallback | PASS | `auth-guard.tsx` on role layouts |

**Manual:** Login matrix (customer ↔ technician ↔ admin) per TEST-WORKFLOW.md Flow F.

---

## Admin Workflows (Phase 9)

| Workflow | Result | Evidence |
|----------|--------|----------|
| Dashboard stats | PASS\* | `GET /api/admin/dashboard` — 401 unauth (curl); full data needs admin session |
| Categories CRUD | PASS | Admin routes + `/admin/categories` page |
| Services CRUD | PASS | Admin routes + page |
| Bookings list/detail | PASS | `admin/bookings/*` + assign/status APIs |
| Customers list/detail | PASS | Admin customer routes |
| Technicians list/detail/approve | PASS | Admin technician routes |
| Reviews moderation | PASS | `POST /api/admin/reviews/[id]/moderate` |
| Audit logs | PASS | `00010_admin_audit.sql` + route |

---

## Auth & Security Workflows (Phase 14)

| Check | Result | Evidence |
|-------|--------|----------|
| Unauthenticated API blocked | PASS | curl: `/api/bookings` → 401, `/api/admin/dashboard` → 401 |
| Middleware protects routes | PASS | `middleware.ts` redirects unauthenticated users |
| Admin API requires admin role | PASS\* | `requireAdmin()` on all `/api/admin/*` |
| Upload requires auth | PASS | `requireAuth` in upload route |
| Password reset pages | PASS | `forgot-password`, `update-password` pages exist |
| RLS on core tables | PASS | All migrations enable RLS |

---

## Known FAIL / Partial Items

| Item | Result | Detail |
|------|--------|--------|
| Google OAuth E2E | **MANUAL** | Depends on Supabase provider config — not testable without credentials |
| Email notifications | **FAIL** (by design) | `sendEmailNotification()` stub; default off |
| Rate limiting | **FAIL** (ops) | Worker not deployed — APIs unprotected at edge |
| Maps under production CSP | **FAIL** (likely) | OSM domains missing from `next.config.ts` CSP |
| `max_distance_km` enforcement | **FAIL** | Stored on profile; not enforced in browse/match API |
| Automated E2E suite | **FAIL** | Zero test files |

---

## Curl Smoke Test Log (2025-06-26)

```
GET /api/technicians/browse?limit=3  → 200
GET /api/categories                  → 200
GET /api/services                    → 200
GET /api/bookings                    → 401 (no session)
GET /api/admin/dashboard             → 401 (no session)
```

---

## Manual Verification Checklist (Pre-Launch)

- [ ] Customer signup → book (auto-match) → technician accept
- [ ] Direct book from `/services` card → single assignment
- [ ] Chat messages appear both sides within ~2s
- [ ] Payment screenshot upload + admin approve
- [ ] Review after completed booking
- [ ] Technician register → admin approve → visible on browse
- [ ] Logout / login role switch matrix
- [ ] Maps load on `/services/map` with production CSP headers

---

## Related

- [TEST-WORKFLOW.md](./TEST-WORKFLOW.md) — Full Arabic/English QA playbook
- [DIRECT-BOOKING.md](./DIRECT-BOOKING.md) — Direct booking spec
- [PRODUCTION-READINESS.md](./PRODUCTION-READINESS.md) — Launch scores and blockers
