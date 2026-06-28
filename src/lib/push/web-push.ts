/**
 * Web Push server utilities.
 *
 * Required env vars (generate with `npx web-push generate-vapid-keys`):
 * - NEXT_PUBLIC_VAPID_PUBLIC_KEY — exposed to client for subscribe()
 * - VAPID_PRIVATE_KEY — server-only, never commit
 * - VAPID_SUBJECT — optional mailto: or https: contact (defaults to mailto:admin@sanad.app)
 */
import webpush from 'web-push';
import { createServiceRoleClient } from '@/lib/supabase/admin';

export interface PushPayload {
  title: string;
  message: string;
  url?: string;
  notificationId?: string;
}

function getVapidConfig(): { publicKey: string; privateKey: string; subject: string } | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;

  return {
    publicKey,
    privateKey,
    subject: process.env.VAPID_SUBJECT ?? 'mailto:admin@sanad.app',
  };
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const vapid = getVapidConfig();
  if (!vapid) return 0;

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const supabase = createServiceRoleClient();
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error || !subs?.length) return 0;

  let sent = 0;
  const body = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
        );
        sent += 1;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
        console.error('[web-push] send failed:', status ?? err);
      }
    }),
  );

  return sent;
}

export async function fanOutWebPush(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  try {
    await sendPushToUser(userId, payload);
  } catch (err) {
    console.error('[web-push] fanOutWebPush failed:', err);
  }
}
