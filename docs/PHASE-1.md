# Phase 1 — Authentication & Roles

## Goal
Users can sign up / log in with Google or email, get assigned a role (customer, technician, admin), and access protected routes.

---

## Database Changes

### Table: `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'technician', 'admin')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger: auto-create profile on signup
-- Trigger: set role via metadata
```

### RLS Policies
- `profiles`: SELECT own row, INSERT own row, UPDATE own row
- Admin can SELECT all

---

## Features

### 1.1 Supabase Auth Configuration
- Enable Google OAuth in Supabase dashboard
- Enable email/password auth
- Configure redirect URLs

### 1.2 Signup Flow
- OAuth with Google → auto-create profile → redirect based on role
- Email signup → create profile → redirect to role selection → redirect
- Role selection page after first email login

### 1.3 Login Flow
- Google OAuth button
- Email/password form
- Auth UI with ShadCN styling (custom theme, not Supabase default)

### 1.4 Role Assignment
- On signup via Google: store role from metadata or default 'customer'
- On signup via email: redirect to `/auth/role-selection`
- Role stored in `profiles.role`
- Middleware reads profile from cookies, redirects based on role

### 1.5 Session Management
- Supabase SSR session handling
- Middleware refreshes session on every request
- Zustand store for auth state (hydrated from server)
- Auto-refresh on token expiry

### 1.6 Protected Routes
- Middleware checks:
  - `/customer/*` → role === 'customer'
  - `/technician/*` → role === 'technician'
  - `/admin/*` → role === 'admin'
  - `/auth/*` → redirect to dashboard if logged in

### 1.7 UI Components
- `AuthGuard` — wraps client component, redirects if not authorized
- `UserNav` — avatar dropdown with logout
- Login page (`/auth/login`)
- Register page (`/auth/register`)
- Role selection page (`/auth/role-selection`)

---

## API / Route Handlers

| Route | Purpose |
|-------|---------|
| `POST /api/auth/callback` | OAuth callback handler |
| `POST /api/auth/signout` | Logout |

---

## Checklist

- [ ] Google login redirects back to app
- [ ] Email signup creates profile
- [ ] Role selection saves role to DB
- [ ] Logout clears session
- [ ] `/customer/*` blocked for non-customer
- [ ] `/technician/*` blocked for non-technician
- [ ] `/admin/*` blocked for non-admin
- [ ] Auth state persists on refresh
- [ ] Profile trigger works on new signups

## Done Definition
- [ ] Login → Google → redirected to correct dashboard
- [ ] Login → email → role select → redirected to correct dashboard
- [ ] Logout → redirected to login
- [ ] Direct URL access to protected route → redirected to login
- [ ] No auth-related errors in console
