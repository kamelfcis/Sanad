# Phase 9 — Production Hardening

## Goal
Security audit, RLS policy verification, Cloudflare Worker rate limiting, performance optimization.

---

## Tasks

### 9.1 RLS Policy Audit
Review every table:
- `profiles` — SELECT own, UPDATE own; admin SELECT all
- `service_categories` — PUBLIC SELECT active
- `services` — PUBLIC SELECT active
- `bookings` — customer SELECT/INSERT own; assigned tech SELECT; admin all
- `booking_images` — customer own, assigned tech
- `booking_assignments` — related tech + customer
- `chat_messages` — participants only
- `reviews` — INSERT own completed booking; public SELECT
- `technician_profiles` — own manage; public read verified
- `technician_skills` — own manage; public read active

Write and verify RLS policies for ALL tables. Test bypass scenarios.

### 9.2 Cloudflare Worker — Rate Limiting
```
workers/rate-limiter/
├── wrangler.toml
├── src/
│   ├── index.ts
│   └── utils.ts
```

- Rate limit by IP: 100 req/min for general, 10 req/min for auth
- Rate limit by user ID: 30 bookings/hour
- Return 429 with Retry-After header
- Deploy to Cloudflare

### 9.3 API Route Security
- All route handlers validate session
- Input validation with Zod on all public endpoints
- CSRF protection
- SQL injection (already prevented by Supabase SDK)
- File upload size limits (10MB max per file)

### 9.4 Performance Optimization
- Next.js: server components where possible
- React Query: stale times, prefetching
- Images: next/image with remote patterns
- Supabase: efficient queries with `select()` specificity
- Pagination: infinite scroll for chat, bookings list
- Indexes on foreign keys + frequently queried columns

### 9.5 Security Headers
```json
{
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=()"
}
```

### 9.6 Error Handling
- Global error boundary
- API error responses consistent format
- Client-side error logging
- 404 pages for all segments

---

## Database Indexes
```sql
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_technician_id ON bookings(technician_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_chat_messages_booking_id ON chat_messages(booking_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_reviews_technician_id ON reviews(technician_id);
CREATE INDEX idx_technician_skills_technician_id ON technician_skills(technician_id);
CREATE INDEX idx_technician_skills_service_id ON technician_skills(service_id);
```

---

## Checklist

- [ ] RLS policies on ALL tables verified
- [ ] Rate limiter deployed (Cloudflare Worker)
- [ ] All API routes validate input
- [ ] File upload size limited
- [ ] Indexes created
- [ ] Security headers set
- [ ] Error boundaries implemented
- [ ] 404 pages for unknown routes

## Done Definition
- [ ] Unauthenticated request to protected endpoint → 401
- [ ] Authenticated user accesses another user's data → 403
- [ ] Rate limit exceeded → 429
- [ ] All security headers present in response
