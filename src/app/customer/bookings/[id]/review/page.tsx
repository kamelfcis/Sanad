'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ReviewForm } from '@/components/shared/review-form';
import { Button } from '@/components/ui/button';

export default function BookingReviewPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="container max-w-lg py-8" dir="rtl">
      <h1 className="mb-2 text-2xl font-bold">تقييم الخدمة</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        ساعد الآخرين باختيار تقييم يعكس تجربتك مع الفني.
      </p>
      <ReviewForm bookingId={id} redirectHomeOnSuccess />
      <Button asChild variant="ghost" className="mt-6">
        <Link href={`/customer/bookings/${id}`}>العودة للحجز</Link>
      </Button>
    </div>
  );
}
