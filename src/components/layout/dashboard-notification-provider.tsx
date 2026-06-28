'use client';

import { NotificationRealtimeProvider } from '@/components/notifications/notification-realtime-provider';

export function DashboardNotificationProvider({ children }: { children: React.ReactNode }) {
  return <NotificationRealtimeProvider>{children}</NotificationRealtimeProvider>;
}
