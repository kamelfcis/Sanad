'use client';

import { ChatList } from '@/components/shared/chat-list';
import { PageTransition } from '@/components/animations';

export default function CustomerChatPage() {
  return (
    <PageTransition className="container py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">المحادثات</h1>
          <p className="mt-1 text-muted-foreground">محادثاتك مع الفنيين.</p>
        </div>
        <ChatList basePath="/customer/chat" />
      </div>
    </PageTransition>
  );
}
