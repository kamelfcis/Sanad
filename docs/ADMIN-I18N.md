# Admin Dashboard Internationalization

Admin-only i18n for `/admin/**` with Arabic default and instant English toggle. Public customer pages and auth routes are unchanged.

## Architecture

| Module | Role |
|--------|------|
| `src/locales/ar/admin.json` | Arabic dictionary (default) |
| `src/locales/en/admin.json` | English dictionary (1:1 structure) |
| `src/lib/i18n/admin/store.ts` | Zustand store: locale, dir, hydrate, setLocale |
| `src/lib/i18n/admin/context.tsx` | `AdminI18nProvider` — syncs `html lang/dir`, restores on unmount |
| `src/lib/i18n/admin/use-admin-t.ts` | Re-exports `useAdminT`, `useAdminI18nOptional`, provider |
| `src/lib/i18n/admin/format.ts` | `Intl` date/number/currency formatters (`ar-EG` / `en-US`) |
| `src/lib/i18n/admin/translate-error.ts` | Maps `ADMIN_*` codes and legacy English errors to `errors.api.*` |

### Persistence

- Cookie: `sanad_admin_locale` (`path=/admin`, 1 year)
- Mirror: `localStorage` key `sanad_admin_locale`
- Instant switch: client store update only (no page reload)

### Usage

```tsx
const { t, locale, dir, setLocale, formatDate, formatCurrency } = useAdminT();
t('dashboard.title');
t('common.pageOf', { page: 1, totalPages: 5, total: 42 });
```

Interpolation uses `{{key}}` placeholders.

## RTL / LTR rules

- Admin root container sets `dir={dir}` from locale store.
- Sidebar: `right-0` + `border-s` in RTL; `left-0` + `border-e` in LTR.
- Collapse chevrons flip with direction.
- Header actions use logical `ms-auto`.
- Tables: `text-left` in LTR where needed.
- `AdminI18nProvider` sets `document.documentElement.lang/dir` while mounted; restores `ar`/`rtl` on exit.

## Language toggle

`src/components/admin/admin-language-toggle.tsx` in admin header — switches between English and العربية.

## Migrated pages (16 + unauthorized)

| Page | File |
|------|------|
| Dashboard | `src/app/admin/page.tsx` |
| Bookings list/detail | `src/app/admin/bookings/page.tsx`, `[id]/page.tsx` |
| Customers list/detail | `src/app/admin/customers/page.tsx`, `[id]/page.tsx` |
| Technicians list/detail | `src/app/admin/technicians/page.tsx`, `[id]/page.tsx` |
| Categories | `src/app/admin/categories/page.tsx` |
| Services | `src/app/admin/services/page.tsx` |
| Reviews | `src/app/admin/reviews/page.tsx` |
| Payments | `src/app/admin/payments/page.tsx` |
| Settings | `src/app/admin/settings/page.tsx` |
| Hero slides | `src/app/admin/hero-slides/page.tsx` |
| Audit logs | `src/app/admin/audit-logs/page.tsx` |
| Unauthorized | `src/app/admin/unauthorized/page.tsx` |
| Layout | `src/app/admin/layout.tsx` |

## Shared components (admin context)

| Component | Behavior |
|-----------|----------|
| `UserNav` | Uses `useAdminI18nOptional()` when `pathname.startsWith('/admin')` |
| `NotificationBell` | `variant="admin"` + admin provider → `notifications.*` keys |
| `LogoutModal` | Translates when inside `AdminI18nProvider` |
| `PaymentStatusBadge` | `context="admin"` → `payments.status.*` |
| `BookingStatus` | `context="admin"` → `bookingStatus.*` |

## Validation & errors

- `src/lib/validations/admin-schemas.ts` — Zod factories with `t('validation.*')` messages
- `src/hooks/use-admin.ts`, `src/hooks/use-payments.ts` — throw `ADMIN_*` error codes
- UI surfaces errors via `translateAdminError(message, t)`

## Adding translations for a new admin page

1. Add keys to both `src/locales/ar/admin.json` and `src/locales/en/admin.json` (same structure).
2. Import `useAdminT` in the page (layout already wraps with `AdminI18nProvider`).
3. Replace UI strings with `t('namespace.key')`.
4. Use `formatDate` / `formatDateTime` instead of `date-fns` in admin.
5. Use `translateAdminError` for hook/API errors.

## Remaining hardcoded strings

Target: zero admin UI chrome strings. Acceptable exceptions:

- User-generated content (`name_ar`, comments, audit metadata JSON)
- Icon keys in hero slide dropdown (technical identifiers)
- Payment amount currency suffix `EGP` (data format)
- Platform default values in settings form state (`Sanad`, email placeholder)

## E2E verification

```bash
npm run test:e2e -- e2e/admin-i18n.spec.ts
```

Screenshots:

- `docs/e2e-screenshots/admin-i18n-ar.png`
- `docs/e2e-screenshots/admin-i18n-en.png`

Admin login: `admin@sanad.app` / `SanadAdmin2025!` (see `docs/ADMIN-SETUP.md`).

## Quality gates

```bash
npm run lint
npm run build
npm run test:e2e -- e2e/admin-i18n.spec.ts
```
