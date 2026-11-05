'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/components/shared/chat-message';
import { ChatInput } from '@/components/shared/chat-input';
import { PageLoading } from '@/components/shared/page-loading';
import { ErrorState } from '@/components/shared/error-state';
import { useMessages, useSendMessage } from '@/hooks/use-chat';

export function ChatRoom({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
  userName?: string;
}) {
  const { data: messages, isLoading, error, refetch } = useMessages(conversationId);
  const send = useSendMessage();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

  if (isLoading) return <PageLoading />;
  if (error) {
    return (
      <ErrorState
        title="تعذّر تحميل المحادثة"
        description="حدث خطأ أثناء جلب الرسائل."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {(messages ?? []).map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg.message}
            fileUrl={msg.file_url}
            fileType={msg.file_type}
            createdAt={msg.created_at}
            isOwn={msg.sender_id === userId}
            senderName={msg.sender?.full_name ?? null}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <ChatInput
        disabled={send.isPending}
        onSend={async (message) => {
          await send.mutateAsync({ conversationId, message });
        }}
      />
    </div>
  );
}
