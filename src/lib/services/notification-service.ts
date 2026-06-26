import { createServiceRoleClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Notification,
  NotificationEntityType,
  NotificationListResponse,
  NotificationType,
} from '@/types/notifications';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: NotificationEntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface GetNotificationsOptions {
  limit?: number;
  offset?: number;
  isRead?: boolean | 'all';
  type?: NotificationType;
  search?: string;
}

type DbClient = SupabaseClient;

function getWriteClient(): DbClient {
  return createServiceRoleClient();
}

export async function createNotification(
  input: CreateNotificationInput,
  client?: DbClient,
): Promise<Notification | null> {
  const supabase = client ?? getWriteClient();

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    console.error('[notification-service] createNotification failed:', error.message);
    return null;
  }

  return data as Notification;
}

export async function createNotifications(
  inputs: CreateNotificationInput[],
  client?: DbClient,
): Promise<number> {
  if (inputs.length === 0) return 0;

  const supabase = client ?? getWriteClient();
  const rows = inputs.map((input) => ({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  }));

  const { data, error } = await supabase.from('notifications').insert(rows).select('id');

  if (error) {
    console.error('[notification-service] createNotifications failed:', error.message);
    return 0;
  }

  return data?.length ?? 0;
}

export async function markAsRead(
  notificationId: string,
  userId: string,
  client: DbClient,
): Promise<Notification | null> {
  const { data, error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[notification-service] markAsRead failed:', error.message);
    return null;
  }

  return data as Notification;
}

export async function markAllAsRead(userId: string, client: DbClient): Promise<number> {
  const { data, error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .select('id');

  if (error) {
    console.error('[notification-service] markAllAsRead failed:', error.message);
    return 0;
  }

  return data?.length ?? 0;
}

export async function deleteNotification(
  notificationId: string,
  userId: string,
  client: DbClient,
): Promise<boolean> {
  const { error } = await client
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) {
    console.error('[notification-service] deleteNotification failed:', error.message);
    return false;
  }

  return true;
}

export async function deleteNotifications(
  notificationIds: string[],
  userId: string,
  client: DbClient,
): Promise<number> {
  if (notificationIds.length === 0) return 0;

  const { data, error } = await client
    .from('notifications')
    .delete()
    .in('id', notificationIds)
    .eq('user_id', userId)
    .select('id');

  if (error) {
    console.error('[notification-service] deleteNotifications failed:', error.message);
    return 0;
  }

  return data?.length ?? 0;
}

export async function getNotifications(
  userId: string,
  client: DbClient,
  options: GetNotificationsOptions = {},
): Promise<NotificationListResponse> {
  const { limit = 20, offset = 0, isRead = 'all', type, search } = options;

  let query = client
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (isRead !== 'all') {
    query = query.eq('is_read', isRead);
  }

  if (type) {
    query = query.eq('type', type);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[notification-service] getNotifications failed:', error.message);
    return { notifications: [], total: 0, limit, offset, hasMore: false };
  }

  const total = count ?? 0;

  return {
    notifications: (data ?? []) as Notification[],
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

export async function getUnreadCount(userId: string, client: DbClient): Promise<number> {
  const { count, error } = await client
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('[notification-service] getUnreadCount failed:', error.message);
    return 0;
  }

  return count ?? 0;
}

export async function getAdminUserIds(client?: DbClient): Promise<string[]> {
  const supabase = client ?? getWriteClient();
  const { data } = await supabase.from('profiles').select('id').eq('role', 'admin');
  return data?.map((row) => row.id) ?? [];
}
