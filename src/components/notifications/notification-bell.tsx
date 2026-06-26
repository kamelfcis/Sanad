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
}: {
  notification: Notification;
  role?: string;
  onRead: (id: string) => void;
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
        'flex w-full gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/60',
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
  variant?: 'light' | 'default';
}

export function NotificationBell({ className, variant = 'default' }: NotificationBellProps) {
  const { profile } = useAuthStore();
  const { data: unreadCount = 0 } = useUnreadCount(!!profile);
  const { data, isLoading } = useNotifications({ isRead: 'all', enabled: !!profile });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useNotificationsRealtime(!!profile);

  const recent =
    data?.pages.flatMap((page) => page.notifications).slice(0, 8) ?? [];

  if (!profile) return null;

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
          aria-label={`الإشعارات${unreadCount > 0 ? `، ${unreadCount} غير مقروء` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -left-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(100vw-2rem,380px)] overflow-hidden rounded-2xl border-border/60 p-0 shadow-xl"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">الإشعارات</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">{unreadCount} غير مقروء</p>
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
              <CheckCheck className="ml-1 h-3.5 w-3.5" />
              قراءة الكل
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
              <p className="text-sm font-medium">لا توجد إشعارات</p>
              <p className="mt-1 text-xs text-muted-foreground">ستظهر التحديثات هنا</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {recent.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  role={profile.role}
                  onRead={(id) => markRead.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border/60 bg-muted/20 p-2">
          <Button variant="ghost" className="w-full text-sm font-medium" asChild>
            <Link href="/notifications">عرض كل الإشعارات</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
