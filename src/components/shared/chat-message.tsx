'use client';

import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';
import { FileText, Image as ImageIcon } from 'lucide-react';

interface ChatMessageProps {
  message: string | null;
  fileUrl: string | null;
  fileType: string | null;
  createdAt: string;
  isOwn: boolean;
  senderName: string | null;
}

export function ChatMessage({ message, fileUrl, fileType, createdAt, isOwn, senderName }: ChatMessageProps) {
  const isImage = fileType?.startsWith('image/');

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        data-testid="chat-message"
        data-message-text={message ?? undefined}
        className={cn(
          'max-w-[75%] space-y-1 rounded-2xl px-4 py-2 shadow-sm',
          isOwn
            ? 'rounded-br-sm bg-gradient-to-br from-[#FF6B00] to-[#FF8A34] text-white'
            : 'rounded-bl-sm bg-muted text-foreground',
        )}
      >
        {!isOwn && senderName && (
          <p className="text-[10px] font-medium opacity-70">{senderName}</p>
        )}

        {message && <p className="text-sm whitespace-pre-wrap break-words">{message}</p>}

        {fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-2 rounded-lg p-2 text-sm',
              isOwn ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20' : 'bg-background/50 hover:bg-background/80',
            )}
          >
            {isImage ? (
              <>
                <ImageIcon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">Photo</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">Document</span>
              </>
            )}
          </a>
        )}

        <p
          className={cn(
            'text-[10px]',
            isOwn ? 'text-white/60' : 'text-muted-foreground',
          )}
        >
          {format(new Date(createdAt), 'h:mm a')}
        </p>
      </div>
    </div>
  );
}
