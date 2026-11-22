'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useBooking, useBookingsRealtime, useConfirmBookingCompletion } from '@/hooks/use-bookings';
import { useBookingReview } from '@/hooks/use-reviews';
import { useBookingPayment } from '@/hooks/use-payments';
import { BookingStatus } from '@/components/shared/booking-status';
import { CancelBookingDialog } from '@/components/shared/cancel-booking-dialog';
import { PaymentStatusBadge } from '@/components/payments/payment-status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Ban,
  Calendar,
  MapPin,
  Wrench,
  Clock,
  MessageCircle,
  Star,
  Banknote,
  CheckCircle2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatCairoDateTime } from '@/lib/datetime/cairo';
import { getBookingDisplayPrice } from '@/lib/pricing/booking-display-price';
import { formatMoney } from '@/lib/currency/format';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LocationMap } from '@/components/maps/location-map';
import { isCustomerCancellableStatus } from '@/lib/validations/booking';
import { BookingComplaintDialog } from '@/components/customer/booking-complaint-dialog';
import { BookingStatusTimeline } from '@/components/shared/booking-status-timeline';
import { ReviewForm } from '@/components/shared/review-form';

function BookingDetailSkeleton() {
  return (
    <div className="container py-8" aria-busy aria-label="جارٍ التحميل">
      <Skeleton className="mb-4 h-8 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const { data: booking, isLoading, isError, error, refetch, isFetching } = useBooking(id);
  const { data: paymentData } = useBookingPayment(id);
  const { data: existingReview, isLoading: reviewLoading } = useBookingReview(
    booking?.status === 'completed' ? id : '',
  );
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [confirmCompletionOpen, setConfirmCompletionOpen] = useState(false);
  const confirmCompletion = useConfirmBookingCompletion();
  const { profile } = useAuthStore();
  useBookingsRealtime(profile?.id);

  const canCancel = booking ? isCustomerCancellableStatus(booking.status) : false;

  if (!id) {
    return (
      <div className="container py-16 text-center" dir="rtl">
        <h1 className="mb-2 text-2xl font-bold">الحجز غير موجود</h1>
        <p className="mb-6 text-muted-foreground">معرّف الحجز مفقود.</p>
        <Button asChild>
          <Link href="/customer/bookings">رجوع للحجوزات</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <BookingDetailSkeleton />;
  }

  if (isError) {
    return (
      <div className="container py-16" dir="rtl">
        <ErrorState
          title="تعذّر تحميل الحجز"
          description={error instanceof Error ? error.message : 'حدث خطأ أثناء تحميل تفاصيل الحجز.'}
          onRetry={() => {
            void refetch();
          }}
        />
        <div className="mt-6 text-center">
          <Button asChild variant="outline">
            <Link href="/customer/bookings">رجوع للحجوزات</Link>
          </Button>
        </div>
      </div>
    );
  }

  const displayPrice =
    booking != null
      ? getBookingDisplayPrice(booking.price_quote, booking.services?.price ?? null)
      : null;

  if (!booking) {
    return (
      <div className="container py-16 text-center" dir="rtl">
        <h1 className="mb-2 text-2xl font-bold">الحجز غير موجود</h1>
        <p className="mb-6 text-muted-foreground">
          هذا الحجز غير موجود أو ليس لديك صلاحية للوصول إليه.
        </p>
        <Button asChild>
          <Link href="/customer/bookings">رجوع للحجوزات</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8" dir="rtl">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/customer/bookings">
          <ArrowLeft className="ml-1 h-4 w-4" />
          رجوع للحجوزات
        </Link>
      </Button>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight" dir="auto">
              {booking.services?.name_ar ?? 'طلب خدمة'}
            </h1>
            <BookingStatus status={booking.status} />
            {isFetching && (
              <span className="text-xs text-muted-foreground">جارٍ التحديث…</span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            أُنشئ في {formatCairoDateTime(booking.created_at)}
          </p>
        </div>

        {booking.technician?.full_name && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar className="h-11 w-11">
                <AvatarImage
                  src={
                    booking.technician_profile?.profile_photo_url ??
                    booking.technician.avatar_url ??
                    undefined
                  }
                  alt={booking.technician.full_name}
                />
                <AvatarFallback>
                  {booking.technician.full_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground">الفني</p>
                <p className="font-medium">{booking.technician.full_name}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">معلومات الخدمة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium" dir="auto">{booking.services?.name_ar ?? 'خدمة غير معروفة'}</p>
                <p className="text-sm text-muted-foreground">{booking.services?.name_en}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">الوصف</p>
              <p className="mt-1 text-sm" dir="auto">
                {booking.description ?? 'لا يوجد وصف.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">الموقع والوقت</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {booking.location_address && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">العنوان</p>
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
                  {booking.apartment_number && (
                    <p className="mt-2 text-sm">
                      <span className="text-xs text-muted-foreground">رقم الشقة: </span>
                      {booking.apartment_number}
                    </p>
                  )}
                  {booking.floor_number && (
                    <p className="text-sm">
                      <span className="text-xs text-muted-foreground">الدور: </span>
                      {booking.floor_number}
                    </p>
                  )}
                </div>
              </div>
            )}
            {booking.preferred_time && (
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">الوقت المفضّل</p>
                  <p className="text-sm">
                    {formatCairoDateTime(booking.preferred_time)}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
                <p className="text-sm">
                  {formatCairoDateTime(booking.created_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        {booking.booking_images && booking.booking_images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">الصور</CardTitle>
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
                      alt={`صورة الحجز ${i + 1}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    /> {/* eslint-disable-line @next/next/no-img-element */}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment */}
        {displayPrice != null && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">الدفع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">السعر المتفق عليه</span>
                <span className="font-semibold">{formatMoney(displayPrice)}</span>
              </div>
              {paymentData?.payment ? (
                <PaymentStatusBadge
                  status={paymentData.payment.status}
                  rejectionReason={paymentData.payment.rejection_reason}
                />
              ) : (
                <p className="text-sm text-muted-foreground">لم يتم إرسال دفع بعد.</p>
              )}
              <Button className="w-full" variant={paymentData?.payment?.status === 'approved' ? 'outline' : 'default'} asChild>
                <Link href={`/customer/bookings/${id}/payment`}>
                  <Banknote className="ml-1 h-4 w-4" />
                  {paymentData?.payment?.status === 'rejected'
                    ? 'إعادة إرسال الدفع'
                    : paymentData?.payment?.status === 'approved'
                      ? 'عرض الدفع'
                      : paymentData?.payment?.status === 'pending'
                        ? 'عرض حالة الدفع'
                        : 'ادفع الآن'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {booking.status === 'awaiting_customer_confirmation' && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                أنهى الفني العمل. يُرجى التأكيد لإتمام الحجز.
              </p>
              <Button
                type="button"
                className="w-full gap-2"
                disabled={confirmCompletion.isPending}
                onClick={() => setConfirmCompletionOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
                تأكيد اكتمال الخدمة
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Chat */}
        {(booking.status === 'accepted' ||
          booking.status === 'in_progress' ||
          booking.status === 'awaiting_customer_confirmation' ||
          booking.status === 'completed') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">المحادثة مع الفني</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href={`/customer/bookings/${id}/chat`}>
                  <MessageCircle className="ml-1 h-4 w-4" />
                  فتح المحادثة
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Review Prompt */}
        {booking.status === 'completed' && !reviewLoading && !existingReview && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Star className="h-5 w-5 text-amber-500" />
                قيّم تجربتك مع الصنايعي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewForm bookingId={id} redirectHomeOnSuccess />
            </CardContent>
          </Card>
        )}

        {/* Already reviewed */}
        {booking.status === 'completed' && booking.technician_id && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">شكوى</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                مسار منفصل عن التقييم — للإبلاغ عن مشكلة في التنفيذ.
              </p>
              <BookingComplaintDialog bookingId={id} />
            </CardContent>
          </Card>
        )}

        {existingReview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">تقييمك</CardTitle>
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
            <CardTitle className="text-sm font-medium">الحالة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BookingStatusTimeline status={booking.status} />
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm font-medium">الحالة الحالية</span>
              <BookingStatus status={booking.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {booking.status === 'pending' && 'بانتظار قبول فني لطلبك.'}
              {booking.status === 'matched' && 'تم مطابقة فني وإشعاره.'}
              {booking.status === 'accepted' && 'قبل الفني طلبك وهو في الطريق.'}
              {booking.status === 'in_progress' && 'الفني يعمل على طلبك حالياً.'}
              {booking.status === 'awaiting_customer_confirmation' &&
                'أنهى الفني العمل — يُرجى التأكيد لإتمام الحجز.'}
              {booking.status === 'completed' && 'اكتمل طلب الخدمة.'}
              {booking.status === 'cancelled' && 'تم إلغاء طلب الخدمة.'}
              {booking.status === 'disputed' && 'هناك مشكلة متعلقة بهذا الحجز.'}
            </p>
            {booking.status === 'cancelled' && booking.cancellation_reason && (
              <div className="mt-3 rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">سبب الإلغاء</p>
                <p className="mt-1 text-sm" dir="auto">
                  {booking.cancellation_reason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {canCancel && (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium">إلغاء الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                يمكنك إلغاء هذا الطلب قبل بدء تنفيذ الخدمة. سيتم إشعار الفني المعيّن إن وُجد.
              </p>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() => setCancelDialogOpen(true)}
              >
                <Ban className="ml-2 h-4 w-4" />
                إلغاء الطلب
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <CancelBookingDialog
        bookingId={id}
        serviceNameAr={booking.services?.name_ar}
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
      />

      <AlertDialog open={confirmCompletionOpen} onOpenChange={setConfirmCompletionOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد اكتمال الخدمة؟</AlertDialogTitle>
            <AlertDialogDescription>
              بالتأكيد أنت توافق على أن العمل تم بنجاح وسيصبح الحجز مكتملاً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <Button
              type="button"
              disabled={confirmCompletion.isPending}
              onClick={async () => {
                try {
                  await confirmCompletion.mutateAsync(id);
                  setConfirmCompletionOpen(false);
                  toast({
                    title: 'تم تأكيد الاكتمال',
                    description: 'أصبح الحجز مكتملاً. يمكنك ترك تقييم للفني.',
                  });
                } catch (e) {
                  toast({
                    title: 'تعذّر التأكيد',
                    description: e instanceof Error ? e.message : 'حاول مرة أخرى.',
                    variant: 'destructive',
                  });
                }
              }}
            >
              تأكيد الاكتمال
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
