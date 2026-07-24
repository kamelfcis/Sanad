# Environment Variables — Sanad Platform

**Audit date:** 2025-06-25

---

## Required (Production)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key (RPC, signed uploads, admin ops) | `eyJ...` |
| `NEXT_PUBLIC_APP_URL` | Canonical site URL (auth redirects, SEO) | `https://sanad.app` |

---

## File Uploads — Supabase Storage (NOT R2)

Uploads use the **`uploads`** bucket (`supabase/migrations/00013_storage_uploads.sql`).

No R2 or Cloudflare storage env vars are used. Public URLs:

```
{NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/{userId}/...
```

Signed upload URLs require `SUPABASE_SERVICE_ROLE_KEY`. Without it, `/api/upload` returns **503**.

---

## Cloudflare Rate Limiter Worker

| Variable / Config | Location | Description |
|-------------------|----------|-------------|
| KV namespace ID | `workers/rate-limiter/wrangler.toml` | Replace `REPLACE_WITH_KV_NAMESPACE_ID` |
| `RATE_LIMIT_SECRET` | Optional env | Origin verification (defined, not yet enforced) |
| Route binding | Cloudflare dashboard | `*/api/*` → `sanad-rate-limiter` worker |

See `docs/RATE-LIMITING.md` and `docs/RATE-LIMIT-VALIDATION.md`.

---

## App-Level Rate Limiting (proxy)

`src/proxy.ts` applies best-effort IP throttling to `/api/*` (`src/lib/rate-limit/`)
independently of the Cloudflare worker: `/api/auth/*` → 10 req/min/IP, other
`/api/*` → 120 req/min/IP, returning **429** with `Retry-After`.

| Variable | Description | Default |
|----------|-------------|---------|
| `RATE_LIMIT_ENABLED` | Set to `false` to disable the proxy throttle (E2E/local). | enabled |

**Caveat:** counters are in-memory *per runtime instance*, so on multi-instance
serverless hosting this is burst protection only — always also enable the
**Supabase Auth rate limits** (below) and, for hard global limits, deploy the
Cloudflare worker or a shared store (Upstash Redis).

---

## Web Push (VAPID)

Generate a keypair once: `npx web-push generate-vapid-keys`.

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | client + server | Public key used by the browser to subscribe |
| `VAPID_PRIVATE_KEY` | **server only** | Private key — never commit, never `NEXT_PUBLIC_` |
| `VAPID_SUBJECT` | server (optional) | `mailto:` or `https:` contact; defaults to `mailto:admin@sanad.app` |

When unset, `sendPushToUser` returns 0 and push is silently skipped (in-app
notifications still work). Client hook: `src/hooks/use-push-notifications.ts`
(registers `/sw.js`); server: `src/lib/push/web-push.ts`.

---

## Email Notifications (Resend / SendGrid)

Transactional email uses a raw `fetch` provider (no SDK dependency) —
`src/lib/email/index.ts`.

| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_EMAIL_NOTIFICATIONS` | `true` to send emails | `false` |
| `EMAIL_PROVIDER` | `resend` (default) or `sendgrid` | `resend` |
| `RESEND_API_KEY` | Resend API key (server only) | — |
| `SENDGRID_API_KEY` | SendGrid API key (server only) | — |
| `EMAIL_FROM` | From header for Resend, e.g. `Sanad <notifications@sanad.app>` | fallback set |
| `EMAIL_FROM_ADDRESS` | From address for SendGrid | fallback set |

Fires for: `booking_assigned`, `booking_accepted` (confirmed), `booking_completed`,
`technician_approved`, `technician_rejected`, `payment_approved`, `payment_rejected`,
`review_received`. Verify sender domain in the provider before enabling in staging.

---

## Error Monitoring (Sentry or equivalent)

`src/lib/logger.ts` exposes a pluggable `setErrorReporter()` sink; `logger.error`
/`logger.warn` forward to it. To enable Sentry, install the SDK and register the
reporter once at startup (e.g. in `instrumentation.ts`):

```ts
// npm i @sentry/nextjs --legacy-peer-deps   (Next 16 peer ranges)
import * as Sentry from '@sentry/nextjs';
import { setErrorReporter } from '@/lib/logger';

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
  setErrorReporter({
    captureException: (e, ctx) => Sentry.captureException(e, { extra: ctx }),
    captureMessage: (m, ctx) => Sentry.captureMessage(m, { extra: ctx }),
  });
}
```

| Variable | Description | Default |
|----------|-------------|---------|
| `SENTRY_DSN` | Sentry project DSN (server) | — (no-op when unset) |

---

## Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | `development` / `production` | Set by framework |

---

## Graceful Failure for Missing Vars

| Missing var | Behavior |
|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` | App fails at Supabase client init (expected) |
| `SUPABASE_SERVICE_ROLE_KEY` | `/api/upload` → 503; RPC routes use `isServiceRoleConfigured()` check |
| `NEXT_PUBLIC_APP_URL` | OAuth redirects fall back to request `origin` |

`src/lib/supabase/admin.ts`:

- `isServiceRoleConfigured()` — boolean guard before privileged ops
- `createServiceRoleClient()` — throws if keys missing (server-only paths)

---

## Supabase Dashboard Configuration

1. **Site URL** → match `NEXT_PUBLIC_APP_URL`
2. **Redirect URLs** → include `{APP_URL}/api/auth/callback`
3. **Auth rate limits** → enable (30 sign-in / 5 min recommended)
4. **Storage** → verify `uploads` bucket after `supabase db push`

---

## Development Setup

```bash
cp .env.example .env.local
# Fill Supabase keys from Dashboard → Project Settings → API
# Set NEXT_PUBLIC_APP_URL=http://localhost:3000
npx supabase db reset   # migrations + seed
npm run dev
```

---

## Security Notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client (no `NEXT_PUBLIC_` prefix)
- Rotate keys if `.env.local` was ever committed
- Separate Supabase projects for dev/staging/production
- Do not configure R2 — project uses Supabase Storage exclusively

---

## Reference

See `.env.example` in project root.
