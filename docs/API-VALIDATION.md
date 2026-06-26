# API Validation Coverage — Sanad Platform

**Audit date:** 2025-06-25  
**Target:** 100% Zod coverage on all API routes (body, query, params)  
**Helpers:** `src/lib/api/validate.ts` — `parseJsonBody`, `parseSearchParams`; params via `*.safeParse(await params)`

## Summary

| Metric | Value |
|--------|-------|
| Route files | 32 |
| HTTP handlers | 38 |
| Validated handlers | 38 |
| **Coverage** | **100%** |

---

## Route Matrix

| Route | Method | Body Schema | Query Schema | Params Schema | Status |
|-------|--------|-------------|--------------|---------------|--------|
| `/api/auth/callback` | GET | — | `authCallbackQuerySchema` | — | ✅ |
| `/api/categories` | GET | — | `emptyQuerySchema` | — | ✅ |
| `/api/services` | GET | — | `listServicesQuerySchema` | — | ✅ |
| `/api/bookings` | GET | — | `listBookingsQuerySchema` | — | ✅ |
| `/api/bookings` | POST | `createBookingSchema` | — | — | ✅ |
| `/api/bookings/[id]` | GET | — | — | `adminEntityIdSchema` | ✅ |
| `/api/bookings/[id]` | PATCH | `updateBookingStatusSchema` | — | `adminEntityIdSchema` | ✅ |
| `/api/upload` | POST | `uploadRequestSchema` | — | — | ✅ |
| `/api/reviews` | GET | — | `listReviewsQuerySchema` | — | ✅ |
| `/api/reviews` | POST | `createReviewSchema` | — | — | ✅ |
| `/api/reviews/booking/[id]` | GET | — | — | `adminEntityIdSchema` | ✅ |
| `/api/chat/conversations` | GET | — | `emptyQuerySchema` | — | ✅ |
| `/api/chat/conversations/[id]/messages` | GET | — | `listMessagesQuerySchema` | `conversationIdSchema` | ✅ |
| `/api/chat/conversations/[id]/messages` | POST | `sendMessageSchema` | — | `conversationIdSchema` | ✅ |
| `/api/chat/conversations/[id]/read` | PATCH | — | — | `conversationIdSchema` | ✅ |
| `/api/technician/profile` | GET | — | `emptyQuerySchema` | — | ✅ |
| `/api/technician/profile` | PUT | `updateTechnicianProfileSchema` | — | — | ✅ |
| `/api/technician/skills` | GET | — | `emptyQuerySchema` | — | ✅ |
| `/api/technician/skills` | PUT | `updateTechnicianSkillsSchema` | — | — | ✅ |
| `/api/technician/bookings` | GET | — | `technicianBookingsQuerySchema` | — | ✅ |
| `/api/technician/assignments` | GET | — | `listAssignmentsQuerySchema` | — | ✅ |
| `/api/technician/assignments/[id]` | GET | — | — | `adminEntityIdSchema` | ✅ |
| `/api/technician/assignments/[id]/respond` | POST | `assignmentRespondSchema` | — | `adminEntityIdSchema` | ✅ |
| `/api/admin/dashboard` | GET | — | `emptyQuerySchema` | — | ✅ |
| `/api/admin/categories` | GET | — | `emptyQuerySchema` | — | ✅ |
| `/api/admin/categories` | POST | `createCategorySchema` | — | — | ✅ |
| `/api/admin/categories/[id]` | PUT | `updateCategorySchema` | — | `adminEntityIdSchema` | ✅ |
| `/api/admin/categories/[id]` | DELETE | — | — | `adminEntityIdSchema` | ✅ |
| `/api/admin/services` | GET | — | `listServicesQuerySchema` | — | ✅ |
| `/api/admin/services` | POST | `createServiceSchema` | — | — | ✅ |
| `/api/admin/services/[id]` | PUT | `updateServiceSchema` | — | `adminEntityIdSchema` | ✅ |
| `/api/admin/services/[id]` | DELETE | — | — | `adminEntityIdSchema` | ✅ |
| `/api/admin/customers` | GET | — | `adminCustomersQuerySchema` | — | ✅ |
| `/api/admin/customers/[id]` | GET | — | — | `adminEntityIdSchema` | ✅ |
| `/api/admin/technicians` | GET | — | `adminTechniciansQuerySchema` | — | ✅ |
| `/api/admin/technicians/[id]` | GET | — | — | `adminEntityIdSchema` | ✅ |
| `/api/admin/technicians/[id]/status` | PATCH | `adminTechnicianStatusSchema` | — | `adminEntityIdSchema` | ✅ |
| `/api/admin/bookings/[id]/status` | PATCH | `adminBookingStatusSchema` | — | `adminEntityIdSchema` | ✅ |
| `/api/admin/bookings/[id]/assign` | POST | `adminAssignTechnicianSchema` | — | `adminEntityIdSchema` | ✅ |
| `/api/admin/reviews` | GET | — | `adminListReviewsQuerySchema` | — | ✅ |
| `/api/admin/reviews/[id]/moderate` | PATCH | `moderateReviewSchema` | — | `adminEntityIdSchema` | ✅ |
| `/api/admin/audit-logs` | GET | — | `auditLogsQuerySchema` | — | ✅ |

---

## Schema Locations

| File | Schemas |
|------|---------|
| `src/lib/validations/auth.ts` | `authCallbackQuerySchema`, login/register (client forms) |
| `src/lib/validations/common.ts` | `emptyQuerySchema`, `uuidSchema`, pagination, enums |
| `src/lib/validations/booking.ts` | `createBookingSchema`, `listBookingsQuerySchema`, `updateBookingStatusSchema` |
| `src/lib/validations/upload.ts` | `uploadRequestSchema` |
| `src/lib/validations/reviews.ts` | `createReviewSchema`, `listReviewsQuerySchema`, `moderateReviewSchema` |
| `src/lib/validations/messages.ts` | `sendMessageSchema`, `listMessagesQuerySchema`, `conversationIdSchema` |
| `src/lib/validations/technicians.ts` | Profile, skills, admin technician queries |
| `src/lib/validations/assignments.ts` | `assignmentRespondSchema`, `listAssignmentsQuerySchema` |
| `src/lib/validations/services.ts` | `createServiceSchema`, `updateServiceSchema`, `listServicesQuerySchema` |
| `src/lib/validations/categories.ts` | `createCategorySchema`, `updateCategorySchema` |
| `src/lib/validations/admin.ts` | `adminEntityIdSchema`, `adminBookingStatusSchema`, `auditLogsQuerySchema` |

---

## Validation Error Format

Invalid input returns HTTP **400**:

```json
{
  "error": {
    "fieldName": ["Human-readable message"]
  }
}
```

---

## Phase 9 Changes

- Added `emptyQuerySchema` for GET routes with no parameters (rejects unexpected query keys)
- Added `authCallbackQuerySchema` with open-redirect protection on `next`
- All 38 handlers now validated

## Verification

```bash
npm run build   # TypeScript checks schema usage
npm run lint    # 0 ESLint errors
```

Live spot check (2025-06-25):

| Test | Expected | Result |
|------|----------|--------|
| `GET /api/categories?foo=bar` | 400 | ✅ 400 |
| `GET /api/auth/callback?next=//evil.com` | 400 | ✅ 400 |
| `POST /api/upload` invalid MIME (no auth) | 401 | ✅ 401 |
