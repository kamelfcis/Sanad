# Phase 8: Admin Dashboard

## Objective
Build a comprehensive admin dashboard for platform management, replacing the basic admin layout with a sidebar-based interface and adding full CRUD for services/categories, technician status management, review moderation, booking status overrides, and audit logging.

## Deliverables

### Database Migrations
- **00010**: `audit_logs` table — logs all admin actions with entity_type, entity_id, action, metadata (JSON), and admin_id (FK to profiles). RLS enables admin read/insert.
- **00011**: Add `is_hidden`, `hidden_at`, `hidden_by`, `moderation_note` columns to `reviews` table for soft-hide moderation.

### Admin API Routes (all validated for role='admin')
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/dashboard` | GET | Aggregated platform analytics (counts, trends, top technicians, popular services) |
| `/api/admin/technicians` | GET | Paginated technician list with search |
| `/api/admin/technicians/[id]` | GET | Technician detail with bookings & reviews |
| `/api/admin/technicians/[id]/status` | PATCH | Approve/reject/suspend/reactivate |
| `/api/admin/customers` | GET | Paginated customer list with search + booking counts |
| `/api/admin/customers/[id]` | GET | Customer detail with bookings & reviews |
| `/api/admin/services` | GET/POST | List (with category filter) / Create service |
| `/api/admin/services/[id]` | PATCH/DELETE | Update / Soft-delete service |
| `/api/admin/categories` | GET/POST | List / Create category |
| `/api/admin/categories/[id]` | PATCH/DELETE | Update / Soft-delete category |
| `/api/admin/bookings/[id]/status` | PATCH | Override booking status (with audit) |
| `/api/admin/reviews` | GET | Paginated reviews with hidden filter |
| `/api/admin/reviews/[id]/moderate` | POST | Hide/restore review |
| `/api/admin/audit-logs` | GET | Paginated audit log listing with entity_type/action filters |

### Hooks (`use-admin.ts`)
- `useAdminDashboard`, `useAdminTechniciansList`, `useAdminTechnician`, `useAdminUpdateTechnicianStatus`
- `useAdminCustomers`, `useAdminCustomer`
- `useAdminServices`, `useAdminCreateService`, `useAdminUpdateService`, `useAdminDeleteService`
- `useAdminCategories`, `useAdminCreateCategory`, `useAdminUpdateCategory`, `useAdminDeleteCategory`
- `useAdminUpdateBookingStatus`
- `useAdminReviews`, `useAdminModerateReview`
- `useAdminAuditLogs`

### Layout
- Replaced the simple `Header`-based layout with a collapsible sidebar (9 nav items) + top bar
- Mobile-responsive with hamburger menu + overlay
- `AuthGuard` with `allowedRoles={['admin']}` wraps all admin routes

### Pages (9 new, 2 upgraded)
| Route | Status | Description |
|-------|--------|-------------|
| `/admin` | Upgraded | Dashboard with 8 stat cards, bar chart, revenue table, recent bookings, top technicians |
| `/admin/bookings` | Enhanced | Now shows technician column + cancelled filter |
| `/admin/bookings/[id]` | Enhanced | Status override buttons (mark in_progress/completed/cancel) with reason input, improved layout |
| `/admin/technicians` | NEW | Paginated list with search, status badges, sortable columns |
| `/admin/technicians/[id]` | NEW | Detail with approve/reject/suspend/reactivate actions, profile, bookings, reviews |
| `/admin/customers` | NEW | Paginated list with search and booking counts |
| `/admin/customers/[id]` | NEW | Detail with bookings and reviews |
| `/admin/services` | NEW | Full CRUD with inline form, category select, price/type fields |
| `/admin/categories` | NEW | Full CRUD with inline form |
| `/admin/reviews` | NEW | Moderation with hide/restore, optional note, visible/hidden filter |
| `/admin/audit-logs` | NEW | Paginated audit trail with entity type filter and metadata expand |
| `/admin/settings` | NEW | Platform settings placeholder |
| `/admin/unauthorized` | NEW | Access denied page |

### Admin Route Count
48 routes total (was 32 before Phase 8), 0 TypeScript errors, 0 ESLint errors.

## Verification Checklist
- [x] All API routes validate admin role server-side
- [x] All API routes include audit logging for write operations
- [x] All mutations invalidate relevant query caches
- [x] Dashboard fetches real aggregated data (not client-side filtering)
- [x] Technician status transitions are validated (approve/reject/suspend/reactivate)
- [x] Booking status updates require valid target status
- [x] Review moderation uses soft-hide (is_hidden column)
- [x] Services/categories use soft-delete (`is_active = false`)
- [x] Sidebar is collapsible and responsive (mobile + desktop)
- [x] Pagination with page info and prev/next on all list pages
- [x] Loading states (Skeleton), error states, empty states handled everywhere
- [x] Build passes with 0 TypeScript errors and 0 ESLint errors
- [x] 12 pre-existing ESLint warnings (from earlier phases) remain unchanged
