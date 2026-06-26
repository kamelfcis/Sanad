'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Banknote,
  Calendar,
  Check,
  CheckCheck,
  MessageSquare,
  Star,
  UserCheck,
  Wrench,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/store/auth-store';
import { useAdminI18nOptional } from '@/lib/i18n/admin/use-admin-t';
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useNotificationsRealtime,
  getNotificationLink,
  formatNotificationTime,
} from '@/hooks/use-notifications';
import type { Notification, NotificationType } from '@/types/notifications';

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  booking_assigned: Calendar,
  booking_accepted: Check,
  booking_started: Wrench,
  booking_completed: CheckCheck,
  booking_cancelled: Calendar,
  chat_message: MessageSquare,
  review_received: Star,
  technician_approved: UserCheck,
  technician_rejected: UserCheck,
  technician_suspended: UserCheck,
  technician_application: UserCheck,
  payment_submitted: Banknote,
  payment_approved: Check,
  payment_rejected: XCircle,
};

function NotificationIcon({ type, unread }: { type: NotificationType; unread: boolean }) {
  const Icon = TYPE_ICONS[type] ?? Bell;
  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
        unread ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

function NotificationItem({
  notification,
  role,
  onRead,
  textAlign,
}: {
  notification: Notification;
  role?: string;
  onRead: (id: string) => void;
  textAlign: string;
}) {
  const router = useRouter();
  const href = getNotificationLink(notification, role);

  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }
    router.push(href);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex w-full gap-3 px-4 py-3 transition-colors hover:bg-muted/60',
        textAlign,
        !notification.is_read && 'bg-primary/[0.03]',
      )}
    >
      <NotificationIcon type={notification.type} unread={!notification.is_read} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'truncate text-sm',
              !notification.is_read ? 'font-semibold text-foreground' : 'text-foreground/80',
            )}
          >
            {notification.title}
          </p>
          {!notification.is_read && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          {formatNotificationTime(notification.created_at)}
        </p>
      </div>
    </button>
  );
}

interface NotificationBellProps {
  className?: string;
  variant?: 'light' | 'default' | 'admin';
}

export function NotificationBell({ className, variant = 'default' }: NotificationBellProps) {
  const { profile } = useAuthStore();
  const adminI18n = useAdminI18nOptional();
  const isAdmin = variant === 'admin' && !!adminI18n;

  const { data: unreadCount = 0 } = useUnreadCount(!!profile);
  const { data, isLoading } = useNotifications({ isRead: 'all', enabled: !!profile });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useNotificationsRealtime(!!profile);

  const recent =
    data?.pages.flatMap((page) => page.notifications).slice(0, 8) ?? [];

  if (!profile) return null;

  const labels = isAdmin
    ? {
        title: adminI18n.t('notifications.title'),
        unread: adminI18n.t('notifications.unread', { count: unreadCount }),
        markAllRead: adminI18n.t('notifications.markAllRead'),
        empty: adminI18n.t('notifications.empty'),
        emptyHint: adminI18n.t('notifications.emptyHint'),
        viewAll: adminI18n.t('notifications.viewAll'),
        aria: adminI18n.t('notifications.unreadAria', {
          suffix: unreadCount > 0 ? adminI18n.t('notifications.unreadSuffix', { count: unreadCount }) : '',
        }),
        align: adminI18n.dir === 'ltr' ? ('end' as const) : ('end' as const),
        textAlign: adminI18n.dir === 'ltr' ? 'text-left' : 'text-right',
        badgePosition: adminI18n.dir === 'ltr' ? '-right-0.5' : '-left-0.5',
        iconMargin: adminI18n.dir === 'ltr' ? 'mr-1' : 'ml-1',
      }
    : {
        title: 'الإشعارات',
        unread: `${unreadCount} غير مقروء`,
        markAllRead: 'قراءة الكل',
        empty: 'لا توجد إشعارات',
        emptyHint: 'ستظهر التحديثات هنا',
        viewAll: 'عرض كل الإشعارات',
        aria: `الإشعارات${unreadCount > 0 ? `، ${unreadCount} غير مقروء` : ''}`,
        align: 'end' as const,
        textAlign: 'text-right',
        badgePosition: '-left-0.5',
        iconMargin: 'ml-1',
      };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative rounded-full',
            variant === 'light'
              ? 'text-text-secondary hover:bg-muted hover:text-text-primary'
              : 'text-[#64748B] hover:text-[#0F172A]',
            className,
          )}
          aria-label={labels.aria}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm',
                labels.badgePosition,
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={labels.align}
        className="w-[min(100vw-2rem,380px)] overflow-hidden rounded-2xl border-border/60 p-0 shadow-xl"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-3">
          <div className={labels.textAlign}>
            <h3 className="text-sm font-semibold">{labels.title}</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">{labels.unread}</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-primary hover:text-primary"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className={cn('h-3.5 w-3.5', labels.iconMargin)} />
              {labels.markAllRead}
            </Button>
          )}
        </div>

        <div className="max-h-[min(60vh,420px)] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-0 divide-y divide-border/40">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 px-4 py-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-2 w-full animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">{labels.empty}</p>
              <p className="mt-1 text-xs text-muted-foreground">{labels.emptyHint}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {recent.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  role={profile.role}
                  onRead={(id) => markRead.mutate(id)}
                  textAlign={labels.textAlign}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border/60 bg-muted/20 p-2">
          <Button variant="ghost" className="w-full text-sm font-medium" asChild>
            <Link href="/notifications">{labels.viewAll}</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
