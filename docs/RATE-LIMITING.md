# Rate Limiting — Sanad Platform

## Overview

Sanad uses a **Cloudflare Worker** at `workers/rate-limiter/` for edge rate limiting before requests reach the Next.js app. Limits apply per **IP** and per **user** (when `X-User-Id` or `Authorization` header is present).

## Architecture

```
Client → Cloudflare Worker (rate-limiter) → Next.js / Vercel origin
                ↓
           KV Namespace (RATE_LIMIT_KV)
```

## Protected Routes

| Route Pattern | Methods | IP Limit | User Limit | Window |
|---------------|---------|----------|------------|--------|
| `/api/auth/login`, `/api/auth/signup`, `/api/auth/register` | POST | 10 | 5 | 15 min |
| `/api/upload` | POST | 30 | 20 | 1 hour |
| `/api/bookings` | POST | 20 | 10 | 1 hour |
| `/api/bookings/*` | PATCH | 30 | 15 | 1 hour |
| `/api/services` | GET | 60 | 40 | 1 min |
| `/api/admin/technicians` | GET | 40 | 30 | 1 min |
| `/api/chat/conversations/*/messages` | POST | 60 | 30 | 1 min |
| `/api/reviews` | POST | 20 | 10 | 1 hour |
| `/api/admin/*` | ALL | 100 | 80 | 1 min |

Unmatched routes pass through without rate limiting.

## Deployment

1. Create a KV namespace:
   ```bash
   cd workers/rate-limiter
   npx wrangler kv namespace create RATE_LIMIT_KV
   ```

2. Update `wrangler.toml` with the KV namespace ID.

3. Deploy:
   ```bash
   npx wrangler deploy
   ```

4. Route traffic via Cloudflare:
   - Add a route: `sanad.example.com/api/*` → `sanad-rate-limiter`
   - Or use Cloudflare Workers Routes in the dashboard

## Configuration

Edit `RULES` in `workers/rate-limiter/index.ts` to adjust limits. Each rule supports:
- `match`: RegExp for pathname
- `methods`: Optional HTTP method filter
- `ip`: `{ windowSeconds, maxRequests }`
- `user`: Optional per-user limits

## Response Headers

| Header | Description |
|--------|-------------|
| `X-RateLimit-Remaining` | Requests left in current window |
| `Retry-After` | Seconds until window resets (429 only) |

## 429 Response Format

```json
{ "error": "Too many requests. Please try again later." }
```

## Integration with Next.js

For user-based limits, forward the authenticated user ID from middleware:

```typescript
// middleware.ts (future enhancement)
headers.set('x-user-id', user.id);
```

Login/signup routes are client-side Supabase Auth today; rate limiting at the Supabase Auth level is also recommended via Supabase Dashboard → Auth → Rate Limits.

## Local Development

The worker is not required locally. For production, deploy the worker and configure Cloudflare routes before go-live.
