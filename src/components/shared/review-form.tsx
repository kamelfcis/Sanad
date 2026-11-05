'use client';

import { useState } from 'react';
import { StarRating } from '@/components/shared/star-rating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface ReviewFormProps {
  bookingId: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ bookingId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId, rating, comment: comment || null }),
    });
    setPending(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({
        title: 'تعذر إرسال التقييم',
        description: typeof err.error === 'string' ? err.error : 'حاول مرة أخرى',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'تم إرسال تقييمك' });
    onSubmitted?.();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <StarRating rating={rating} onChange={setRating} size="lg" />
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="اكتب تعليقك (اختياري)"
        rows={4}
      />
      <Button type="submit" className="w-full" disabled={pending}>
        إرسال التقييم
      </Button>
    </form>
  );
}
