'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import type { Notification, NotificationListResponse } from '@/types/notifications';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const PAGE_SIZE = 20;

async function fetchNotifications(params: {
  offset: number;
  is_read?: 'true' | 'false' | 'all';
  type?: string;
  search?: string;
}): Promise<NotificationListResponse> {
  const searchParams = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(params.offset),
    is_read: params.is_read ?? 'all',
  });
  if (params.type) searchParams.set('type', params.type);
  if (params.search) searchParams.set('search', params.search);

  const res = await fetch(`/api/notifications?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  const data = (await res.json()) as Partial<NotificationListResponse> | null;
  const notifications = Array.isArray(data?.notifications) ? data.notifications : [];
  return {
    notifications,
    total: typeof data?.total === 'number' ? data.total : notifications.length,
    limit: typeof data?.limit === 'number' ? data.limit : PAGE_SIZE,
    offset: typeof data?.offset === 'number' ? data.offset : params.offset,
    hasMore: Boolean(data?.hasMore),
  };
}

type NotificationsCache = InfiniteData<NotificationListResponse, number>;

function isBookingActivity(row: Notification): boolean {
  return (
    row.entity_type === 'booking' ||
    row.entity_type === 'assignment' ||
    (typeof row.type === 'string' && row.type.startsWith('booking_'))
  );
}

function invalidateLiveBookingQueries(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ['bookings'] });
  qc.invalidateQueries({ queryKey: ['booking'] });
  qc.invalidateQueries({ queryKey: ['technician-bookings'] });
  qc.invalidateQueries({ queryKey: ['technician-assignments'] });
  qc.invalidateQueries({ queryKey: ['technician-assignment'] });
}

/** Mark cached rows read and drop the badge in one React Query update. */
export function applyNotificationsReadCache(qc: QueryClient, ids: 'all' | string[]) {
  const idSet = ids === 'all' ? null : new Set(ids);

  qc.setQueriesData<NotificationsCache>({ queryKey: ['notifications'] }, (old) => {
    if (!old?.pages) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        notifications: (page.notifications ?? []).map((notification) => {
          if (notification.is_read) return notification;
          if (idSet && !idSet.has(notification.id)) return notification;
          return { ...notification, is_read: true };
        }),
      })),
    };
  });

  if (ids === 'all') {
    qc.setQueryData(['notifications-unread-count'], 0);
    return;
  }

  qc.setQueryData<number>(['notifications-unread-count'], (current) => {
    if (typeof current !== 'number') return current;
    return Math.max(0, current - ids.length);
  });
}

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch('/api/notifications/unread-count');
  if (!res.ok) throw new Error('Failed to fetch unread count');
  const data = await res.json();
  return data.count as number;
}

async function markNotificationRead(id: string): Promise<Notification> {
  const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to mark notification as read');
  return res.json();
}

async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch('/api/notifications/read-all', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to mark all as read');
}

async function deleteNotificationById(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete notification');
}

async function deleteNotificationsBulk(ids: string[]): Promise<void> {
  const res = await fetch('/api/notifications/bulk', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error('Failed to delete notifications');
}

export interface UseNotificationsOptions {
  isRead?: 'true' | 'false' | 'all';
  type?: string;
  search?: string;
  enabled?: boolean;
}

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: fetchUnreadCount,
    enabled,
    staleTime: 10_000,
  });
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { isRead = 'all', type, search, enabled = true } = options;

  return useInfiniteQuery({
    queryKey: ['notifications', isRead, type, search],
    queryFn: ({ pageParam = 0 }) =>
      fetchNotifications({ offset: pageParam, is_read: isRead, type, search }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.offset + lastPage.limit : undefined,
    enabled,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notifications-unread-count'] });
      applyNotificationsReadCache(qc, [id]);
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

/** Marks the bell's visible unread rows, and clears those rows from the badge together. */
export function useMarkVisibleNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => markNotificationRead(id)));
    },
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: ['notifications-unread-count'] });
      applyNotificationsReadCache(qc, ids);
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      await qc.cancelQueries({ queryKey: ['notifications-unread-count'] });
      applyNotificationsReadCache(qc, 'all');
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteNotificationById,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

export function useDeleteNotificationsBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteNotificationsBulk,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

/** Live updates via Supabase Realtime — dedupes by notification id */
export function useNotificationsRealtime(enabled = true) {
  const { profile } = useAuthStore();
  const qc = useQueryClient();
  const seenIds = useRef(new Set<string>());

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['notifications'] });
    qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
  }, [qc]);

  useEffect(() => {
    if (!enabled || !profile?.id) return;

    const supabase = createClient();
    const userId = profile.id;

    const channel = supabase
      .channel(`notifications:${userId}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes' as never,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          const row = payload.new as Notification;
          if (!row?.id || seenIds.current.has(row.id)) return;
          seenIds.current.add(row.id);
          invalidate();
          if (isBookingActivity(row)) invalidateLiveBookingQueries(qc);
        },
      )
      .on(
        'postgres_changes' as never,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          invalidate();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, profile?.id, invalidate, qc]);
}

export function useNotificationPushListener(
  onNotification: (notification: Notification) => void,
  enabled = true,
) {
  const { profile } = useAuthStore();
  const handlerRef = useRef(onNotification);
  handlerRef.current = onNotification;

  useEffect(() => {
    if (!enabled || !profile?.id) return;

    const supabase = createClient();
    const userId = profile.id;
    const channel = supabase
      .channel(`notifications-push:${userId}`)
      .on(
        'postgres_changes' as never,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          const row = payload.new as Notification;
          if (row?.id) handlerRef.current(row);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, profile?.id]);
}

export function getNotificationLink(notification: Notification, role?: string): string {
  const base =
    role === 'admin' ? '/admin' : role === 'technician' ? '/technician' : '/customer';
  const entityId = notification.entity_id;

  switch (notification.entity_type) {
    case 'booking':
      if (!entityId) return '/notifications';
      if (role === 'technician') return `/technician/jobs/${entityId}`;
      if (role === 'admin') return `/admin/bookings/${entityId}`;
      return `/customer/bookings/${entityId}`;
    case 'assignment':
      if (role === 'technician' && entityId) return `/technician/jobs/${entityId}`;
      return role === 'technician' ? '/technician/jobs' : '/notifications';
    case 'chat':
      return role === 'technician' ? '/technician/chat' : '/customer/chat';
    case 'review':
      return role === 'technician' ? '/technician/reviews' : '/notifications';
    case 'technician':
      return role === 'admin' ? '/admin/technicians' : '/technician/profile';
    default:
      return `${base}/bookings`;
  }
}

export function formatNotificationTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} د`;
  if (diffHours < 24) return `منذ ${diffHours} س`;
  if (diffDays < 7) return `منذ ${diffDays} ي`;
  return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
}
