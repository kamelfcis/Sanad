'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Search,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react';
import { PageTransition } from '@/components/animations';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/store/auth-store';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteNotificationsBulk,
  useNotificationsRealtime,
  getNotificationLink,
  formatNotificationTime,
} from '@/hooks/use-notifications';
import type { Notification } from '@/types/notifications';

const READ_TABS = [
  { label: 'الكل', value: 'all' as const },
  { label: 'غير مقروء', value: 'false' as const },
  { label: 'مقروء', value: 'true' as const },
];

function NotificationRow({
  notification,
  role,
  selected,
  onSelect,
  onRead,
  onDelete,
}: {
  notification: Notification;
  role?: string;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const href = getNotificationLink(notification, role);

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm',
        !notification.is_read && 'border-primary/15 bg-primary/[0.02]',
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={(checked) => onSelect(notification.id, checked === true)}
        aria-label="تحديد الإشعار"
        className="mt-1"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={href}
              onClick={() => !notification.is_read && onRead(notification.id)}
              className={cn(
                'block text-sm hover:text-primary',
                !notification.is_read ? 'font-semibold' : 'font-medium text-foreground/80',
              )}
            >
              {notification.title}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
            <p className="mt-2 text-xs text-muted-foreground/70">
              {formatNotificationTime(notification.created_at)}
            </p>
          </div>
          {!notification.is_read && (
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onRead(notification.id)}
            aria-label="تعليم كمقروء"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(notification.id)}
          aria-label="حذف"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function NotificationsPageClient() {
  const { profile } = useAuthStore();
  const [readTab, setReadTab] = useState<'all' | 'true' | 'false'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications({
    isRead: readTab,
    search: debouncedSearch || undefined,
  });

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteOne = useDeleteNotification();
  const deleteBulk = useDeleteNotificationsBulk();

  useNotificationsRealtime(true);

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    await deleteBulk.mutateAsync([...selectedIds]);
    setSelectedIds(new Set());
  };

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <PageTransition className="container max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">الإشعارات</h1>
        <p className="mt-1 text-muted-foreground">
          {total > 0 ? `${total} إشعار` : 'تابع آخر التحديثات'}
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث في الإشعارات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {READ_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setReadTab(tab.value);
                setSelectedIds(new Set());
              }}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                readTab === tab.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-muted-foreground/50',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
          <Checkbox
            checked={selectedIds.size === notifications.length && notifications.length > 0}
            onCheckedChange={(checked) => handleSelectAll(checked === true)}
          />
          <span className="text-sm text-muted-foreground">{selectedIds.size} محدد</span>
          <Button
            variant="outline"
            size="sm"
            className="mr-auto"
            onClick={handleBulkDelete}
            disabled={deleteBulk.isPending}
          >
            <Trash2 className="ml-1.5 h-3.5 w-3.5" />
            حذف المحدد
          </Button>
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
        >
          <CheckCheck className="ml-1.5 h-3.5 w-3.5" />
          تعليم الكل كمقروء
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : error ? (
        <ErrorState title="تعذّر تحميل الإشعارات" onRetry={() => refetch()} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="لا توجد إشعارات"
          description={
            debouncedSearch
              ? 'لا توجد نتائج مطابقة لبحثك.'
              : readTab === 'false'
                ? 'لا توجد إشعارات غير مقروءة.'
                : 'ستظهر الإشعارات هنا عند حدوث نشاط.'
          }
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              role={profile?.role}
              selected={selectedIds.has(notification.id)}
              onSelect={handleSelect}
              onRead={(id) => markRead.mutate(id)}
              onDelete={(id) => deleteOne.mutate(id)}
            />
          ))}

          <div ref={loadMoreRef} className="flex justify-center py-6">
            {isFetchingNextPage && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
            {!hasNextPage && notifications.length > 0 && (
              <p className="text-xs text-muted-foreground">نهاية القائمة</p>
            )}
          </div>
        </div>
      )}
    </PageTransition>
  );
}
