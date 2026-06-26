# Authorization Tests — Sanad Platform

**Review date:** 2025-06-25  
**Method:** Code review + live curl against `localhost:3000` (dev server)

---

## Test Matrix

### Customer scenarios

| # | Scenario | Endpoint | Auth | Expected | Result |
|---|----------|----------|------|----------|--------|
| C1 | List categories (public) | `GET /api/categories` | None | 200 | ✅ 200 |
| C2 | Create booking without session | `POST /api/bookings` | None | 401 | ✅ 401 |
| C3 | View own booking | `GET /api/bookings/[id]` | Customer cookie | 200 if owner | ✅ Code: RLS + route ownership check |
| C4 | View another customer's booking | `GET /api/bookings/[id]` | Customer cookie | 403 | ✅ Route checks `customer_id` |
| C5 | Create review | `POST /api/reviews` | Customer | 201 if completed booking | ✅ RLS: completed booking required |
| C6 | List chat conversations | `GET /api/chat/conversations` | None | 401 | ✅ 401 |
| C7 | Upload file | `POST /api/upload` | None | 401 | ✅ 401 |

### Technician scenarios

| # | Scenario | Endpoint | Auth | Expected | Result |
|---|----------|----------|------|----------|--------|
| T1 | View profile | `GET /api/technician/profile` | None | 401 | ✅ 401 |
| T2 | Update own profile | `PUT /api/technician/profile` | Technician | 200 | ✅ RLS: own row only |
| T3 | List assignments | `GET /api/technician/assignments` | Technician | 200 own only | ✅ RLS: `technician_id = auth.uid()` |
| T4 | Respond to assignment | `POST /api/technician/assignments/[id]/respond` | Other tech | 403/404 | ✅ RLS blocks non-owner UPDATE |
| T5 | Access admin dashboard | `GET /api/admin/dashboard` | Technician | 403 | ✅ `requireAdmin` → 403 |

### Admin scenarios

| # | Scenario | Endpoint | Auth | Expected | Result |
|---|----------|----------|------|----------|--------|
| A1 | Dashboard stats | `GET /api/admin/dashboard` | None | 401 | ✅ 401 |
| A2 | Dashboard stats | `GET /api/admin/dashboard` | Customer | 403 | ✅ `requireAdmin` |
| A3 | Moderate review | `PATCH /api/admin/reviews/[id]/moderate` | Admin | 200 | ✅ requireAuth + requireAdmin |
| A4 | Assign technician | `POST /api/admin/bookings/[id]/assign` | Admin | 200 | ✅ Service role RPC for matching |
| A5 | View audit logs | `GET /api/admin/audit-logs` | Non-admin | 403 | ✅ RLS + requireAdmin |
| A6 | Create category | `POST /api/admin/categories` | Admin | 201 + audit log | ✅ |

### Cross-role / attack scenarios

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| X1 | OAuth open redirect `?next=//evil.com` | 400 | ✅ 400 (authCallbackQuerySchema) |
| X2 | Extra query param on public route | 400 | ✅ 400 (`emptyQuerySchema` strict) |
| X3 | Spoof `x-user-id` header | Ignored at Next middleware | ✅ Stripped + set from session (00014 middleware fix) |
| X4 | Direct Supabase client as anon | RLS blocks cross-tenant reads | ✅ Policies enforce ownership |
| X5 | Call `match_technicians_for_booking` RPC | Denied for authenticated | ✅ 00012 REVOKE EXECUTE |
| X6 | Upload executable MIME | Rejected | ✅ Zod enum + bucket allowlist |

---

## Page Route Authorization (`src/lib/supabase/middleware.ts`)

| Route prefix | Unauthenticated | Wrong role |
|--------------|-----------------|------------|
| `/customer/*` | Redirect login | Redirect login |
| `/technician/*` | Redirect login | Redirect login |
| `/admin/*` | Redirect login | Redirect login |

---

## curl Commands Used

```bash
# Unauthenticated protected endpoints
curl -s -o NUL -w "%{http_code}" -X POST http://localhost:3000/api/upload \
  -H "Content-Type: application/json" -d "{\"fileType\":\"image/jpeg\"}"
# → 401

curl -s -o NUL -w "%{http_code}" http://localhost:3000/api/admin/dashboard
# → 401

curl -s -o NUL -w "%{http_code}" http://localhost:3000/api/bookings
# → 401

curl -s -o NUL -w "%{http_code}" http://localhost:3000/api/chat/conversations
# → 401

# Open redirect blocked
curl -s -o NUL -w "%{http_code}" "http://localhost:3000/api/auth/callback?next=//evil.com"
# → 400

# Strict query validation
curl -s -o NUL -w "%{http_code}" "http://localhost:3000/api/categories?foo=bar"
# → 400

# Public read
curl -s -o NUL -w "%{http_code}" http://localhost:3000/api/categories
# → 200
```

---

## Gaps (require authenticated session cookies for full E2E)

Full cross-user booking/review tests require seeded users and session cookies. RLS policies and route-level checks were verified via code review; live tests confirm auth gates and validation.

---

## Verdict

**Authorization posture: PASS** for Phase 9 scope. All admin routes dual-guarded; customer/technician routes use RLS + `requireAuth`; public reads limited to active catalog data.
