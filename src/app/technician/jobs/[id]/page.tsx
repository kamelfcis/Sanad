'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTechnicianAssignment, useRespondToAssignment } from '@/hooks/use-technician';
import { BookingStatus } from '@/components/shared/booking-status';
import { AssignmentStatus } from '@/components/shared/assignment-status';
import { JobActionBar } from '@/components/shared/job-action-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MapPin, Calendar, Clock, Wrench, Phone, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { LocationMap } from '@/components/maps/location-map';

export default function TechnicianJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: assignment, isLoading, error } = useTechnicianAssignment(id);
  const respondMutation = useRespondToAssignment();

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
        <h1 className="mb-2 text-2xl font-bold">Job not found</h1>
        <p className="mb-6 text-muted-foreground">
          This job doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button asChild>
          <Link href="/technician/jobs">Back to jobs</Link>
        </Button>
      </div>
    );
  }

  const booking = assignment.booking;
  const customerName = booking.profiles?.full_name ?? 'Customer';
  const initials = customerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleAccept = async () => {
    await respondMutation.mutateAsync({ id: assignment.id, action: 'accept' });
    toast({
      title: 'Job accepted!',
      description: 'Contact the customer to confirm the details.',
    });
    router.refresh();
  };

  const handleReject = async () => {
    await respondMutation.mutateAsync({ id: assignment.id, action: 'reject' });
    toast({
      title: 'Job declined',
      description: 'The job will be offered to another technician.',
    });
    router.refresh();
  };

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/technician/jobs">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to jobs
        </Link>
      </Button>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight" dir="auto">
                {booking.services?.name_ar ?? 'Service Request'}
              </h1>
              <BookingStatus status={booking.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {booking.services?.name_en}
            </p>
          </div>
          <AssignmentStatus status={assignment.status} />
        </div>

        {/* Action Bar */}
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

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={booking.profiles?.avatar_url ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{customerName}</p>
                {booking.profiles?.phone && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {booking.profiles.phone}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        {(booking.status === 'accepted' || booking.status === 'in_progress' || booking.status === 'completed') && (
          <Card>
            <CardContent className="p-4">
              <Button className="w-full" asChild>
                <Link href={`/technician/jobs/${booking.id}/chat`}>
                  <MessageCircle className="mr-1 h-4 w-4" />
                  Open Chat
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Job Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium" dir="auto">{booking.services?.name_ar ?? 'Service'}</p>
                <p className="text-sm text-muted-foreground">{booking.services?.name_en}</p>
              </div>
            </div>
            {booking.description && (
              <>
                <Separator className="my-3" />
                <p className="text-sm text-muted-foreground" dir="auto">
                  {booking.description}
                </p>
              </>
            )}
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
                <p className="text-xs text-muted-foreground">Requested</p>
                <p className="text-sm">
                  {format(new Date(booking.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
