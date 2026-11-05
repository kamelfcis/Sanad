'use client';

import { StarRating } from '@/components/shared/star-rating';
import { Card, CardContent } from '@/components/ui/card';

interface ReviewCardProps {
  rating: number;
  comment?: string | null;
  customerName?: string | null;
  createdAt?: string | null;
}

export function ReviewCard({ rating, comment, customerName, createdAt }: ReviewCardProps) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium">{customerName || 'عميل'}</p>
          <StarRating rating={rating} size="sm" />
        </div>
        {comment ? <p className="text-sm text-muted-foreground">{comment}</p> : null}
        {createdAt ? (
          <p className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(new Date(createdAt))}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
