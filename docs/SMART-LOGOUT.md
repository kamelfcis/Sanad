# Smart Logout System

Sanad uses a centralized logout flow with session management, idle timeout, and token expiry handling.

## Architecture

| Component | Path | Role |
|-----------|------|------|
| Central logout | `src/lib/auth/logout.ts` | Sign out, cleanup, redirect, toast |
| Cleanup helpers | `src/lib/auth/auth-cleanup.ts` | React Query, realtime, localStorage |
| Logout modal | `src/components/auth/logout-modal.tsx` | Confirm before logout (current device) |
| Idle warning | `src/components/auth/session-warning.tsx` | Inactivity countdown modal |
| Idle hook | `src/hooks/useIdleLogout.ts` | 25 min warning → 30 min logout |
| Auth listener | `src/components/shared/session-auth-listener.tsx` | Token refresh / expiry |
| Security page | `src/app/settings/security/page.tsx` | Session info + logout all |

## Logout scopes (Supabase)

- **Current device** — `supabase.auth.signOut({ scope: 'local' })` ends only this browser session.
- **All devices** — `supabase.auth.signOut({ scope: 'global' })` revokes all refresh tokens for the user; every device must sign in again.

Both scopes retry up to 2 times on network failure. Local state is always cleared and the user is redirected to `/`.

## Routes

- `/settings` → redirects to `/settings/security`
- `/settings/security` — session details, logout current / logout all (all authenticated roles)

## Idle timeout

Active on customer, technician, admin, notifications, and settings layouts (not landing page):

- **25 minutes** idle → warning modal with countdown to 30 minutes
- **30 minutes** idle → automatic logout
- **الاستمرار** resets the timer

## Token expiration

`SessionAuthListener` handles `TOKEN_REFRESHED` silently. On `SIGNED_OUT` without voluntary logout, shows toast *انتهت صلاحية الجلسة* and redirects to `/auth/login`.

## Cleanup on logout

1. Supabase `signOut`
2. All realtime channels (`removeAllChannels`)
3. Supabase auth keys in `localStorage`
4. React Query cache (`queryClient.clear()`)
5. Zustand auth store reset

## Verification

### Normal logout (current device)

1. Sign in → open user menu → **تسجيل الخروج**
2. Confirm modal → redirect to `/` with success toast

### Logout all devices

1. Go to `/settings/security`
2. Click **تسجيل الخروج من جميع الأجهزة**
3. Sign in on another browser/tab — session should be invalid

### Idle timeout

1. Sign in to a dashboard layout
2. Wait 25+ minutes without interaction (or temporarily lower `WARNING_MS` / `LOGOUT_MS` in `useIdleLogout.ts` for testing)
3. Warning modal appears; after 30 min total idle → auto logout

### Expired token

1. Clear auth cookies in devtools while app is open
2. Trigger a navigation or wait for refresh — toast + redirect to login

### Browser refresh

1. Sign in → refresh — session persists
2. After logout → refresh `/` — stays logged out

### Multi-tab logout

1. Open two tabs while signed in
2. Logout all in one tab
3. Other tab should lose session on next request or auth event
