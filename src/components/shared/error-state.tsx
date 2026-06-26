'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'حدث خطأ',
  description = 'تعذّر تحميل البيانات. يرجى المحاولة مرة أخرى.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center',
        className,
      )}
      role="alert"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" aria-hidden />
      </div>
      <div>
        <h2 className="font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="ml-2 h-4 w-4" />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
