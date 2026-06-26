'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useMessages, useSendMessage, useMarkRead, useRealtimeMessages } from '@/hooks/use-chat';
import { ChatMessage } from '@/components/shared/chat-message';
import { ChatInput } from '@/components/shared/chat-input';
import { ErrorState } from '@/components/shared/error-state';
import { PageLoading } from '@/components/shared/page-loading';
import { MessageCircle, ArrowDown } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/hooks/use-chat';
import { uploadFileViaApi } from '@/lib/storage/client-upload';

interface ChatRoomProps {
  conversationId: string;
  userId: string;
  userName?: string;
}

export function ChatRoom({ conversationId, userId, userName }: ChatRoomProps) {
  const { data: messages, isLoading, error } = useMessages(conversationId);
  const sendMutation = useSendMessage(conversationId);
  const markRead = useMarkRead(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [liveMessages, setLiveMessages] = useState<ChatMessageType[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);

  // Handle incoming realtime messages
  const onRealtimeMessage = useCallback((msg: ChatMessageType) => {
    setLiveMessages((prev) => [...prev, msg]);
    setAutoScroll(true);
  }, []);

  useRealtimeMessages(conversationId, onRealtimeMessage);

  // Mark as read on mount
  useEffect(() => {
    if (conversationId) {
      markRead.mutate();
    }
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, liveMessages, autoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  };

  const allMessages = [...(messages ?? []), ...liveMessages].filter(
    (msg, i, arr) => arr.findIndex((m) => m.id === msg.id) === i,
  );

  const handleSend = async (text: string) => {
    await sendMutation.mutateAsync({ message: text });
  };

  const handleFileUpload = async (file: File) => {
    const publicUrl = await uploadFileViaApi(file);

    await sendMutation.mutateAsync({
      file_url: publicUrl,
      file_type: file.type,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <PageLoading variant="chat" className="flex-1" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="تعذّر تحميل الرسائل"
        className="m-4"
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 space-y-3 overflow-y-auto p-4"
      >
        {allMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <MessageCircle className="h-12 w-12 text-muted-foreground/30" />
            <div className="text-center">
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs text-muted-foreground">Send a message to start the conversation.</p>
            </div>
          </div>
        ) : (
          allMessages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg.message}
              fileUrl={msg.file_url}
              fileType={msg.file_type}
              createdAt={msg.created_at}
              isOwn={msg.sender_id === userId}
              senderName={msg.sender?.full_name ?? userName ?? 'Unknown'}
            />
          ))
        )}

        {!autoScroll && allMessages.length > 0 && (
          <button
            onClick={() => {
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
              setAutoScroll(true);
            }}
            className="sticky bottom-2 left-1/2 mx-auto flex -translate-x-1/2 items-center gap-1 rounded-full border bg-background px-3 py-1 text-xs shadow-sm transition-colors hover:bg-muted"
          >
            <ArrowDown className="h-3 w-3" />
            New messages
          </button>
        )}
      </div>

      <ChatInput
        onSend={handleSend}
        onFileUpload={handleFileUpload}
        disabled={sendMutation.isPending}
      />
    </div>
  );
}
