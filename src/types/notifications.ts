export const NOTIFICATION_TYPES = [
  'booking_assigned',
  'booking_accepted',
  'booking_started',
  'booking_completed',
  'booking_cancelled',
  'chat_message',
  'review_received',
  'technician_approved',
  'technician_rejected',
  'technician_suspended',
  'technician_application',
  'payment_submitted',
  'payment_approved',
  'payment_rejected',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_ENTITY_TYPES = [
  'booking',
  'chat',
  'review',
  'technician',
  'assignment',
  'payment',
] as const;

export type NotificationEntityType = (typeof NOTIFICATION_ENTITY_TYPES)[number];

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  entity_type: NotificationEntityType | null;
  entity_id: string | null;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
