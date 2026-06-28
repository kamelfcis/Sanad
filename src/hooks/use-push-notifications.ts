'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Client hook for browser Web Push.
 * Requires NEXT_PUBLIC_VAPID_PUBLIC_KEY in env (see src/lib/push/web-push.ts).
 */
export function usePushNotifications(enabled = true) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    setPermission(Notification.permission);
  }, []);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
  };

  const subscribe = useCallback(async () => {
    if (!enabled || !vapidPublicKey) return false;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        }),
      });

      if (!res.ok) return false;
      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('[usePushNotifications] subscribe failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [enabled, vapidPublicKey]);

  const unsubscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return false;

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        return true;
      }

      await fetch('/api/push/unsubscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      await subscription.unsubscribe();
      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error('[usePushNotifications] unsubscribe failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || permission !== 'granted') return;
    void (async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/sw.js');
        const sub = await registration?.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch {
        setIsSubscribed(false);
      }
    })();
  }, [enabled, permission]);

  return {
    permission,
    isSubscribed,
    isLoading,
    canSubscribe: !!vapidPublicKey && enabled,
    subscribe,
    unsubscribe,
  };
}
