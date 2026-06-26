'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useBooking } from '@/hooks/use-bookings';
import { useBookingReview } from '@/hooks/use-reviews';
import { useBookingPayment } from '@/hooks/use-payments';
import { BookingStatus } from '@/components/shared/booking-status';
import { PaymentStatusBadge } from '@/components/payments/payment-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, MapPin, Wrench, Clock, MessageCircle, Star, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { LocationMap } from '@/components/maps/location-map';

export default function BookingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: booking, isLoading, error } = useBooking(id);
  const { data: paymentData } = useBookingPayment(id);
  const { data: existingReview, isLoading: reviewLoading } = useBookingReview(
    booking?.status === 'completed' ? id : '',
  );

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">Booking not found</h1>
        <p className="mb-6 text-muted-foreground">
          This booking doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button asChild>
          <Link href="/customer/bookings">Back to bookings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/customer/bookings">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to bookings
        </Link>
      </Button>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight" dir="auto">
              {booking.services?.name_ar ?? 'Service Request'}
            </h1>
            <BookingStatus status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {format(new Date(booking.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
          </p>
        </div>

        {/* Service Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Service Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium" dir="auto">{booking.services?.name_ar ?? 'Unknown Service'}</p>
                <p className="text-sm text-muted-foreground">{booking.services?.name_en}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="mt-1 text-sm" dir="auto">
                {booking.description ?? 'No description provided.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Location & Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {booking.location_address && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">{booking.location_address}</p>
                  {booking.location_lat != null && booking.location_lng != null && (
                    <div className="mt-3" dir="rtl">
                      <LocationMap
                        position={{ lat: booking.location_lat, lng: booking.location_lng }}
                        label={booking.location_address}
                        className="h-[220px] w-full overflow-hidden rounded-xl border border-border"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            {booking.preferred_time && (
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Preferred Time</p>
                  <p className="text-sm">
                    {format(new Date(booking.preferred_time), 'MMMM d, yyyy \'at\' h:mm a')}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">
                  {format(new Date(booking.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        {booking.booking_images && booking.booking_images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {booking.booking_images.map((img, i) => (
                  <a
                    key={i}
                    href={img.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative h-24 w-24 overflow-hidden rounded-lg border"
                  >
                    <img
                      src={img.image_url}
                      alt={`Booking photo ${i + 1}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    /> {/* eslint-disable-line @next/next/no-img-element */}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment */}
        {booking.price_quote != null && Number(booking.price_quote) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-semibold">{Number(booking.price_quote).toFixed(2)} EGP</span>
              </div>
              {paymentData?.payment ? (
                <PaymentStatusBadge
                  status={paymentData.payment.status}
                  rejectionReason={paymentData.payment.rejection_reason}
                />
              ) : (
                <p className="text-sm text-muted-foreground">No payment submitted yet.</p>
              )}
              <Button className="w-full" variant={paymentData?.payment?.status === 'approved' ? 'outline' : 'default'} asChild>
                <Link href={`/customer/bookings/${id}/payment`}>
                  <Banknote className="mr-1 h-4 w-4" />
                  {paymentData?.payment?.status === 'rejected'
                    ? 'Resubmit Payment'
                    : paymentData?.payment?.status === 'approved'
                      ? 'View Payment'
                      : paymentData?.payment?.status === 'pending'
                        ? 'View Payment Status'
                        : 'Pay Now'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Chat */}
        {(booking.status === 'accepted' || booking.status === 'in_progress' || booking.status === 'completed') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Chat with Technician</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href={`/customer/bookings/${id}/chat`}>
                  <MessageCircle className="mr-1 h-4 w-4" />
                  Open Chat
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Review Prompt */}
        {booking.status === 'completed' && !reviewLoading && !existingReview && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardContent className="flex items-center gap-4 p-4">
              <Star className="h-8 w-8 shrink-0 text-amber-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  How was your experience?
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Your feedback helps other customers and technicians.
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href={`/customer/bookings/${id}/review`}>Review</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Already reviewed */}
        {existingReview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Your Review</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < existingReview.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
              {existingReview.comment && (
                <p className="mt-2 text-sm text-muted-foreground">{existingReview.comment}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm font-medium">Current Status</span>
              <BookingStatus status={booking.status} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {booking.status === 'pending' && 'Waiting for a technician to accept your request.'}
              {booking.status === 'matched' && 'A technician has been matched and notified.'}
              {booking.status === 'accepted' && 'A technician has accepted your request and is on the way.'}
              {booking.status === 'in_progress' && 'The technician is working on your request.'}
              {booking.status === 'completed' && 'This service request has been completed.'}
              {booking.status === 'cancelled' && 'This service request was cancelled.'}
              {booking.status === 'disputed' && 'There is an issue with this booking.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
