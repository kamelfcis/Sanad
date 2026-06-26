import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';

interface PageLoadingProps {
  variant?: 'default' | 'list' | 'card' | 'chat';
  className?: string;
}

export function PageLoading({ variant = 'default', className }: PageLoadingProps) {
  if (variant === 'list') {
    return (
      <div className={cn('space-y-3', className)} aria-busy aria-label="Loading">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl border p-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('space-y-4', className)} aria-busy aria-label="Loading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (variant === 'chat') {
    return (
      <div className={cn('space-y-3 p-4', className)} aria-busy aria-label="Loading">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
            <Skeleton
              className={cn(
                'h-12 w-48 rounded-2xl',
                i % 2 === 0 ? 'rounded-bl-sm' : 'rounded-br-sm',
              )}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('mx-auto w-full max-w-md space-y-4 p-8', className)}
      aria-busy
      aria-label="Loading"
    >
      <Skeleton className="mx-auto h-12 w-12 rounded-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
