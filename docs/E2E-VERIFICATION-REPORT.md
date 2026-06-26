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
    | Technician | phone `01099998888` → `tech+01099998888@sanad.app` | `TestTech2025!` |
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
    npm run dev                    # localhost:3000
    npm run seed:e2e               # optional — global-setup also seeds
    npm run test:e2e -- e2e/full-workflow.spec.ts
    npm run verify:e2e-db          # optional DB cross-check
    ```
