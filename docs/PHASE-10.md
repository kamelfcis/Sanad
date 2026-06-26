# Phase 10 — Real-Time Notifications System

## Overview

Phase 10 adds a full notification stack: database storage with RLS, Supabase Realtime for live updates, REST API, notification bell UI, dedicated `/notifications` page, server-side event triggers, and an email abstraction layer (disabled by default).

## Schema

**Migration:** `supabase/migrations/00018_notifications.sql`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → `profiles.id` |
| `type` | TEXT | Event type (see below) |
| `title` | TEXT | Short heading (Arabic) |
| `message` | TEXT | Body text |
| `entity_type` | TEXT | `booking`, `chat`, `review`, `technician`, `assignment` |
| `entity_id` | UUID | Related entity |
| `is_read` | BOOLEAN | Default `false` |
| `metadata` | JSONB | Extra context |
| `created_at` | TIMESTAMPTZ | Creation time |

**Indexes:** `user_id`, partial `(user_id, is_read) WHERE NOT is_read`, `(user_id, created_at DESC)`

**RLS:**
- Users: SELECT / UPDATE / DELETE own rows
- Admin: full access via `is_admin()`
- INSERT: service role only (server-side `notification-service`)

**Realtime:** `ALTER PUBLICATION supabase_realtime ADD TABLE notifications`

## Notification Types

| Type | Trigger |
|------|---------|
| `booking_assigned` | Auto-match or admin assign |
| `booking_accepted` | Technician accept / admin assign |
| `booking_started` | Status → `in_progress` |
| `booking_completed` | Status → `completed` |
| `booking_cancelled` | Status → `cancelled` |
| `chat_message` | New chat message |
| `review_received` | Customer submits review |
| `technician_approved` | Admin approve / reactivate |
| `technician_rejected` | Admin reject |
| `technician_suspended` | Admin suspend |
| `technician_application` | New technician registration |

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  API Routes     │────▶│  events.ts helpers   │────▶│ notification-   │
│  (bookings,     │     │  notifyBooking*,     │     │ service.ts      │
│   chat, etc.)   │     │  notifyChat*, etc.   │     │ (service role)  │
└─────────────────┘     └──────────────────────┘     └────────┬────────┘
                                                               │
                    ┌──────────────────────────────────────────┼──────────┐
                    ▼                                          ▼          ▼
            ┌───────────────┐                          ┌────────────┐  ┌────────┐
            │  PostgreSQL   │                          │  Realtime  │  │ Email  │
            │ notifications │                          │  channel   │  │ (opt)  │
            └───────┬───────┘                          └─────┬──────┘  └────────┘
                    │                                        │
                    ▼                                        ▼
            ┌───────────────┐                          ┌────────────┐
            │ GET /api/     │                          │ use-       │
            │ notifications │◀─────────────────────────│ notifications│
            └───────────────┘                          └─────┬──────┘
                                                             ▼
                                                    ┌────────────────┐
                                                    │ NotificationBell│
                                                    │ /notifications  │
                                                    └────────────────┘
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications` | Paginated list (filters: `is_read`, `type`, `search`) |
| PATCH | `/api/notifications/[id]` | Mark single as read |
| DELETE | `/api/notifications/[id]` | Delete single |
| POST | `/api/notifications/read-all` | Mark all unread as read |
| GET | `/api/notifications/unread-count` | Unread badge count |
| DELETE | `/api/notifications/bulk` | Bulk delete by IDs |

All routes require authentication. Validation via `src/lib/validations/notifications.ts`.

## Realtime

**Hook:** `src/hooks/use-notifications.ts`

- Channel: `notifications:{userId}`
- Filters: `user_id=eq.{userId}` on INSERT and UPDATE
- Dedupes INSERT events by notification `id` (ref set)
- Invalidates React Query caches on change

**Performance:**
- Paginated API queries (`limit`/`offset`, max 100)
- Partial index on unread rows
- Single channel per user session
- No polling (Realtime primary; queries on invalidation)

## UI Components

| Component | Location |
|-----------|----------|
| `NotificationBell` | Header, Admin header, Public navbar (logged in) |
| `NotificationsPageClient` | `/notifications` |

Features: unread badge, dropdown preview (8 items), mark read / mark all, infinite scroll page, search, read/unread tabs, bulk delete.

## Email Abstraction

**Module:** `src/lib/email/index.ts`

- `sendEmailNotification()` — called from event helpers
- Feature flag: `ENABLE_EMAIL_NOTIFICATIONS=true` (default off)
- Providers: Resend (default) or SendGrid via `EMAIL_PROVIDER=sendgrid`
- Triggered types: `booking_assigned`, `booking_completed`, `review_received`, `technician_approved`

**Env vars:**
```
ENABLE_EMAIL_NOTIFICATIONS=false
EMAIL_PROVIDER=resend
RESEND_API_KEY=
SENDGRID_API_KEY=
EMAIL_FROM=Sanad <notifications@sanad.app>
```

## Event Wiring

| Route | Events |
|-------|--------|
| `POST /api/bookings` | `booking_assigned` → matched technicians |
| `POST /api/admin/bookings/[id]/assign` | `booking_assigned`, `booking_accepted` |
| `PATCH /api/admin/bookings/[id]/status` | status change notifications |
| `PATCH /api/bookings/[id]` | status change notifications |
| `POST /api/technician/assignments/[id]/respond` | `booking_accepted` |
| `POST /api/chat/conversations/[id]/messages` | `chat_message` |
| `POST /api/reviews` | `review_received` |
| `PATCH /api/admin/technicians/[id]/status` | technician status notifications |
| `POST /api/auth/register-technician` | `technician_application` → all admins |

## Push Notifications

See `docs/PUSH-NOTIFICATIONS.md` — foundation only, no implementation in Phase 10.

## Deployment Checklist

1. Run migration `00018_notifications.sql` on Supabase
2. Verify Realtime enabled for `notifications` table in dashboard
3. Optionally set email env vars
4. Test: create booking → technician sees bell badge → realtime update

## Files Added

```
supabase/migrations/00018_notifications.sql
src/types/notifications.ts
src/lib/validations/notifications.ts
src/lib/services/notification-service.ts
src/lib/notifications/events.ts
src/lib/email/index.ts
src/hooks/use-notifications.ts
src/components/notifications/notification-bell.tsx
src/components/notifications/notifications-page-client.tsx
src/app/notifications/layout.tsx
src/app/notifications/page.tsx
src/app/api/notifications/route.ts
src/app/api/notifications/[id]/route.ts
src/app/api/notifications/read-all/route.ts
src/app/api/notifications/unread-count/route.ts
src/app/api/notifications/bulk/route.ts
docs/PUSH-NOTIFICATIONS.md
docs/PHASE-10.md
```
