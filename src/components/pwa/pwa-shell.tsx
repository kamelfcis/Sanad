'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { usePushNotifications } from '@/hooks/use-push-notifications';

const SW_URL = '/sw.js';
const PERMISSION_PROMPT_KEY = 'sanad_notif_permission_prompted_v1';

/**
 * Registers the PWA service worker (production) and optionally subscribes to Web Push
 * when VAPID is configured. Requests Notification permission once for customers/technicians.
 */
export function PwaShell() {
  const { profile } = useAuthStore();
  const { subscribe, canSubscribe, permission } = usePushNotifications(!!profile);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const registerSw = async () => {
      try {
        await navigator.serviceWorker.register(SW_URL, { scope: '/' });
      } catch (err) {
        console.error('[PwaShell] service worker registration failed:', err);
      }
    };

    if (process.env.NODE_ENV === 'production') {
      void registerSw();
    }
  }, []);

  useEffect(() => {
    const role = profile?.role;
    if (role !== 'customer' && role !== 'technician') return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (localStorage.getItem(PERMISSION_PROMPT_KEY) === '1') return;

    const timer = window.setTimeout(() => {
      localStorage.setItem(PERMISSION_PROMPT_KEY, '1');
      if (Notification.permission === 'default') {
        void Notification.requestPermission();
      }
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [profile?.role]);

  useEffect(() => {
    if (!profile || permission !== 'granted' || !canSubscribe) return;
    void subscribe();
  }, [profile, permission, canSubscribe, subscribe]);

  return null;
}
