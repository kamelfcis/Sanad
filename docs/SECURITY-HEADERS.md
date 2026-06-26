# Security Headers — Sanad Platform

**Audit date:** 2025-06-25  
**Source:** `next.config.ts` via Next.js `headers()`

---

## Active Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | See below | Restricts script/style/image/connect sources |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Blocks MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self), payment=()` | Restricts browser APIs |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS in production |

`X-Powered-By` is disabled via `poweredByHeader: false`.

---

## Content-Security-Policy Directives

```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval'
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://images.unsplash.com
font-src 'self' data:
connect-src 'self' {NEXT_PUBLIC_SUPABASE_URL} wss://*.supabase.co
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
object-src 'none'
```

### Notes

- `'unsafe-inline'` and `'unsafe-eval'` required for Next.js hydration. Tighten with nonces in Phase 10.
- Supabase Storage images served from `*.supabase.co` (uploads bucket).
- Supabase Realtime requires `wss://*.supabase.co` in `connect-src`.
- No R2/Cloudflare storage domains — uploads use Supabase Storage only.

---

## Verification

```bash
curl -I http://localhost:3000
```

Check for all six security headers on every response.

Production: [securityheaders.com](https://securityheaders.com)

---

## Production Checklist

- [x] CSP configured
- [x] X-Frame-Options DENY
- [x] X-Content-Type-Options nosniff
- [x] Referrer-Policy set
- [x] Permissions-Policy set
- [ ] Confirm HSTS appropriate on staging (HTTPS required)
- [ ] Add CSP nonces (Phase 10)

---

## Residual Risk

| Item | Severity | Note |
|------|----------|------|
| CSP unsafe-inline/eval | Medium | Next.js default tradeoff |
| HSTS on localhost | Low | Only meaningful over HTTPS in production |
