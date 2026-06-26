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

## Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | `development` / `production` | Set by framework |
| Sentry DSN | Error monitoring (not wired) | — |

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
