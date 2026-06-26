'use client';

import { StarRating } from '@/components/shared/star-rating';
import { cn } from '@/lib/utils/cn';

interface RatingSummaryProps {
  averageRating: number;
  totalRatings: number;
  distribution?: Record<number, number>;
}

export function RatingSummary({ averageRating, totalRatings, distribution }: RatingSummaryProps) {
  const defaultDist: Record<number, number> = distribution ?? {};
  const dist: Record<number, number> = {
    5: defaultDist[5] ?? 0,
    4: defaultDist[4] ?? 0,
    3: defaultDist[3] ?? 0,
    2: defaultDist[2] ?? 0,
    1: defaultDist[1] ?? 0,
  };
  const maxCount = Math.max(...Object.values(dist), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-4xl font-bold">{averageRating > 0 ? averageRating.toFixed(1) : '—'}</p>
          <StarRating rating={Math.round(averageRating)} size="sm" disabled />
          <p className="mt-1 text-xs text-muted-foreground">{totalRatings} review{totalRatings !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-right font-medium">{star}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    star >= 4 ? 'bg-green-500' : star >= 3 ? 'bg-yellow-400' : 'bg-red-400',
                  )}
                  style={{ width: `${(dist[star] / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-muted-foreground">{dist[star]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
