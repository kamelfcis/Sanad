'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAdminBooking, useAdminUpdateBookingStatus } from '@/hooks/use-admin';
import { BookingStatus } from '@/components/shared/booking-status';
import { AssignTechnicianSheet } from '@/components/shared/assign-technician-sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, MapPin, Calendar, Clock, Wrench, User, UserPlus, Ban, CheckCircle, AlertCircle,
} from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { cn } from '@/lib/utils/cn';

export default function AdminBookingDetailPage() {
  const { t, formatDateTime, dir } = useAdminT();
  const params = useParams();
  const id = params.id as string;
  const { data: booking, isLoading, error } = useAdminBooking(id);
  const [showAssignSheet, setShowAssignSheet] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);
  const updateStatus = useAdminUpdateBookingStatus();
  const backIconClass = dir === 'ltr' ? 'mr-1' : 'ml-1';
  const actionIconClass = dir === 'ltr' ? 'mr-1' : 'ml-1';

  const statusActions = [
    { label: t('bookings.detail.markInProgress'), status: 'in_progress', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: t('bookings.detail.markCompleted'), status: 'completed', color: 'bg-green-600 hover:bg-green-700' },
    { label: t('bookings.detail.cancelBooking'), status: 'cancelled', color: 'bg-destructive hover:bg-destructive/90' },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">{t('bookings.detail.notFound')}</h1>
        <p className="mb-6 text-muted-foreground">{t('bookings.detail.notFoundDesc')}</p>
        <Button asChild><Link href="/admin/bookings">{t('bookings.detail.back')}</Link></Button>
      </div>
    );
  }

  const handleStatusUpdate = (status: string) => {
    if (status === 'cancelled' && !cancelReason) {
      setShowCancelInput(true);
      return;
    }
    updateStatus.mutate(
      { bookingId: id, status, reason: cancelReason || undefined },
      { onSuccess: () => { setShowCancelInput(false); setCancelReason(''); } },
    );
  };

  const terminalStatuses = ['completed', 'cancelled', 'disputed'];

  return (
    <div className="p-6">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/admin/bookings">
          <ArrowLeft className={cn('h-4 w-4', backIconClass)} /> {t('bookings.detail.back')}
        </Link>
      </Button>

      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight" dir="auto">
                {booking.services?.name_ar ?? t('bookings.detail.serviceRequest')}
              </h1>
              <BookingStatus status={booking.status} context="admin" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{booking.services?.name_en}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t('bookings.detail.adminActions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => setShowAssignSheet(true)}
              disabled={terminalStatuses.includes(booking.status)}
            >
              <UserPlus className={cn('h-4 w-4', actionIconClass)} /> {t('bookings.detail.assignTechnician')}
            </Button>

            <div className="flex flex-wrap gap-2">
              {statusActions.map((action) => {
                const disabled = terminalStatuses.includes(booking.status) || booking.status === action.status;
                if (action.status === 'cancelled' && showCancelInput) return null;
                return (
                  <Button
                    key={action.status}
                    size="sm"
                    className={action.color}
                    disabled={disabled || updateStatus.isPending}
                    onClick={() => handleStatusUpdate(action.status)}
                  >
                    {action.status === 'cancelled' ? <Ban className={cn('h-4 w-4', actionIconClass)} /> :
                     action.status === 'completed' ? <CheckCircle className={cn('h-4 w-4', actionIconClass)} /> :
                     <AlertCircle className={cn('h-4 w-4', actionIconClass)} />}
                    {action.label}
                  </Button>
                );
              })}
            </div>

            {showCancelInput && (
              <div className="space-y-2 rounded-lg border p-3">
                <Label htmlFor="reason">{t('bookings.detail.cancellationReason')}</Label>
                <Input
                  id="reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={t('bookings.detail.cancellationPlaceholder')}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate('cancelled')} disabled={!cancelReason.trim() || updateStatus.isPending}>
                    {t('bookings.detail.confirmCancel')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowCancelInput(false); setCancelReason(''); }}>
                    {t('common.back')}
                  </Button>
                </div>
              </div>
            )}

            {booking.technician_id && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('bookings.detail.currentlyAssigned')}</p>
                  <p className="text-sm font-medium">{booking.technician_id}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t('bookings.detail.bookingInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium" dir="auto">{booking.services?.name_ar ?? t('bookings.detail.unknownService')}</p>
                <p className="text-sm text-muted-foreground">{booking.services?.name_en}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">{t('bookings.detail.customerId')}</p>
              <p className="mt-1 flex items-center gap-1 text-sm"><User className="h-3 w-3 text-muted-foreground" />{booking.customer_id}</p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">{t('bookings.detail.description')}</p>
              <p className="mt-1 text-sm" dir="auto">{booking.description ?? t('bookings.detail.noDescription')}</p>
            </div>
            <Separator />
            {booking.location_address && (
              <>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div><p className="text-xs text-muted-foreground">{t('bookings.detail.address')}</p><p className="text-sm">{booking.location_address}</p></div>
                </div>
                <Separator />
              </>
            )}
            {booking.preferred_time && (
              <>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('bookings.detail.preferredTime')}</p>
                    <p className="text-sm">{formatDateTime(booking.preferred_time)}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('bookings.detail.created')}</p>
                <p className="text-sm">{formatDateTime(booking.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AssignTechnicianSheet bookingId={id} open={showAssignSheet} onOpenChange={setShowAssignSheet} />
    </div>
  );
}
