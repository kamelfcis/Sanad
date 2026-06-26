'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Star } from 'lucide-react';

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function ReviewForm({ onSubmit, isSubmitting }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async () => {
    if (rating === 0) return;
    await onSubmit(rating, comment);
  };

  const displayRating = hoveredRating || rating;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="mb-2 text-sm font-medium">Rate your experience</p>
        <div
          className="inline-flex flex-col items-center gap-2"
          onMouseLeave={() => setHoveredRating(0)}
        >
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                className="cursor-pointer transition-transform hover:scale-110"
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    star <= displayRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-none text-muted-foreground/30'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {rating === 0 && 'Tap a star to rate'}
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Below average'}
            {rating === 3 && 'Average'}
            {rating === 4 && 'Good'}
            {rating === 5 && 'Excellent!'}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="review-comment" className="text-sm font-medium">
          Comment (optional)
        </label>
        <Textarea
          id="review-comment"
          placeholder="Share your experience with this technician..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px]"
          maxLength={1000}
        />
        <p className="text-right text-xs text-muted-foreground">{comment.length}/1000</p>
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={rating === 0 || isSubmitting}
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Review
      </Button>
    </div>
  );
}
