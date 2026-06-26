# Admin Account Setup

## Default bootstrap admin (migration `00021`)

Created by `supabase/migrations/00021_seed_admin_user.sql` when applied to the database.

| Field | Value |
|-------|-------|
| **Email** | `admin@sanad.app` |
| **Password** | `SanadAdmin2025!` |
| **Login URL** | `/auth/login` |
| **Dashboard** | `/admin` |

**Security:** Change this password immediately after first login in any shared or production environment. Do not reuse this password in production.

## Manual admin (alternative)

1. Supabase Dashboard → Authentication → Add user
2. Table Editor → `profiles` → set `role` = `admin` for that user's id

## Google OAuth admin

Set `profiles.role` = `admin` for the Google account's user id in Supabase.
