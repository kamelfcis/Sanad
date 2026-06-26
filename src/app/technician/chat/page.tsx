'use client';

import { ChatList } from '@/components/shared/chat-list';

export default function TechnicianChatPage() {
  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Chats</h1>
          <p className="mt-1 text-muted-foreground">
            Your conversations with customers.
          </p>
        </div>
        <ChatList basePath="/technician/chat" />
      </div>
    </div>
  );
}
