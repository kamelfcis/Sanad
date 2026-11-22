import type { Notification, NotificationType } from '@/types/notifications';

export const ALERT_SOUND_URL = '/sounds/alert-loud.wav';

/** Notification types that may trigger a loud booking alert (role/metadata refine further). */
const BOOKING_ALERT_TYPES: NotificationType[] = [
  'booking_assigned',
  'booking_accepted',
  'booking_completed',
];

export function shouldPlayBookingAlertSound(
  notification: Notification,
  role?: string | null,
): boolean {
  if (!BOOKING_ALERT_TYPES.includes(notification.type)) return false;

  switch (notification.type) {
    case 'booking_assigned':
      return role === 'technician';
    case 'booking_accepted':
      return role === 'customer';
    case 'booking_completed': {
      const status = notification.metadata?.status;
      if (status === 'awaiting_customer_confirmation') return role === 'customer';
      if (status === 'completed') return role === 'technician';
      return false;
    }
    default:
      return false;
  }
}

export function isLoudPushNotificationType(type: string): boolean {
  return BOOKING_ALERT_TYPES.includes(type as NotificationType);
}
