# Upload Security — Sanad Platform

**Audit date:** 2025-06-25  
**Storage:** Supabase Storage bucket `uploads` (not Cloudflare R2)

---

## Architecture

```
Client → POST /api/upload (auth + Zod) → signed upload URL (service role)
       → PUT to Supabase Storage (bucket MIME + size enforced)
       → Public URL: {SUPABASE_URL}/storage/v1/object/public/uploads/{userId}/...
```

RLS on `storage.objects` restricts writes to `{auth.uid()}/...` paths.

---

## Controls

| Control | Implementation | Status |
|---------|----------------|--------|
| Authentication | `requireAuth()` on `/api/upload` | ✅ |
| Ownership | Path prefix `{userId}/` from session; RLS `uploads_insert_own_folder` | ✅ |
| MIME allowlist | API: `uploadRequestSchema`; bucket: migration 00015 | ✅ |
| Extension mapping | `MIME_EXTENSIONS` in `src/lib/storage/upload.ts` | ✅ |
| Max size | 10 MB — API `fileSize` optional check + bucket `file_size_limit` | ✅ |
| Block other types | Zod enum rejects unknown MIME; bucket rejects at storage layer | ✅ |

---

## Allowed Types

| MIME | Extension | Use case |
|------|-----------|----------|
| `image/jpeg` | `.jpg` | Booking photos, chat images |
| `image/png` | `.png` | Booking photos, chat images |
| `image/webp` | `.webp` | Optimized images |
| `application/pdf` | `.pdf` | Technician verification docs |

**Removed in Phase 9:** `image/heic` (not in security spec; replaced with PDF for documents).

---

## API Route (`src/app/api/upload/route.ts`)

1. `requireAuth` — returns 401 if no session
2. `parseJsonBody(request, uploadRequestSchema)` — validates `fileType`, optional `fileSize`
3. Rejects `fileSize <= 0` with 400
4. `generateUploadUrl(fileType, user.id)` — returns signed URL or 503 if service role not configured

### Request schema

```typescript
{
  fileType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf',
  fileSize?: number  // max 10_485_760
}
```

---

## Storage Layer (`supabase/migrations/00013`, `00015`)

- Bucket: `uploads`, public read
- `file_size_limit`: 10,485,760 bytes (10 MB)
- `allowed_mime_types`: jpeg, png, webp, pdf
- Policies: insert/update/delete only in own folder; public SELECT

---

## Path Generation (`src/lib/storage/upload.ts`)

- Sanitizes user ID (alphanumeric + hyphen)
- Path: `{userId}/{timestamp}-{uuid}.{ext}`
- Extension derived from MIME map (never from client filename)

---

## Graceful Degradation

If `SUPABASE_SERVICE_ROLE_KEY` is missing:

- `isServiceRoleConfigured()` returns false
- `/api/upload` returns **503** with message to contact support
- No signed URLs exposed

---

## Live Verification (2025-06-25, localhost:3000)

| Test | Result |
|------|--------|
| Unauthenticated POST | 401 ✅ |
| Invalid MIME (no auth) | 401 ✅ (auth checked first) |
| Valid MIME without session | 401 ✅ |

---

## Residual Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Public bucket URLs | Low | Obscure paths; auth required to upload |
| No virus scanning | Medium | Add ClamAV or Supabase Edge Function in future |
| Client uploads directly to storage | Low | Signed URL is time-limited; MIME enforced server-side |

---

## Related Files

- `src/lib/validations/upload.ts`
- `src/lib/storage/upload.ts`
- `src/lib/storage/constants.ts`
- `supabase/migrations/00013_storage_uploads.sql`
- `supabase/migrations/00015_upload_mime_hardening.sql`
