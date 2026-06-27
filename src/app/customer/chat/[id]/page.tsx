'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useConversations } from '@/hooks/use-chat';
import { useAuthStore } from '@/store/auth-store';
import { ChatRoom } from '@/components/shared/chat-room';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MessageCircle } from 'lucide-react';

export default function CustomerChatDetailPage() {
  const params = useParams();
  const bookingId = params.id as string;
  const { user } = useAuthStore();
  const { data: conversations, isLoading } = useConversations();

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="border-b px-4 py-3">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex-1 space-y-3 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const conversation = conversations?.find((c) => c.booking_id === bookingId);

  if (!conversation) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <MessageCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">No chat available</h2>
          <p className="text-sm text-muted-foreground">
            A conversation will be created once a technician accepts your booking.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/customer/chat">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to chats
          </Link>
        </Button>
      </div>
    );
  }

  const technician = conversation.booking?.technician;
  const technicianName =
    technician?.full_name?.trim() || technician?.phone?.trim() || 'Technician';

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center gap-3 border-b border-[#FF6B00]/10 bg-background px-4 py-3 shadow-sm">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customer/chat">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <p className="text-sm font-medium text-[#FF6B00]" dir="auto">
            {technicianName}
          </p>
          <p className="text-xs text-muted-foreground" dir="auto">
            {conversation.booking?.services?.name_ar ?? 'Chat'}
          </p>
        </div>
      </div>
      <div className="flex-1">
        <ChatRoom
          conversationId={conversation.id}
          userId={user?.id ?? ''}
          userName={user?.email ?? ''}
        />
      </div>
    </div>
  );
}
