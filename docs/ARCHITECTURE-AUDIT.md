  # Sanad — Architecture Audit (Phase 1)

  **Audit date:** 2025-06-26  
  **Scope:** Folder structure, Next.js app, Supabase, auth, middleware, APIs, DB, realtime, payments, notifications, chat, booking  
  **Method:** Code inspection of `src/`, `supabase/migrations/`, `next.config.ts`, `src/proxy.ts`

  ---

  ## Executive Summary

  Sanad is a **Next.js 16 App Router** marketplace (Arabic RTL) connecting customers with home-service technicians. Backend is **Supabase** (Auth, Postgres + RLS, Storage, Realtime). Business logic lives in **API route handlers** (`src/app/api/`) with **Zod validation** and shared auth helpers. No separate BFF or microservices layer.

  **Stack:** Next.js 16.2.9 · React 19 · Supabase SSR · TanStack Query · Zustand · Leaflet/OSM maps · Tailwind 4

  ---

  ## Folder Structure

  ```
  Sanad/
  ├── src/
  │   ├── app/                    # App Router pages + API routes
  │   │   ├── api/                # 49 route.ts files (~56 HTTP handlers)
  │   │   ├── admin/              # Admin dashboard (AuthGuard + middleware)
  │   │   ├── auth/               # Login, register, OAuth callback pages
  │   │   ├── customer/           # Bookings, chat, legacy services redirect
  │   │   ├── technician/         # Jobs, profile, chat
  │   │   ├── services/           # Public browse + map
  │   │   ├── notifications/      # Shared in-app notifications
  │   │   └── settings/           # Profile + security (logout)
  │   ├── components/             # UI (~100 files): landing, shared, maps, payments
  │   ├── hooks/                  # 15 data-fetch hooks (React Query wrappers)
  │   ├── lib/                    # Supabase clients, validations, auth, geo, notifications
  │   ├── store/                  # Zustand auth store
  │   └── types/                  # Shared TS types
  ├── supabase/
  │   └── migrations/             # 21 SQL migrations (00001–00021)
  ├── workers/rate-limiter/       # Cloudflare worker (not deployed)
  └── docs/                       # Phase docs + audits
  ```

  ---

  ## Next.js App Architecture

  ```mermaid
  flowchart TB
    subgraph Client
      Pages[App Router Pages]
      Hooks[React Query Hooks]
      Store[Zustand auth-store]
      Guard[AuthGuard client]
    end

    subgraph Edge
      Proxy[src/proxy.ts]
      MW[lib/supabase/middleware.ts]
    end

    subgraph Server
      API[src/app/api/* route handlers]
      SBServer[createServerSupabaseClient]
      SBAdmin[createServiceRoleClient]
    end

    subgraph Supabase
      Auth[Supabase Auth]
      DB[(Postgres + RLS)]
      RT[Realtime]
      Storage[Storage uploads bucket]
    end

    Pages --> Hooks
    Hooks --> API
    Pages --> Guard
    Proxy --> MW
    MW --> Auth
    API --> SBServer
    API --> SBAdmin
    SBServer --> DB
    SBAdmin --> DB
    SBServer --> Storage
    Pages --> RT
    Store --> Auth
  ```

  | Layer | Responsibility |
  |-------|----------------|
  | **Pages** | Role-scoped UI; server/client components mixed |
  | **Hooks** | `use-bookings`, `use-chat`, `use-admin`, etc. — fetch `/api/*` |
  | **API routes** | Auth check, Zod parse, Supabase queries, side effects (notifications) |
  | **Middleware** | Session refresh, role routing, technician onboarding gate |
  | **Service role** | Browse technicians, auto-match RPC, direct assignment inserts |

  **Routing:** 42 page routes + 66 build outputs (API + static). Public landing at `/`, browse at `/services`. Legacy `/customer/services` redirects to `/services` in middleware.

  ---

  ## Authentication & Session

  | Component | Path | Role |
  |-----------|------|------|
  | Middleware | `src/lib/supabase/middleware.ts` | Cookie session refresh; role redirects; strips/spoof-protects `x-user-id` |
  | Proxy entry | `src/proxy.ts` | Next.js 16 proxy wrapper (replaces root `middleware.ts`) |
  | Client guard | `src/components/shared/auth-guard.tsx` | Role check on admin/customer/technician layouts |
  | Auth store | `src/store/auth-store.ts` | User + profile hydration |
  | Logout | `src/lib/auth/logout.ts`, `POST /api/auth/signout` | Local/global scope |
  | Idle timeout | `src/hooks/useIdleLogout.ts`, `session-warning.tsx` | Auto logout + warning modal |
  | OAuth | `src/app/api/auth/callback/route.ts` | Google redirect handler |

  ```mermaid
  sequenceDiagram
    participant U as User
    participant P as proxy.ts
    participant M as middleware.ts
    participant S as Supabase Auth
    participant Page as Protected Page

    U->>P: Request /customer/bookings
    P->>M: updateSession()
    M->>S: getUser() via cookies
    alt No session
      M-->>U: Redirect /auth/login?next=...
    else Wrong role
      M-->>U: Redirect /auth/login or role home
    else OK
      M-->>Page: NextResponse + trusted x-user-id
    end
  ```

  **Technician onboarding:** Incomplete profiles redirected to `/auth/register-technician?complete=1` until `isTechnicianProfileComplete()` passes (national ID, governorate, photos, ≥1 skill).

  ---

  ## Database Schema (21 migrations)

  | Migration | Domain |
  |-----------|--------|
  | 00001 | `profiles` (roles: customer, technician, admin) |
  | 00002–00003 | `service_categories`, `services` |
  | 00004 | `bookings`, `booking_images`, status enum |
  | 00005–00006 | `technician_profiles`, `technician_skills` |
  | 00007 | `booking_assignments`, `match_technicians_for_booking` RPC |
  | 00008 | `chat_conversations`, `chat_messages` + accept trigger |
  | 00009–00011 | `reviews`, moderation |
  | 00010 | `admin_audit_logs` |
  | 00012–00016 | RPC hardening, storage, profiles/reviews RLS fixes |
  | 00017–00020 | Technician registration fields, notifications, payments, location |
  | 00021 | Admin seed user |

  **Core relationships:**

  ```mermaid
  erDiagram
    profiles ||--o{ bookings : customer_id
    profiles ||--o{ bookings : technician_id
    services ||--o{ bookings : service_id
    bookings ||--o{ booking_assignments : booking_id
    profiles ||--o{ booking_assignments : technician_id
    bookings ||--o| chat_conversations : booking_id
    chat_conversations ||--o{ chat_messages : conversation_id
    bookings ||--o| payments : booking_id
    bookings ||--o| reviews : booking_id
    profiles ||--o{ notifications : user_id
  ```

  **RLS:** All core tables RLS-enabled. Admin ops use `is_admin()` policies. Service role bypasses RLS for browse + matching.

  ---

  ## Booking Flow

  Two paths (see [DIRECT-BOOKING.md](./DIRECT-BOOKING.md)):

  ```mermaid
  flowchart TD
    A[POST /api/bookings] --> B{technician_id?}
    B -->|Yes| C[Validate verified + available + skill]
    C --> D[Insert booking status=matched]
    D --> E[Single booking_assignment pending]
    E --> F[Notify selected technician]
    B -->|No| G[Insert booking status=pending]
    G --> H[RPC match_technicians_for_booking]
    H --> I[Up to 3 assignments pending]
    I --> J[Notify matched technicians]
    K[Technician accepts] --> L[POST assignments/id/respond accept]
    L --> M[booking status=accepted, technician_id set]
    M --> N[DB trigger creates chat_conversation]
  ```

  | Status | Meaning |
  |--------|---------|
  | `pending` | Created, awaiting match |
  | `matched` | Assignments sent (direct book sets immediately) |
  | `accepted` | Technician assigned; chat enabled |
  | `in_progress` / `completed` | Job lifecycle |
  | `cancelled` / `disputed` | Terminal |

  ---

  ## API Surface (49 route files)

  Grouped by domain:

  | Domain | Routes | Auth |
  |--------|--------|------|
  | Auth | callback, signout, register-technician, complete-technician-registration | Mixed |
  | Public catalog | categories, services, technicians/browse, technicians/[id] | Public (browse needs service role) |
  | Customer | bookings, bookings/[id], payment, reviews, upload | `requireAuth` |
  | Technician | profile, skills, assignments, bookings | `requireAuth` + RLS |
  | Chat | conversations, messages, read | `requireAuth` |
  | Notifications | CRUD, bulk, unread-count | `requireAuth` |
  | Admin | dashboard, CRUD for all entities, payments approve/reject | `requireAuth` + `requireAdmin` |

  Full matrix: [API-AUDIT.md](./API-AUDIT.md)

  ---

  ## Realtime

  | Feature | Implementation |
  |---------|----------------|
  | Chat messages | Supabase Realtime subscription on `chat_messages` (client hooks) |
  | Notifications | `00018_notifications.sql` — table + triggers; bell component subscribes |
  | Booking updates | Polling via React Query refetch (no dedicated realtime channel) |

  ---

  ## Payments (Manual Verification)

  | Piece | Location |
  |-------|----------|
  | Schema | `00019_payments.sql` — InstaPay / Vodafone Cash enum |
  | Customer submit | `POST /api/bookings/[id]/payment` + upload screenshot |
  | Admin approve/reject | `PATCH /api/admin/payments/[id]/approve|reject` |
  | Settings | `GET/PATCH /api/admin/payment-settings` |
  | UI | `/customer/bookings/[id]/payment`, `/admin/payments` |

  No payment gateway integration — manual screenshot verification workflow.

  ---

  ## Notifications

  | Piece | Location |
  |-------|----------|
  | DB | `notifications` table + triggers on booking/review events |
  | API | `/api/notifications/*` |
  | Events | `src/lib/notifications/events.ts` — in-app insert + email stub |
  | Email | `src/lib/email/index.ts` — **disabled by default** (`ENABLE_EMAIL_NOTIFICATIONS=false`) |

  ---

  ## Chat

  | Piece | Location |
  |-------|----------|
  | Schema | `00008_chat.sql` |
  | Conversation list | `GET /api/chat/conversations` |
  | Messages | `GET/POST /api/chat/conversations/[id]/messages` |
  | Read receipts | `PUT /api/chat/conversations/[id]/read` |
  | UI | Customer + technician chat pages; shared `chat-room.tsx` |

  Chat conversation auto-created when booking → `accepted` (DB trigger).

  ---

  ## Storage & Uploads

  - Bucket: `uploads` (`00013_storage_uploads.sql`)
  - API: `POST /api/upload` — auth required, MIME hardening (`00015`)
  - Used for: booking images, ID photos, payment screenshots

  ---

  ## Maps & Geo

  - **Leaflet + OpenStreetMap** (not Google Maps)
  - Components: `map-picker`, `technicians-map`, `booking-location-picker`
  - Geo lib: `src/lib/geo/` — haversine, geocode, governorate centroids
  - Browse API: distance when lat/lng provided; centroid fallback otherwise
  - **CSP gap:** `next.config.ts` missing OSM tile/nominatim domains — maps may fail under production CSP

  ---

  ## Rate Limiting & Security Headers

  | Item | Status |
  |------|--------|
  | Cloudflare worker | Code in `workers/rate-limiter/` — **not deployed** |
  | CSP | Strict; missing OSM domains |
  | HSTS, X-Frame-Options | Configured in `next.config.ts` |
  | `x-user-id` | Middleware strips client value; sets trusted ID from session |

  ---

  ## Deployment Topology (intended)

  ```mermaid
  flowchart LR
    User --> CF[Cloudflare optional]
    CF --> Vercel[Next.js host]
    Vercel --> Supabase[Supabase project]
    CF --> Worker[Rate limiter worker - NOT DEPLOYED]
  ```

  **Gaps:** No CI/CD, no Dockerfile, no monitoring wired to `logger.ts`.

  ---

  ## Related Documentation

  - [API-AUDIT.md](./API-AUDIT.md) — Route-level auth/validation matrix
  - [DIRECT-BOOKING.md](./DIRECT-BOOKING.md) — Direct technician selection flow
  - [TEST-WORKFLOW.md](./TEST-WORKFLOW.md) — Manual QA playbook
  - [LAUNCH-AUDIT.md](./LAUNCH-AUDIT.md) — Feature/security/production synthesis
  - [RLS-AUDIT.md](./RLS-AUDIT.md) — Row-level security review
