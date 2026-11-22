'use client';

import { NotificationRealtimeProvider } from '@/components/notifications/notification-realtime-provider';
import { PwaShell } from '@/components/pwa/pwa-shell';

export function DashboardNotificationProvider({ children }: { children: React.ReactNode }) {
  return (
    <NotificationRealtimeProvider>
      <PwaShell />
      {children}
    </NotificationRealtimeProvider>
  );
}
