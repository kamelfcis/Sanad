'use client';

import { useCallback, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { getNotificationLink, useNotificationPushListener } from '@/hooks/use-notifications';
import {
  NotificationPushToast,
  useToastAutoDismiss,
  type PushToastItem,
} from '@/components/notifications/notification-push-toast';
import { shouldPlayBookingAlertSound } from '@/lib/notifications/booking-alert-sound';
import { playBookingAlertSound } from '@/lib/notifications/play-notification-sound';
import type { Notification } from '@/types/notifications';

function showForegroundSystemNotification(notification: Notification, role?: string | null): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const href = getNotificationLink(notification, role ?? undefined);

    // eslint-disable-next-line no-new
    new Notification(notification.title, {
      body: notification.message,
      icon: '/icons/icon-192.png',
      tag: notification.id,
      silent: false,
      data: { url: href },
    });
  } catch {
    // Ignore if Notification construction fails
  }
}

export function NotificationRealtimeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuthStore();
  const [toasts, setToasts] = useState<PushToastItem[]>([]);

  const handleNotification = useCallback(
    (notification: Notification) => {
      if (shouldPlayBookingAlertSound(notification, profile?.role)) {
        playBookingAlertSound();
        showForegroundSystemNotification(notification, profile?.role);
      }

      setToasts((prev) => {
        if (prev.some((t) => t.notification.id === notification.id)) return prev;
        return [...prev, { id: notification.id, notification }].slice(-5);
      });
    },
    [profile?.role],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useNotificationPushListener(handleNotification, !!profile);
  useToastAutoDismiss(toasts, dismiss);

  return (
    <>
      {children}
      <NotificationPushToast toasts={toasts} role={profile?.role} onDismiss={dismiss} />
    </>
  );
}
