# Error Handling — Sanad Platform

**Audit date:** 2025-06-25

---

## Architecture

```
Browser Error → GlobalErrorHandler (window.onerror, unhandledrejection)
React Render Error → ErrorBoundary (componentDidCatch)
API Error → JSON { error: string | fieldErrors } + HTTP status
Server Log → logger.ts (structured, Sentry-ready)
```

---

## Components

### ErrorBoundary (`src/components/shared/error-boundary.tsx`)

- Class component wrapping app in `layout.tsx`
- Catches React render errors in child tree
- Calls `reportError()` with component stack
- Shows Arabic fallback UI with retry/reload buttons
- Supports custom `fallback` prop

### GlobalErrorHandler (`src/components/shared/global-error-handler.tsx`)

- Client-side `useEffect` registering:
  - `window.onerror` — sync JS errors
  - `unhandledrejection` — async/promise rejections
- Reports via `reportError()` with source metadata
- Renders nothing (null)

### Logger (`src/lib/logger.ts`)

- Levels: `debug`, `info`, `warn`, `error`
- Structured JSON context support
- `debug` suppressed in production
- `reportError(error, context)` for client-side reporting
- Sentry placeholders commented (optional integration)

---

## API Error Format

### Simple errors

```json
{ "error": "Unauthorized" }
```

HTTP codes: `400`, `401`, `403`, `404`, `409`, `500`, `503`

### Validation errors (Zod)

```json
{
  "error": {
    "service_id": ["Invalid service selected"]
  }
}
```

HTTP `400`

### Helpers

| File | Functions |
|------|-----------|
| `src/lib/api/validate.ts` | `parseJsonBody`, `parseSearchParams`, `validationResponse`, `errorResponse` |
| `src/lib/api/auth.ts` | `requireAuth` → 401, `requireAdmin` → 403 |

---

## API Handler Patterns

All 32 route files follow consistent error handling:

1. Auth check → `{ error: 'Unauthorized' }` (401) or `{ error: 'Forbidden' }` (403)
2. Zod validation → field errors (400)
3. Supabase errors → `{ error: message }` (500)
4. Missing service config → 503 (upload)

No stack traces returned to clients.

---

## Client-Side Patterns

Forms using React Hook Form + Zod show field errors from API responses. TanStack Query mutations check `response.ok` and surface errors to toast/UI.

---

## Verification Checklist

- [x] ErrorBoundary in root layout
- [x] GlobalErrorHandler registered
- [x] logger.ts with structured output
- [x] API validation returns consistent 400 format
- [x] Auth errors consistent 401/403
- [x] Upload graceful 503 when service role missing
- [ ] Next.js `error.tsx` / `global-error.tsx` (Phase 10)
- [ ] Sentry integration (optional)

---

## Gaps & Recommendations

| Gap | Severity | Recommendation |
|-----|----------|----------------|
| No `app/error.tsx` | Medium | Add App Router error pages |
| No Sentry wired | Medium | Set DSN + uncomment logger hooks |
| Some routes use `console.error` | Low | Migrate to `logger.error` |
| No correlation IDs | Low | Add request ID middleware |

---

## Build Verification

```bash
npm run build   # ✅ Pass
npm run lint    # ✅ 0 errors
```
