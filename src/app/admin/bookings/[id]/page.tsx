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
import { format } from 'date-fns';

const statusActions = [
  { label: 'Mark In Progress', status: 'in_progress', color: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'Mark Completed', status: 'completed', color: 'bg-green-600 hover:bg-green-700' },
  { label: 'Cancel Booking', status: 'cancelled', color: 'bg-destructive hover:bg-destructive/90' },
];

export default function AdminBookingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: booking, isLoading, error } = useAdminBooking(id);
  const [showAssignSheet, setShowAssignSheet] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);
  const updateStatus = useAdminUpdateBookingStatus();

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
        <h1 className="mb-2 text-2xl font-bold">Booking not found</h1>
        <p className="mb-6 text-muted-foreground">This booking doesn&apos;t exist or you don&apos;t have access to it.</p>
        <Button asChild><Link href="/admin/bookings">Back to bookings</Link></Button>
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
        <Link href="/admin/bookings"><ArrowLeft className="mr-1 h-4 w-4" /> Back to bookings</Link>
      </Button>

      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight" dir="auto">
                {booking.services?.name_ar ?? 'Service Request'}
              </h1>
              <BookingStatus status={booking.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{booking.services?.name_en}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => setShowAssignSheet(true)}
              disabled={terminalStatuses.includes(booking.status)}
            >
              <UserPlus className="mr-1 h-4 w-4" /> Assign Technician
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
                    {action.status === 'cancelled' ? <Ban className="mr-1 h-4 w-4" /> :
                     action.status === 'completed' ? <CheckCircle className="mr-1 h-4 w-4" /> :
                     <AlertCircle className="mr-1 h-4 w-4" />}
                    {action.label}
                  </Button>
                );
              })}
            </div>

            {showCancelInput && (
              <div className="space-y-2 rounded-lg border p-3">
                <Label htmlFor="reason">Cancellation reason</Label>
                <Input
                  id="reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Required reason for cancellation..."
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate('cancelled')} disabled={!cancelReason.trim() || updateStatus.isPending}>
                    Confirm Cancel
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowCancelInput(false); setCancelReason(''); }}>
                    Back
                  </Button>
                </div>
              </div>
            )}

            {booking.technician_id && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Currently assigned to</p>
                  <p className="text-sm font-medium">{booking.technician_id}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Booking Information</CardTitle>
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
              <p className="text-xs text-muted-foreground">Customer ID</p>
              <p className="mt-1 flex items-center gap-1 text-sm"><User className="h-3 w-3 text-muted-foreground" />{booking.customer_id}</p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="mt-1 text-sm" dir="auto">{booking.description ?? 'No description provided.'}</p>
            </div>
            <Separator />
            {booking.location_address && (
              <>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div><p className="text-xs text-muted-foreground">Address</p><p className="text-sm">{booking.location_address}</p></div>
                </div>
                <Separator />
              </>
            )}
            {booking.preferred_time && (
              <>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Preferred Time</p>
                    <p className="text-sm">{format(new Date(booking.preferred_time), 'MMMM d, yyyy \'at\' h:mm a')}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">{format(new Date(booking.created_at), 'MMMM d, yyyy \'at\' h:mm a')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AssignTechnicianSheet bookingId={id} open={showAssignSheet} onOpenChange={setShowAssignSheet} />
    </div>
  );
}
