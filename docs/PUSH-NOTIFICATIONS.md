# Push Notifications — Future Foundation

Phase 10 delivers in-app and email notifications. Push notifications (mobile/web) are documented here for a future phase.

## Goals

- Notify users when the app is closed or in background
- Support iOS (APNs), Android (FCM), and Web Push (VAPID)
- Reuse the same `notifications` table and event triggers from Phase 10

## Recommended Architecture

```
Event (API route / DB trigger)
    → notification-service.createNotification()
    → Supabase Realtime (in-app, app open)
    → sendEmailNotification() (optional)
    → push-dispatcher (future)
        → device_tokens table lookup
        → FCM / APNs / Web Push
```

## Database (Future Migration)

```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);
```

RLS: users manage own tokens; service role sends push.

## Client Integration Points

| Platform | Library | Registration |
|----------|---------|--------------|
| Web | `web-push` + Service Worker | `/api/push/subscribe` |
| iOS | Expo / Firebase | Native SDK on login |
| Android | FCM | Native SDK on login |

## Server Dispatch (Future)

- `src/lib/push/dispatcher.ts` — resolve tokens, batch send
- Feature flag: `ENABLE_PUSH_NOTIFICATIONS=false`
- Trigger same types as email: `booking_assigned`, `booking_completed`, `review_received`, `technician_approved`

## Security

- Never expose FCM/APNs keys to client
- Validate subscription payloads with Zod
- Rate-limit subscribe/unsubscribe endpoints
- Delete tokens on logout or failed delivery (410 Gone)

## Phase 11+ Checklist

- [ ] `device_tokens` migration + RLS
- [ ] Service worker + Web Push VAPID keys
- [ ] `POST /api/push/subscribe`, `DELETE /api/push/unsubscribe`
- [ ] Push dispatcher wired from `notifyUser()` in events.ts
- [ ] User preference: per-channel opt-out (in-app / email / push)
- [ ] Mobile app (React Native / Expo) token registration

## References

- [Web Push API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- Phase 10: `docs/PHASE-10.md`
