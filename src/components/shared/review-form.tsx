'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { StarRating } from '@/components/shared/star-rating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface ReviewFormProps {
  bookingId: string;
  redirectHomeOnSuccess?: boolean;
  onSubmitted?: () => void;
}

export function ReviewForm({ bookingId, redirectHomeOnSuccess, onSubmitted }: ReviewFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!submitted) return;
    const timer = window.setTimeout(() => {
      if (redirectHomeOnSuccess) {
        router.push('/');
      } else {
        router.push(`/customer/bookings/${bookingId}`);
      }
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [bookingId, redirectHomeOnSuccess, router, submitted]);

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
    toast({ title: 'تم التقييم وإنهاء الطلب بنجاح' });
    onSubmitted?.();
    await queryClient.invalidateQueries({ queryKey: ['booking-review', bookingId] });
    await queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-800 dark:bg-emerald-950"
        role="status"
      >
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
        <p className="mt-2 font-semibold text-emerald-900 dark:text-emerald-100">
          تم التقييم وإنهاء الطلب بنجاح
        </p>
        <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-200/80">
          {redirectHomeOnSuccess ? 'سنعيدك إلى الرئيسية…' : 'سنعيدك إلى الحجز…'}
        </p>
      </div>
    );
  }

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
