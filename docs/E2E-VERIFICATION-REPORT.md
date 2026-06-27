    # Sanad — E2E Verification Report

    **Date:** 2026-06-26 (re-run after fixes)  
    **Environment:** `http://localhost:3000` (Next.js 16 dev) · Supabase project `xswhctwqvdtejmncswis`  
    **Method:** Playwright Chromium (`e2e/full-workflow.spec.ts`) — 18 tests, 1 worker, serial  
    **Rule:** PASS only with runtime evidence (screenshot, HTTP status, or SQL row)

    ---

    ## Executive Summary

    | Metric | Count |
    |--------|------:|
    | **PASS** | 16 |
    | **FAIL** | 0 |
    | **MANUAL** | 2 |
    | **NOT RUN** | 0 |
    | **Fixes applied this session** | 6 code + 1 migration pushed |

    **Beta launch justified by evidence?** **Yes — limited beta** — full customer → technician → chat → admin → payment → logout chain passed with API/DB evidence. Google OAuth and email verification remain **MANUAL**. Production ops (CI, monitoring, rate-limiter worker) still outstanding per `docs/PRODUCTION-READINESS.md`.

    ---

    ## Test Accounts (dev only)

    | Role | Identifier | Password |
    |------|------------|----------|
    | Customer | `test-customer@sanad.app` | `TestCustomer2025!` |
    | Technician | phone `01111734655` → `tech+01111734655@sanad.app` | `TestTech2025!` |
    | Admin | `admin@sanad.app` | `SanadAdmin2025!` |

    Seeded via `npm run seed:e2e` → `scripts/seed-e2e-users.ts` (service role). IDs in `e2e/test-users.json`.

    ---

    ## Summary Table

    | Workflow | Browser Tested | API Tested | DB Verified | Result |
    |----------|:--------------:|:----------:|:-----------:|:------:|
    | Auth — unauthenticated blocked | — | GET `/api/bookings` → **401** | — | **PASS** |
    | Auth — customer email login | `/auth/login` → `/services` | session cookie set | `profiles.role=customer` | **PASS** |
    | Auth — Google OAuth | button visible | — | — | **MANUAL** |
    | Auth — email verification signup | `/auth/register` UI | — | — | **MANUAL** |
    | Customer — browse `/services` | 200 page | GET `/api/technicians/browse` → **200** | services/categories exist | **PASS** |
    | Maps — `/services/map` + OSM tiles | map renders | 28× `tile.openstreetmap.org` requests | — | **PASS** |
    | Customer — direct booking | form submit → booking detail | POST **201**, GET `/api/bookings` → **200** | `bookings.status=matched`, assignment row | **PASS** |
    | Customer — auto-match booking | form submit | POST **201**, GET `/api/bookings` → **200** | `bookings.status=pending` | **PASS** |
    | Technician — pending jobs | `/technician/jobs` | GET assignments → **200** | `booking_assignments.status=pending` | **PASS** |
    | Technician — accept assignment | `/technician/jobs/{id}` | POST respond → **200** `accepted` | `bookings.status=accepted`, chat row | **PASS** |
    | Chat — conversation after accept | `/customer/bookings/{id}/chat` | GET conversations → **200** (row found) | `chat_conversations` row | **PASS** |
    | Chat — send message | chat UI | GET messages → **200** | message row (UI send) | **PASS** |
    | Admin — dashboard + complete | `/admin` | dashboard **200**, PATCH status **200** | `bookings.status=completed` | **PASS** |
    | Customer — payment submit | payment page | POST payment → **201** | `payments.status=pending` | **PASS** |
    | Admin — approve payment | `/admin/payments` | PATCH approve → **200** | `payments.status=approved` | **PASS** |
    | Admin — approve technician | — | PATCH status → **200** | `verification_status=verified` | **PASS** |
    | Notifications | `/notifications` | GET **200**, unread **200** | notification rows | **PASS** |
    | Auth — logout | `/services` after logout | GET `/api/bookings` → **401** | session cleared | **PASS** |

    ---

    ## Fixes Applied (2026-06-26 follow-up)

    1. **`GET /api/bookings`** — fixed PostgREST join: embed `service_categories` via `services(...)` instead of invalid `service_categories!inner` on `bookings`.
    2. **Migration `00022_bookings_rls_recursion_fix.sql`** — pushed to remote (`supabase db push`).
    3. **Technician accept** — explicit `chat_conversations` upsert + booking update error handling in `respond/route.ts`.
    4. **CSP** — `img-src` allows `https://placehold.co` for E2E seed avatars.
    5. **E2E `apiGet`** — return full response body (was truncating at 500 chars, breaking JSON parse of assignment lists → accept never ran).
    6. **E2E chat test** — match conversation by `booking.id` nested field as well as `booking_id`.

    ---

    ## Artifacts

    | Artifact | Path |
    |----------|------|
    | Playwright spec | `e2e/full-workflow.spec.ts` |
    | Step evidence JSON | `e2e/evidence.json` |
    | Screenshots | `docs/e2e-screenshots/01`–`14` |
    | Seed script | `scripts/seed-e2e-users.ts` |
    | Run command | `npm run test:e2e -- e2e/full-workflow.spec.ts` |

    ---

    ## Re-run Checklist

    ```bash
    npm run dev                    # localhost:3000 (or -p 3002 if 3000 busy)
    npm run cleanup:e2e            # wipe non-admin users + transactional data
    npm run seed:e2e               # optional — global-setup also seeds
    npm run test:e2e -- e2e/technician-admin-workflow.spec.ts
    npm run test:e2e -- e2e/full-workflow.spec.ts
    npm run verify:e2e-db          # optional DB cross-check
    ```

    ---

    ## Technician Admin Workflow (2026-06-27)

    **Spec:** `e2e/technician-admin-workflow.spec.ts` — **5/5 PASS** on `http://localhost:3002`

    | Step | Result |
    |------|--------|
    | Pending technician login (complete profile, no `complete=1` redirect) | **PASS** |
    | Admin approves technician via `/admin/technicians/{id}` UI | **PASS** |
    | Technician receives `technician_approved` notification | **PASS** |
    | Technician toggles availability (no redirect loop) | **PASS** |
    | Customer browse lists approved technician | **PASS** |

    **Test accounts (after cleanup + seed):**

    | Role | Identifier | Password |
    |------|------------|----------|
    | Customer | `test-customer@sanad.app` | `TestCustomer2025!` |
    | Technician | phone `01111734655` → `tech+01111734655@sanad.app` | `TestTech2025!` |
    | Admin | `admin@sanad.app` | `SanadAdmin2025!` |

    **Cleanup (2026-06-27):** Removed 4 auth users, 2 technician profiles, 6 skills, 9 audit logs, 2 notifications. Preserved admin + catalog (11 categories, 48 services, 3 hero slides). Report: `e2e/cleanup-report.json`.

    **Fixes this session:** availability switch sync (`useEffect` on profile load), E2E helper strict-mode for Jobs heading, direct admin detail URL in approval test, `scripts/run-cleanup-non-admin.ts` + `scripts/set-e2e-tech-pending.ts`.

    **Screenshots:** `docs/e2e-screenshots/tech-01`–`tech-05`

    ---

    ## Professional Workflow (2026-06-27)

    ### DB reset

    ```bash
    npm run e2e:reset          # cleanup:e2e + seed:e2e (admin + 2 test users only)
    npm run cleanup:e2e        # wipe non-admin users + transactional data
    npm run seed:e2e           # recreate customer, technician, auth states
    ```

    ### Test accounts (after `e2e:reset`)

    | Role | Identifier | Password |
    |------|------------|----------|
    | Admin | `admin@sanad.app` | `SanadAdmin2025!` |
    | Customer | `test-customer@sanad.app` | `TestCustomer2025!` |
    | Technician | phone `01111734655` → `tech+01111734655@sanad.app` | `TestTech2025!` |

    Technician is seeded **verified** by default. Admin-approval spec calls `scripts/set-e2e-tech-pending.ts` in `beforeAll`.

    ### npm scripts

    | Command | Spec |
    |---------|------|
    | `npm run test:e2e:admin` | `e2e/technician-admin-workflow.spec.ts` |
    | `npm run test:e2e:chat` | `e2e/workflow-chat-realtime.spec.ts` |
    | `npm run test:e2e:professional` | admin + chat specs (serial) |

    ### Full professional validation

    ```powershell
    npm run e2e:reset
    npx next dev -p 3002
    $env:PLAYWRIGHT_BASE_URL="http://localhost:3002"
    npm run test:e2e:professional
    ```

    Use port **3002** when port 3000 hosts another app.

    ### Chat realtime workflow

    **Spec:** `e2e/workflow-chat-realtime.spec.ts`

    | # | Test | Proves |
    |---|------|--------|
    | 1 | Customer direct-books E2E technician | Booking with `technician_id` |
    | 2 | Technician accepts assignment | `bookings.status=accepted`; `chat_conversations` row |
    | 3 | Chat lists show correct names | Customer name on `/technician/chat`; technician on `/customer/chat` |
    | 4 | **Bidirectional realtime** | Dual Playwright contexts; messages appear without reload |
    | 5 | Chat notification | `notifyChatMessage` → `/api/notifications` on recipient |

    **Screenshots:** `docs/e2e-screenshots/chat-01`–`chat-07`

    ### Pending production fixes (this deploy)

    - Chat API joins customer/technician profiles with `phone`
    - `/technician/chat/[bookingId]` and `/customer/chat/[bookingId]` detail routes (404 fix)
    - Call Customer button on job detail (`toTelHref`)
    - `data-testid` on chat input/send/message for Playwright
    - Orange `#FF6B00` accent on chat UI
