# Sanad — API Audit (Phase 4)

**Audit date:** 2025-06-26  
**Total route files:** 49  
**HTTP handlers:** 56  
**Validation coverage:** 100% (Zod on body/query/params per [API-VALIDATION.md](./API-VALIDATION.md))

**Smoke tests run (local dev):**

| Endpoint | Status | Evidence |
|----------|--------|----------|
| `GET /api/technicians/browse?limit=3` | 200 | curl.exe 2025-06-26 |
| `GET /api/categories` | 200 | curl.exe |
| `GET /api/services` | 200 | curl.exe |
| `GET /api/bookings` (no session) | 401 | curl.exe |
| `GET /api/admin/dashboard` (no session) | 401 | curl.exe |

---

## Legend

| Auth | Meaning |
|------|---------|
| **Public** | No session required |
| **Auth** | `requireAuth()` — any logged-in user |
| **Admin** | `requireAuth` + `requireAdmin` |
| **Technician** | Auth + RLS/scoped queries to `auth.user.id` |
| **Inline** | Manual `getUser()` check (same effect as Auth) |
| **Session** | Cookie-based signout/callback — special handling |

| Validation | Schema location |
|------------|-----------------|

---

## Auth & Registration

| Method | Route | Auth | Validation | Issues |
|--------|-------|------|------------|--------|
| GET | `/api/auth/callback` | Session | `authCallbackQuerySchema` | OAuth config required in Supabase dashboard |
| POST | `/api/auth/signout` | Session | `signOutBodySchema` (inline zod) | Works without prior auth — intentional |
| POST | `/api/auth/register-technician` | Public | `registerTechnicianSchema` | Uses service role; rate limit gap |
| POST | `/api/auth/complete-technician-registration` | Auth | completion schema | Technician role only (app logic) |

---

## Public Catalog

| Method | Route | Auth | Validation | Issues |
|--------|-------|------|------------|--------|
| GET | `/api/categories` | Public | `emptyQuerySchema` | — |
| GET | `/api/services` | Public | `listServicesQuerySchema` | — |
| GET | `/api/technicians/browse` | Public* | `browseTechniciansQuerySchema` | **503** if `SUPABASE_SERVICE_ROLE_KEY` missing; optional session for phone visibility |
| GET | `/api/technicians/[id]` | Inline | `adminEntityIdSchema` | Requires auth for full preview; public partial data |

\*Public read but depends on service role client.

---

## Bookings (Customer)

| Method | Route | Auth | Validation | Issues |
|--------|-------|------|------------|--------|
| GET | `/api/bookings` | Auth | `listBookingsQuerySchema` | RLS scopes to customer |
| POST | `/api/bookings` | Auth | `createBookingSchema` | Direct + auto-match paths; service role for RPC/assign |
| GET | `/api/bookings/[id]` | Auth | `adminEntityIdSchema` | Customer or assigned technician via RLS |
| PATCH | `/api/bookings/[id]` | Auth | `updateBookingStatusSchema` | Status transition guards in handler |
| GET | `/api/bookings/[id]/payment` | Auth | params | Customer owns booking |
| POST | `/api/bookings/[id]/payment` | Auth | payment schema | Requires `price_quote` or amount |

---

## Reviews

| Method | Route | Auth | Validation | Issues |
|--------|-------|------|------------|--------|
| GET | `/api/reviews` | **Public** | `listReviewsQuerySchema` | RLS hides non-public; no explicit auth |
| POST | `/api/reviews` | Auth | `createReviewSchema` | Completed booking + customer ownership |
| GET | `/api/reviews/booking/[id]` | **Public** | `adminEntityIdSchema` | FK hints fixed → `reviews_customer_id_fkey` |

---

## Chat

| Method | Route | Auth | Validation | Issues |
|--------|-------|------|------------|--------|
| GET | `/api/chat/conversations` | Inline | `emptyQuerySchema` | **Recommend** migrate to `requireAuth`; FK hint fixed |
| GET | `/api/chat/conversations/[id]/messages` | Auth | `listMessagesQuerySchema` + `conversationIdSchema` | — |
| POST | `/api/chat/conversations/[id]/messages` | Auth | `sendMessageSchema` | — |
| PUT | `/api/chat/conversations/[id]/read` | Auth | `conversationIdSchema` | — |

---

## Notifications

| Method | Route | Auth | Validation | Issues |
|--------|-------|------|------------|--------|
| GET | `/api/notifications` | Auth | list schema | — |
| PATCH | `/api/notifications/[id]` | Auth | params | Mark read |
| DELETE | `/api/notifications/[id]` | Auth | params | — |
| POST | `/api/notifications/read-all` | Auth | — | — |
| GET | `/api/notifications/unread-count` | Auth | — | — |
| DELETE | `/api/notifications/bulk` | Auth | bulk schema | — |

---

## Upload

| Method | Route | Auth | Validation | Issues |
|--------|-------|------|------------|--------|
| POST | `/api/upload` | Auth | `uploadRequestSchema` | MIME hardening; user-scoped paths |

---

## Technician

| Method | Route | Auth | Validation | Issues |
|--------|-------|------|------------|--------|
| GET | `/api/technician/profile` | Auth | `emptyQuerySchema` | — |
| PUT | `/api/technician/profile` | Auth | `updateTechnicianProfileSchema` | — |
| GET | `/api/technician/skills` | Auth | `emptyQuerySchema` | — |
| PUT | `/api/technician/skills` | Auth | `updateTechnicianSkillsSchema` | — |
| GET | `/api/technician/bookings` | Auth | `technicianBookingsQuerySchema` | FK: `bookings_customer_id_fkey` ✅ |
| GET | `/api/technician/assignments` | Auth | `listAssignmentsQuerySchema` | Uses shared select fragment ✅ |
| GET | `/api/technician/assignments/[id]` | Auth | `adminEntityIdSchema` | Fallback lookup by booking_id |
| POST | `/api/technician/assignments/[id]/respond` | Auth | `assignmentRespondSchema` | Accept/reject + chat trigger |

---

## Admin

| Method | Route | Auth | Validation | Issues |
|--------|-------|------|------------|--------|
| GET | `/api/admin/dashboard` | Admin | `emptyQuerySchema` | FK hints fixed |
| GET | `/api/admin/categories` | Admin | `emptyQuerySchema` | — |
| POST | `/api/admin/categories` | Admin | `createCategorySchema` | — |
| PATCH | `/api/admin/categories/[id]` | Admin | `updateCategorySchema` | — |
| DELETE | `/api/admin/categories/[id]` | Admin | params | — |
| GET | `/api/admin/services` | Admin | `listServicesQuerySchema` | — |
| POST | `/api/admin/services` | Admin | `createServiceSchema` | — |
| PATCH | `/api/admin/services/[id]` | Admin | `updateServiceSchema` | — |
| DELETE | `/api/admin/services/[id]` | Admin | params | — |
| GET | `/api/admin/customers` | Admin | `adminCustomersQuerySchema` | — |
| GET | `/api/admin/customers/[id]` | Admin | params | FK hints fixed |
| GET | `/api/admin/technicians` | Admin | `adminTechniciansQuerySchema` | — |
| GET | `/api/admin/technicians/[id]` | Admin | params | FK hints fixed |
| PATCH | `/api/admin/technicians/[id]/status` | Admin | `adminTechnicianStatusSchema` | Approve/reject/suspend |
| GET | `/api/admin/bookings` | Admin | query schema | Explicit FK hints ✅ |
| GET | `/api/admin/bookings/[id]` | Admin | params | — |
| PATCH | `/api/admin/bookings/[id]/status` | Admin | `adminBookingStatusSchema` | — |
| POST | `/api/admin/bookings/[id]/assign` | Admin | `adminAssignTechnicianSchema` | — |
| GET | `/api/admin/reviews` | Admin | `adminListReviewsQuerySchema` | FK hints fixed |
| POST | `/api/admin/reviews/[id]/moderate` | Admin | `moderateReviewSchema` | — |
| GET | `/api/admin/payments` | Admin | `adminPaymentsQuerySchema` | FK hints fixed |
| PATCH | `/api/admin/payments/[id]/approve` | Admin | params | Audit log |
| PATCH | `/api/admin/payments/[id]/reject` | Admin | reject schema | — |
| GET | `/api/admin/payment-settings` | Admin | — | — |
| PATCH | `/api/admin/payment-settings` | Admin | settings schema | — |
| GET | `/api/admin/audit-logs` | Admin | `auditLogsQuerySchema` | — |

---

## Cross-Cutting Issues

| Issue | Severity | Routes affected |
|-------|----------|-----------------|
| Rate limiter not deployed | **High** | All `/api/*` |
| Public GET on reviews | Medium | `/api/reviews`, `/api/reviews/booking/[id]` — mitigated by RLS |
| Service role dependency | Medium | browse, booking POST auto-match |
| Inconsistent auth helper | Low | chat/conversations, technicians/* |
| CSP blocks OSM | Medium | Indirect — map pages |

---

## Phase 3 Fixes Applied

| Change | Files |
|--------|-------|
| Replace `profiles!customer_id` with explicit FK names | 8 API routes |
| Shared `select-fragments.ts` | `technician/assignments/*` |

---

## Related

- [API-VALIDATION.md](./API-VALIDATION.md)
- [AUTHORIZATION-TESTS.md](./AUTHORIZATION-TESTS.md)
- [ARCHITECTURE-AUDIT.md](./ARCHITECTURE-AUDIT.md)
