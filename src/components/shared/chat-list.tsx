'use client';

import { useConversations } from '@/hooks/use-chat';
import { useAuthStore } from '@/store/auth-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageLoading } from '@/components/shared/page-loading';
import { MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface ChatListProps {
  basePath: string;
}

export function ChatList({ basePath }: ChatListProps) {
  const { data: conversations, isLoading, error, refetch } = useConversations();
  const { user, profile } = useAuthStore();

  const getUnreadCount = (conv: {
    customer_last_read_at: string;
    technician_last_read_at: string;
    last_message?: { sender_id: string; created_at: string } | null;
  }) => {
    if (!conv.last_message || !user) return 0;
    const lastReadAt =
      profile?.role === 'technician' ? conv.technician_last_read_at : conv.customer_last_read_at;
    const lastRead = new Date(lastReadAt).getTime();
    return new Date(conv.last_message.created_at).getTime() > lastRead &&
      conv.last_message.sender_id !== user.id
      ? 1
      : 0;
  };

  if (isLoading) {
    return <PageLoading variant="list" />;
  }

  if (error) {
    return (
      <ErrorState
        title="تعذّر تحميل المحادثات"
        description="حدث خطأ أثناء جلب قائمة المحادثات."
        onRetry={() => refetch()}
      />
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="لا توجد محادثات"
        description="ستظهر محادثاتك هنا بعد قبول الفني لطلبك."
      />
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conv) => {
        const unread = getUnreadCount(conv);
        const otherParty = conv.booking?.profiles;
        const initials = (otherParty?.full_name ?? '?')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <Link
            key={conv.id}
            href={`${basePath}/${conv.booking_id}`}
            className={cn(
              'flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50',
              unread > 0 && 'bg-primary/5',
            )}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParty?.avatar_url ?? undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={cn('truncate text-sm', unread > 0 && 'font-semibold')}>
                  {otherParty?.full_name ?? 'Unknown'}
                </p>
                {unread > 0 && (
                  <span className="flex h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {conv.booking?.services?.name_ar ?? 'Service'}
                {' · '}
                {conv.last_message
                  ? format(new Date(conv.last_message.created_at), 'MMM d')
                  : format(new Date(conv.created_at), 'MMM d')}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
