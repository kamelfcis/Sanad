# سند (Sanad) — Roadmap

> Production-grade two-sided marketplace for home services.
> Built with Next.js, Supabase, TailwindCSS, ShadCN UI, React Query, Zustand.

---

## Architecture Overview

```
sanad/
├── docs/                     # Phase documentation
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/           # Login, Register
│   │   ├── (customer)/       # Customer-facing routes
│   │   ├── (technician)/     # Technician-facing routes
│   │   ├── (admin)/          # Admin dashboard
│   │   └── api/              # API routes (route handlers)
│   ├── components/
│   │   ├── ui/               # ShadCN primitives
│   │   └── shared/           # Shared components
│   ├── lib/
│   │   ├── supabase/         # Supabase client + helpers
│   │   ├── storage/          # Supabase Storage utilities
│   │   └── utils/            # General utilities
│   ├── hooks/                # Custom React hooks
│   ├── store/                # Zustand stores
│   └── types/                # TypeScript types
├── supabase/
│   ├── migrations/           # SQL migrations
│   └── seed.sql              # Seed data
└── workers/                  # Cloudflare Workers
```

---

## Phase Summary

| Phase | Name | Est. Effort | Dependencies |
|-------|------|-------------|--------------|
| 0 | Project Setup | Small | None |
| 1 | Authentication & Roles | Medium | Phase 0 |
| 2 | Core Database & Services | Medium | Phase 1 |
| 3 | Customer Booking System | Large | Phase 2 |
| 4 | Technician System | Large | Phase 1, 2 | ✅ |
| 5 | Matching & Assignment Engine | Medium | Phase 3, 4 | ✅ |
| 6 | Real-time Chat System | Medium | Phase 3, 4 | ✅ |
| 7 | Reviews & Ratings | Small | Phase 3, 4 | ✅ |
| 8 | Admin Dashboard | Medium | Phase 1, 2, 3, 4 | ✅ |
| 9 | Production Hardening | Medium | Phase 1-8 |
| 10 | UI/UX Polish | Medium | Phase 1-9 |

---

## Technical Decisions

- **Next.js 14+ App Router** — Server components, route handlers, middleware
- **Supabase** — Auth, PostgreSQL, Realtime, Storage (profile images)
- **Supabase Storage** — File storage (booking images, chat attachments)
- **ShadCN UI** — Accessible, themeable component primitives
- **React Query** — Server state management with cache invalidation
- **Zustand** — Lightweight client state (UI state, modals, filters)
- **TailwindCSS** — Utility-first CSS with design system tokens

---

## Data Flow

```
User → Next.js (Server/Client) → Supabase SDK → Supabase (PostgreSQL)
                                       ↕
                              Supabase Storage (uploads bucket)
                                       ↕
                              Cloudflare Workers (rate limiting)
```

---

## Security Model

- Row Level Security (RLS) on all tables
- Supabase Auth for session management
- Middleware-based route protection
- Rate limiting via Cloudflare Workers
- File upload signed URLs (Supabase Storage)
