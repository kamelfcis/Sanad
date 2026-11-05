'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface ChatConversation {
  id: string;
  booking_id: string;
  created_at: string;
  customer_last_read_at: string;
  technician_last_read_at: string;
  last_message?: {
    sender_id: string;
    created_at: string;
    message?: string | null;
  } | null;
  booking?: {
    services?: { name_ar: string; name_en?: string } | null;
    profiles?: { full_name: string | null; avatar_url: string | null; phone?: string | null } | null;
    technician?: { full_name: string | null; phone?: string | null } | null;
  };
}

export interface ChatMessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string | null;
  file_url: string | null;
  file_type: string | null;
  created_at: string;
  sender?: { full_name: string | null; avatar_url: string | null } | null;
}

async function fetchConversations(): Promise<ChatConversation[]> {
  const res = await fetch('/api/chat/conversations');
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

async function fetchMessages(conversationId: string): Promise<ChatMessageRow[]> {
  const res = await fetch(`/api/chat/conversations/${conversationId}/messages`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

async function sendMessage(
  conversationId: string,
  body: { message?: string; file_url?: string; file_type?: string },
) {
  const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to send message');
  }
  return res.json();
}

export function useConversations() {
  return useQuery({
    queryKey: ['chat-conversations'],
    queryFn: fetchConversations,
  });
}

export function useMessages(conversationId: string) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: () => fetchMessages(conversationId),
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversationId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
          void qc.invalidateQueries({ queryKey: ['chat-conversations'] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, qc]);

  return query;
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      ...body
    }: {
      conversationId: string;
      message?: string;
      file_url?: string;
      file_type?: string;
    }) => sendMessage(conversationId, body),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['chat-messages', vars.conversationId] });
      void qc.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
  });
}
