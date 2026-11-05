'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (message: string) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const message = value.trim();
    if (!message || sending || disabled) return;
    setSending(true);
    try {
      await onSend(message);
      setValue('');
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      className="flex items-end gap-2 border-t bg-background p-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <label htmlFor="chat-input" className="sr-only">
        رسالة
      </label>
      <Textarea
        id="chat-input"
        data-testid="chat-input"
        name="message"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="اكتب رسالة…"
        rows={1}
        disabled={disabled || sending}
        className="min-h-11 resize-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void submit();
          }
        }}
      />
      <Button type="submit" size="icon" disabled={disabled || sending || !value.trim()} aria-label="إرسال">
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </form>
  );
}
