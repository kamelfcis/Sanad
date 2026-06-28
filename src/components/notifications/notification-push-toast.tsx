'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import type { Notification } from '@/types/notifications';
import { getNotificationLink } from '@/hooks/use-notifications';

export interface PushToastItem {
  id: string;
  notification: Notification;
}

interface NotificationPushToastProps {
  toasts: PushToastItem[];
  role?: string;
  onDismiss: (id: string) => void;
}

export function NotificationPushToast({ toasts, role, onDismiss }: NotificationPushToastProps) {
  const router = useRouter();

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed top-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 end-0 sm:end-4"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          data-testid="notification-push-toast"
          className={cn(
            'pointer-events-auto flex gap-3 rounded-xl border border-border/60 bg-background/95 p-4 shadow-lg backdrop-blur-sm',
            'animate-in slide-in-from-top-2 fade-in duration-300',
          )}
        >
          <button
            type="button"
            className="min-w-0 flex-1 text-start"
            onClick={() => {
              onDismiss(toast.id);
              router.push(getNotificationLink(toast.notification, role));
            }}
          >
            <p className="text-sm font-semibold text-foreground">{toast.notification.title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {toast.notification.message}
            </p>
          </button>
          <button
            type="button"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToastAutoDismiss(
  toasts: PushToastItem[],
  onDismiss: (id: string) => void,
  ms = 5000,
) {
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      window.setTimeout(() => onDismiss(toast.id), ms),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [toasts, onDismiss, ms]);
}
