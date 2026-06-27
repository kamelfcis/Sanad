'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface ChatConversation {
  id: string;
  booking_id: string;
  customer_last_read_at: string;
  technician_last_read_at: string;
  created_at: string;
  last_message_at: string;
  booking: {
    id: string;
    status: string;
    service_id: string;
    customer_id?: string;
    technician_id?: string;
    services: { name_ar: string; name_en: string; slug: string } | null;
    customer: { full_name: string | null; avatar_url: string | null; phone: string | null } | null;
    technician: { full_name: string | null; avatar_url: string | null; phone: string | null } | null;
  } | null;
  last_message: {
    id: string;
    message: string | null;
    file_url: string | null;
    file_type: string | null;
    sender_id: string;
    created_at: string;
  } | null;
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string | null;
  file_url: string | null;
  file_type: string | null;
  created_at: string;
  sender: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Fetch conversations list
async function fetchConversations(): Promise<ChatConversation[]> {
  const res = await fetch('/api/chat/conversations');
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

// Fetch messages for a conversation
async function fetchMessages(conversationId: string, before?: string): Promise<ChatMessage[]> {
  const params = new URLSearchParams();
  if (before) params.set('before', before);
  const url = `/api/chat/conversations/${conversationId}/messages${params.toString() ? `?${params}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

// Send a message
async function sendMessage(conversationId: string, data: { message?: string; file_url?: string; file_type?: string }) {
  const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Failed to send message');
  }
  return res.json();
}

// Mark conversation as read
async function markConversationRead(conversationId: string) {
  const res = await fetch(`/api/chat/conversations/${conversationId}/read`, {
    method: 'PUT',
  });
  if (!res.ok) throw new Error('Failed to mark read');
  return res.json();
}

// Hooks

export function useConversations() {
  return useQuery({
    queryKey: ['chat-conversations'],
    queryFn: fetchConversations,
    refetchInterval: 30_000, // Poll every 30s as fallback
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: () => fetchMessages(conversationId),
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { message?: string; file_url?: string; file_type?: string }) =>
      sendMessage(conversationId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
      qc.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
  });
}

export function useMarkRead(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markConversationRead(conversationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
  });
}

// Realtime subscription hook for live messages
export function useRealtimeMessages(
  conversationId: string,
  onMessage: (message: ChatMessage) => void,
) {
  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes' as never,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
          const newMessage = payload.new as ChatMessage;
          if (newMessage) {
            onMessage(newMessage);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onMessage]);
}

// Compute unread count for a conversation
export function computeUnreadCount(
  messages: ChatMessage[] | undefined,
  conversation: ChatConversation | undefined,
  userId: string | undefined,
): number {
  if (!messages || !conversation || !userId) return 0;

  const role = 'technician'; // simplified; ideally from profile
  const lastReadAt =
    role === 'technician'
      ? conversation.technician_last_read_at
      : conversation.customer_last_read_at;

  const lastRead = new Date(lastReadAt).getTime();
  return messages.filter((m) => m.sender_id !== userId && new Date(m.created_at).getTime() > lastRead).length;
}
