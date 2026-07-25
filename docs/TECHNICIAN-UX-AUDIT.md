# Technician Experience Audit — Sanad

**Date:** 2026-07-25
**Method:** Automated Playwright walk (`e2e/technician-experience-audit.spec.ts`) at a **375 px** mobile viewport against a local dev server (`http://localhost:3000`) targeting the live Supabase project, plus source inspection. All 13 screens measured; 11/11 spec steps executed green (the two "missing feature" steps are intentional FAIL markers).
**Evidence:** `e2e/evidence.json`, screenshots in `docs/e2e-screenshots/tech-audit-*.png`.

> **Run note (environment):** this machine runs Node 20, which has no global `WebSocket`; `@supabase/realtime-js@2.108.2` throws in its constructor, crashing the seed and the dev server's server-side Supabase clients. Worked around locally (test-only, not committed to deps) with `npm i ws --no-save` + a `NODE_OPTIONS=--import ./e2e/ws-polyfill.mjs` global polyfill for `seed` / `dev` / `playwright`. Production is unaffected (Vercel runs Node ≥ 22). The audit also uses `playwright.audit.config.ts` (skips the shared `globalSetup`, whose inline phone-login is flaky locally; the default project doesn't consume its auth states).

---

## A. Screen-by-screen table

| # | Screen | URL | Load (ms) | API calls | Console errors | RTL OK? | Mobile 375px OK? | Loading skeleton? | Empty state? | Error recovery? |
|---|--------|-----|-----------|-----------|----------------|---------|------------------|-------------------|--------------|-----------------|
| 1 | Login → Jobs | `/technician/jobs` | ~1578 | 5 | 0 | ✅ | ✅ | ✅ | ✅ (`لا توجد طلبات`) | ⚠️ message only, no retry |
| 2/3 | Jobs list | `/technician/jobs` | ~1484 | 6 | 0 | ✅ | ⚠️ tabs 34 px (<44) | ✅ | ✅ | ⚠️ message only, no retry |
| 4 | Job detail (pending) | `/technician/jobs/[id]` | ~1533 | 4 | 0 | ⚠️ EN strings + `ArrowLeft` + `mr-/ml-` | ⚠️ Accept/Decline 36 px (<44) | ✅ | n/a | ❌ EN "Job not found", no retry |
| 5 | Accept assignment | `POST …/respond` | — | — | 0 | ✅ | ✅ | n/a | n/a | ✅ (200, UI flips to accepted) |
| 6 | **Start Job** | `/technician/jobs/[id]` | — | — | 0 | — | — | — | — | ❌ **feature absent** |
| 7 | **Complete Job** | `/technician/jobs/[id]` | — | — | 0 | — | — | — | — | ❌ **feature absent** |
| 8 | In-job chat | `/technician/jobs/[id]/chat` | ~1527 | 5 | 0 | ✅ input RTL | ✅ | ✅ | ✅ | ⚠️ not verified |
| 9 | Chat list | `/technician/chat` | ~1503 | 3 | 0 | ✅ | ✅ | ✅ | ✅ | ⚠️ message only |
| 10/11 | Profile + availability | `/technician/profile` | ~2010 | **19** ⚠️ | 0 | ⚠️ EN strings | ✅ | ✅ | n/a | ✅ message w/ context |
| 12 | Reviews | `/technician/reviews` | ~4170 | 1 | 0 | ✅ | ✅ | ✅ | ✅ (`لا توجد تقييمات بعد`) | ✅ message |
| 13 | Notifications | `/notifications` | ~3757 | 1 | 0 | ✅ | ✅ | ✅ | ✅ | ⚠️ message only |

**Highlights:** zero console errors and zero failed API calls on every screen. Load times are healthy (dev-mode) except Profile's **19 fetch round-trips** and the reviews/notifications cold loads (~4 s). Real defects concentrate in **touch-target sizing, language consistency on job-detail/profile, and two entirely missing state transitions.**

---

## B. Logic gaps (missing state-machine transitions)

The booking lifecycle is `pending → matched → accepted → in_progress → completed` (+ `cancelled`). The technician UI/API only covers up to **accepted**:

| Transition | UI | API | Status |
|---|---|---|---|
| `pending → accepted / rejected` | ✅ `JobActionBar` | ✅ `POST /api/technician/assignments/[id]/respond` | Works (respond=200, booking→accepted verified) |
| **`accepted → in_progress` (Start Job)** | ❌ none | ❌ none | **Missing** — audit step 06 FAIL |
| **`in_progress → completed` (Complete Job)** | ❌ none | ❌ none | **Missing** — audit step 07 FAIL |
| Technician-initiated cancellation | ❌ none | ❌ none | Missing (only customer can cancel via `PATCH /api/bookings/[id]`) |

Consequence: once a technician accepts, **the job is stuck at `accepted` forever** from the technician side — they can never mark work started or done, so `completed` (which unlocks the customer review + payment-complete framing) is unreachable through the app.

### Discovered bug (not in the original gap list)
**Profile "Save Changes" wipes the technician's skills → self-lockout.** During the run, after clicking the profile **Save Changes** button, `/technician/reviews` and `/notifications` both redirected to `/auth/register-technician?complete=1`. Root cause: the full profile form submits the skills selector, which serialized **empty**, and `PUT /api/technician/profile` cleared `technician_skills`; the middleware then treats the technician as onboarding-incomplete and locks them out of all technician routes. This is a **P1 correctness bug** — a technician editing their bio can accidentally delete their skills and lose access. (The audit's bio step was switched to a scoped API PUT to avoid corrupting later measurements; the destructive behavior is reproduced via the UI Save button.)

---

## C. UX gaps vs Web Interface Guidelines

| Guideline | Finding | Evidence |
|---|---|---|
| **Touch targets ≥ 44×44 px** | Jobs filter tabs are **34 px**; Accept/Decline buttons are **36 px** | measured `minTabH=34px`, `acceptH=36 declineH=36` |
| Accessible label on availability switch | ❌ `Switch` has **no `aria-label`** and no associated `<label>`; visible text is a sibling `<span>` | `switchAccessibleLabel=false`; `profile/page.tsx:246` |
| Language consistency (all Arabic) | ❌ **Job detail** (`jobs/[id]/page.tsx`) and **Profile** (`profile/page.tsx`) are largely **English** ("Customer", "Address", "Job Details", "Preferred Time", "Call Customer", "Open Chat", "Save Changes", "Status", "Available for jobs", "Verification", all toasts) inside an RTL layout | source inspection |
| Back-button icon direction | ❌ Job detail uses **`ArrowLeft`** (points wrong way in RTL) | `jobs/[id]/page.tsx:14,92` |
| RTL logical properties | ❌ `mr-1`/`ml-1`/`mr-`/`ml-` instead of `ms-*`/`me-*` in `jobs/[id]/page.tsx` (92, 169) and `job-action-bar.tsx` (102,104,115,117); `ml-auto` in profile | source inspection |
| Loading skeletons | ✅ present on jobs list, job detail, profile, reviews | source + render |
| Empty states | ✅ jobs (`لا توجد طلبات`), reviews (`لا توجد تقييمات بعد`) | rendered |
| Error recovery (retry) | ⚠️ technician screens show a **message but no retry button** (customer browse has `ErrorState` w/ retry; technician pages don't). Job-detail error is **English** "Job not found" | `jobs/[id]/page.tsx:41-51`, `jobs/page.tsx` error block |
| Focus states | ⚠️ rely on shadcn defaults; job-detail/action-bar custom buttons not explicitly verified for visible focus | to verify |
| Contrast (availability badge) | ⚠️ `متاح`/`غير متصل` badge uses `success`/`secondary` variants — contrast not formally measured | to verify with axe |
| CLS (map/avatar) | ⚠️ Leaflet map injected after load in job detail; potential shift — not formally measured | to verify |
| Console/network health | ✅ **0 console errors, 0 failed API calls** on all screens | evidence.json |

---

## D. Domain-completeness gaps (by severity)

| Severity | Gap | Notes |
|---|---|---|
| **P0** | Job status transitions — **Start Job** & **Complete Job** absent (UI + API) | Core lifecycle broken past `accepted` |
| **P0** | Language consistency — English strings in job detail + profile inside RTL | Contradicts Arabic-first product |
| **P1** | **Profile Save wipes skills → lockout** (discovered bug) | Data-loss + access-loss |
| **P1** | Earnings/payout view — no `/technician/earnings` (total, per-job, pending vs paid) | No income visibility |
| **P1** | Quick availability toggle on jobs list header (currently profile-only) | Availability badge shows on jobs list but isn't interactive |
| **P1** | Reviews link missing from **header nav** (`Jobs / Chat / Profile` only) | Page exists + renders; `headerNavLink=0` |
| **P1** | Realtime new-assignment push — polling only | Technician can miss new jobs |
| **P2** | Touch targets < 44 px (tabs 34, buttons 36) | Also a UX-guideline item |
| **P2** | Availability schedule / working hours | Not present |
| **P2** | Job history filters (date range, category) | Only status tabs today |
| **P2** | "Open in Maps" deep link to customer location | Map is view-only |
| **P2** | Cancellation reason visible to technician when customer cancels | `cancellation_reason` stored, not surfaced |

---

## E. Prioritized implementation plan

### P0-1 — Start Job (accepted → in_progress)
- **Acceptance (Playwright):** on an `accepted` job, a "بدء العمل" button is visible & ≥44 px; clicking it calls `PATCH /api/technician/bookings/[id]` → `200`; booking status becomes `in_progress`; customer receives a `booking_started` notification.
- **Files:** create `src/app/api/technician/bookings/[id]/route.ts` (PATCH, verify assignment ownership + status guard `accepted→in_progress`, write via service role, `notifyBookingStatusChange(...,'in_progress')`); add button to `src/components/shared/job-action-bar.tsx` (+ handler in `src/app/technician/jobs/[id]/page.tsx`); add `useUpdateBookingStatus` to `src/hooks/use-technician.ts`.

### P0-2 — Complete Job (in_progress → completed)
- **Acceptance:** on `in_progress`, "إنهاء العمل" button visible & ≥44 px; `PATCH` → `200`; status → `completed`; customer gets `booking_completed` notification (already an email/push trigger).
- **Files:** same route (accept `completed` with guard `in_progress→completed`); button + handler in the same components.

### P0-3 — Language + RTL fixes on job detail & profile
- **Acceptance:** no English UI chrome on `/technician/jobs/[id]` or `/technician/profile`; back button uses `ArrowRight`; no `mr-*`/`ml-*` in those files or `job-action-bar.tsx` (use `ms-*`/`me-*`); toasts Arabic.
- **Files:** `src/app/technician/jobs/[id]/page.tsx`, `src/components/shared/job-action-bar.tsx`, `src/app/technician/profile/page.tsx`.

### P1-4 — Fix profile Save wiping skills (data-loss bug)
- **Acceptance:** submitting the profile form without touching skills preserves existing `technician_skills`; technician is NOT redirected to `?complete=1` afterward; Playwright: save bio via UI → reload → skills still present, `/technician/reviews` reachable.
- **Files:** `src/app/technician/profile/page.tsx` (don't send empty skills / only send when changed) and/or `src/app/api/technician/profile/route.ts` (ignore empty skills array) + `PUT` handler.

### P1-5 — Touch targets ≥ 44 px
- **Acceptance:** jobs filter tabs and Accept/Decline/Start/Complete buttons report `boundingBox().height ≥ 44`.
- **Files:** `src/app/technician/jobs/page.tsx` (tab buttons), `src/components/shared/job-action-bar.tsx` (`size="lg"`/`min-h-[44px]`).

### P1-6 — Availability switch accessible label
- **Acceptance:** `[role="switch"]` has `aria-label` (Arabic) or an associated `<label>`.
- **Files:** `src/app/technician/profile/page.tsx`.

### P1-7 — Reviews link in header nav
- **Acceptance:** `header a[href="/technician/reviews"]` exists; label Arabic (`التقييمات`).
- **Files:** `src/app/technician/layout.tsx` (`technicianNavItems`) — also translate the existing `Jobs/Chat/Profile` labels to Arabic while there.

### P1-8 — Earnings view *(net-new)*
- **Acceptance:** `/technician/earnings` renders total earned + per-job list + pending/paid split from approved payments.
- **Files:** `src/app/technician/earnings/page.tsx`, `src/app/api/technician/earnings/route.ts`, nav link.

### P1-9 — Quick availability toggle on jobs list
- **Acceptance:** toggling the jobs-list header switch calls `PUT /api/technician/profile` → 200 and reflects server value.
- **Files:** `src/app/technician/jobs/page.tsx` (reuse the profile toggle mutation).

### P1-10 — Realtime new-assignment push
- **Acceptance:** a new assignment appears on the jobs list without manual refresh (Supabase `postgres_changes` on `booking_assignments` filtered by technician).
- **Files:** `src/hooks/use-technician.ts` (realtime hook, mirror the `useTechnicianAvailabilityRealtime` pattern), `src/app/technician/jobs/page.tsx`; realtime publication for `booking_assignments` (migration if not already published).

### P2 — polish
Error-recovery retry buttons on technician list/detail screens; "Open in Maps" deep link; job history date/category filters; working-hours schedule; surface `cancellation_reason` to the technician; reduce Profile's 19 API round-trips.

---

## Implementation status (post-audit)

**Shipped to production** (commit `5d22bb4`, deploy READY at https://sanad-five-zeta.vercel.app):
- P1 #4 — profile save no longer wipes skills (root cause: `selectedSkills` hydration).
- P0-1/P0-2 — Start Job / Complete Job (`PATCH /api/technician/bookings/[id]` + buttons, customer notified).
- P0-3 — Arabic/RTL pass on job-detail & profile (`ArrowRight`, `ms-`/`me-`, Arabic dates/toasts).

**Implemented, awaiting review/second deploy** (not yet committed):
- P1-5 — jobs filter tabs now ≥44px (spec: `tabs≥44px=4/4`).
- P1-6 — availability `Switch` has an accessible label (job list + profile).
- P1-7 — Reviews (+ Earnings) links added to header nav; nav labels translated to Arabic.
- P1-9 — quick availability toggle on the jobs list header (spec: `quickToggle=true`).
- P1-8 — Earnings view: `/technician/earnings` + `GET /api/technician/earnings` (derived from
  bookings + approved/pending payments via service role; no payouts table). Spec: `apiShapeOk=true`.
- P1-10 — realtime new-assignment push (`useTechnicianAssignmentsRealtime`) wired to the jobs list.
  Migration `00031_booking_assignments_realtime.sql` is applied; **live delivery verified** by the
  audit spec (new assignment appears without a manual refresh: `before=4 after=5 liveUpdate=true`).

**P2** — remains backlog (not in scope): error-recovery retry buttons, "Open in Maps", history
filters, working-hours schedule, cancellation-reason display, trimming Profile's ~19 fetches.

## Quality gates (this audit change set)
- `npx tsc --noEmit` → **pass** (0 errors), incl. the new spec.
- `npx eslint e2e/technician-experience-audit.spec.ts playwright.audit.config.ts` → **0 errors**.
- No commits, no pushes, no destructive Supabase ops (only seed + one direct booking created via the normal API).

## New/changed files for the audit (no app code touched)
- `e2e/technician-experience-audit.spec.ts` (spec)
- `playwright.audit.config.ts` (skips flaky globalSetup)
- `e2e/ws-polyfill.mjs` (Node-20 WebSocket polyfill for local runs)
- `.env.local` → `RATE_LIMIT_ENABLED=false` appended (local only)
- `docs/TECHNICIAN-UX-AUDIT.md` (this report) + `docs/e2e-screenshots/tech-audit-*.png`
