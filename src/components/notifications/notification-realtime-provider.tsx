'use client';

import { useCallback, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useNotificationPushListener,
} from '@/hooks/use-notifications';
import {
  NotificationPushToast,
  useToastAutoDismiss,
  type PushToastItem,
} from '@/components/notifications/notification-push-toast';
import { playNotificationSound } from '@/lib/notifications/play-notification-sound';
import type { Notification } from '@/types/notifications';

export function NotificationRealtimeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuthStore();
  const [toasts, setToasts] = useState<PushToastItem[]>([]);

  const handleNotification = useCallback((notification: Notification) => {
    playNotificationSound();
    setToasts((prev) => {
      if (prev.some((t) => t.notification.id === notification.id)) return prev;
      return [...prev, { id: notification.id, notification }].slice(-5);
    });
  }, []);

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
