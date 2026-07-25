'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useTechnicianAssignment,
  useRespondToAssignment,
  useUpdateBookingStatus,
} from '@/hooks/use-technician';
import { BookingStatus } from '@/components/shared/booking-status';
import { AssignmentStatus } from '@/components/shared/assignment-status';
import { JobActionBar } from '@/components/shared/job-action-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowRight,
  MapPin,
  Calendar,
  Clock,
  Wrench,
  Phone,
  MessageCircle,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LocationMap } from '@/components/maps/location-map';
import { toTelHref } from '@/lib/utils/phone';

function formatArabicDateTime(value: string): string {
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export default function TechnicianJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: assignment, isLoading, error } = useTechnicianAssignment(id);
  const respondMutation = useRespondToAssignment();
  const statusMutation = useUpdateBookingStatus();

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="container py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">لم يتم العثور على الطلب</h1>
        <p className="mb-6 text-muted-foreground">
          هذا الطلب غير موجود أو لا تملك صلاحية الوصول إليه.
        </p>
        <Button asChild>
          <Link href="/technician/jobs">العودة إلى الطلبات</Link>
        </Button>
      </div>
    );
  }

  const booking = assignment.booking;
  const customerPhone = booking.profiles?.phone?.trim() ?? '';
  const customerName = booking.profiles?.full_name?.trim() || customerPhone || 'العميل';
  const canCallCustomer =
    !!customerPhone &&
    (booking.status === 'accepted' ||
      booking.status === 'in_progress' ||
      booking.status === 'completed');
  const initials = customerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleAccept = async () => {
    await respondMutation.mutateAsync({ id: assignment.id, action: 'accept' });
    toast({ title: 'تم قبول الطلب', description: 'تواصل مع العميل لتأكيد التفاصيل.' });
    router.refresh();
  };

  const handleReject = async () => {
    await respondMutation.mutateAsync({ id: assignment.id, action: 'reject' });
    toast({ title: 'تم رفض الطلب', description: 'سيتم عرض الطلب على فني آخر.' });
    router.refresh();
  };

  const handleStart = async () => {
    await statusMutation.mutateAsync({ bookingId: booking.id, status: 'in_progress' });
    toast({ title: 'تم بدء العمل', description: 'تم إعلام العميل ببدء تنفيذ الخدمة.' });
    router.refresh();
  };

  const handleComplete = async () => {
    await statusMutation.mutateAsync({ bookingId: booking.id, status: 'completed' });
    toast({ title: 'تم إنهاء العمل', description: 'تم إعلام العميل باكتمال الخدمة.' });
    router.refresh();
  };

  return (
    <div className="container py-8" dir="rtl">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/technician/jobs" className="gap-2">
          <ArrowRight className="h-4 w-4" />
          العودة إلى الطلبات
        </Link>
      </Button>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {booking.services?.name_ar ?? 'طلب خدمة'}
              </h1>
              <BookingStatus status={booking.status} />
            </div>
          </div>
          <AssignmentStatus status={assignment.status} />
        </div>

        {/* Action Bar (accept / decline while pending) */}
        <Card>
          <CardContent className="p-4">
            <JobActionBar
              assignmentId={assignment.id}
              status={assignment.status}
              createdAt={assignment.created_at}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          </CardContent>
        </Card>

        {/* Job lifecycle — Start / Complete */}
        {booking.status === 'accepted' && (
          <Card>
            <CardContent className="p-4">
              <Button
                type="button"
                className="h-11 w-full gap-2 rounded-xl font-bold"
                onClick={handleStart}
                disabled={statusMutation.isPending}
              >
                <Play className="h-5 w-5" />
                بدء العمل
              </Button>
            </CardContent>
          </Card>
        )}
        {booking.status === 'in_progress' && (
          <Card>
            <CardContent className="p-4">
              <Button
                type="button"
                className="h-11 w-full gap-2 rounded-xl font-bold"
                onClick={handleComplete}
                disabled={statusMutation.isPending}
              >
                <CheckCircle2 className="h-5 w-5" />
                إنهاء العمل
              </Button>
            </CardContent>
          </Card>
        )}
        {booking.status === 'completed' && (
          <Card>
            <CardContent className="flex items-center gap-2 p-4 text-sm font-medium text-success">
              <CheckCircle2 className="h-5 w-5" />
              تم إنجاز الخدمة بنجاح.
            </CardContent>
          </Card>
        )}

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">العميل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={booking.profiles?.avatar_url ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{customerName}</p>
                {customerPhone && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {customerPhone}
                  </div>
                )}
              </div>
            </div>
            {canCallCustomer && (
              <Button
                asChild
                size="lg"
                className="mt-4 h-11 w-full gap-2 rounded-xl bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
              >
                <a href={toTelHref(customerPhone)}>
                  <Phone className="h-5 w-5" />
                  اتصل بالعميل
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Chat */}
        {(booking.status === 'accepted' ||
          booking.status === 'in_progress' ||
          booking.status === 'completed') && (
          <Card>
            <CardContent className="p-4">
              <Button className="h-11 w-full gap-2 rounded-xl font-bold" asChild>
                <Link href={`/technician/jobs/${booking.id}/chat`}>
                  <MessageCircle className="h-4 w-4" />
                  فتح المحادثة
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">تفاصيل الطلب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{booking.services?.name_ar ?? 'الخدمة'}</p>
              </div>
            </div>
            {booking.description && (
              <>
                <Separator className="my-3" />
                <p className="text-sm text-muted-foreground">{booking.description}</p>
              </>
            )}
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
                    <div className="mt-3">
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
                  <p className="text-xs text-muted-foreground">الوقت المفضل</p>
                  <p className="text-sm">{formatArabicDateTime(booking.preferred_time)}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">تاريخ الطلب</p>
                <p className="text-sm">{formatArabicDateTime(booking.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
