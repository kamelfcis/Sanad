'use client';

import { cn } from '@/lib/utils/cn';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const sizeMap = {
  sm: 'h-3 w-3',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

export function StarRating({ rating, onChange, maxStars = 5, size = 'md', disabled }: StarRatingProps) {
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => {
        const filled = star <= rating;
        const halfFilled = !filled && star - 0.5 <= rating;

        return (
          <button
            key={star}
            type="button"
            disabled={disabled || !onChange}
            onClick={() => onChange?.(star)}
            className={cn(
              'transition-colors',
              onChange && !disabled ? 'cursor-pointer hover:scale-110' : 'cursor-default',
              disabled && 'opacity-70',
            )}
          >
            <Star
              className={cn(
                sizeMap[size],
                'transition-all',
                filled && 'fill-yellow-400 text-yellow-400',
                halfFilled && 'fill-yellow-400/50 text-yellow-400',
                !filled && !halfFilled && 'fill-none text-muted-foreground/30',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
