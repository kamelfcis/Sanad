'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSend: (text: string) => Promise<void>;
  onFileUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export function ChatInput({ onSend, onFileUpload, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!text.trim()) return;
    setIsSending(true);
    try {
      await onSend(text);
      setText('');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum size is 10MB.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      await onFileUpload(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isLoading = isSending || isUploading;

  return (
    <div className="flex items-end gap-2 border-t bg-background p-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileSelect}
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isLoading}
        className="shrink-0"
      >
        {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
      </Button>
      <div className="flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={disabled || isLoading}
          className="w-full resize-none rounded-xl border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          style={{ minHeight: 36, maxHeight: 120 }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
          }}
        />
      </div>
      <Button
        type="button"
        size="icon"
        onClick={handleSend}
        disabled={disabled || isLoading || !text.trim()}
        className="shrink-0"
      >
        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
      </Button>
    </div>
  );
}
