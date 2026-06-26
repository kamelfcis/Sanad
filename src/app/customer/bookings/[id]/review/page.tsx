'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBooking } from '@/hooks/use-bookings';
import { useCreateReview } from '@/hooks/use-reviews';
import { ReviewForm } from '@/components/shared/review-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: booking, isLoading, error } = useBooking(id);
  const createReview = useCreateReview();

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mx-auto h-96 w-full max-w-lg rounded-xl" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">Booking not found</h1>
        <Button asChild>
          <Link href="/customer/bookings">Back to bookings</Link>
        </Button>
      </div>
    );
  }

  if (booking.status !== 'completed') {
    return (
      <div className="container py-16 text-center">
        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <h1 className="mb-2 text-xl font-bold">Booking not yet completed</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          You can only review completed bookings.
        </p>
        <Button asChild>
          <Link href={`/customer/bookings/${id}`}>Back to booking</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (rating: number, comment: string) => {
    await createReview.mutateAsync({
      booking_id: id,
      rating,
      comment: comment || undefined,
    });
    toast({
      title: 'تم إرسال التقييم!',
      description: 'شكراً لملاحظاتك القيّمة.',
    });
    router.push(`/customer/bookings/${id}`);
  };

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/customer/bookings/${id}`}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to booking
        </Link>
      </Button>

      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Leave a Review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rate the service you received for{' '}
            <span dir="auto" className="font-medium">
              {booking.services?.name_ar ?? 'your request'}
            </span>
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <ReviewForm onSubmit={handleSubmit} isSubmitting={createReview.isPending} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
