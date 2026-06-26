'use client';

import { StarRating } from '@/components/shared/star-rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface ReviewCardProps {
  rating: number;
  comment: string | null;
  createdAt: string;
  customerName: string | null;
  customerAvatar: string | null;
}

export function ReviewCard({ rating, comment, createdAt, customerName, customerAvatar }: ReviewCardProps) {
  const initials = (customerName ?? '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={customerAvatar ?? undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{customerName ?? 'Anonymous'}</p>
            <span className="text-xs text-muted-foreground">
              {format(new Date(createdAt), 'MMM d, yyyy')}
            </span>
          </div>
          <StarRating rating={rating} size="sm" disabled />
          {comment && (
            <p className="mt-2 text-sm text-muted-foreground">{comment}</p>
          )}
        </div>
      </div>
    </div>
  );
}
