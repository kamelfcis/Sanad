'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { BookingStatus } from '@/components/shared/booking-status';
import { Calendar, MapPin, Wrench } from 'lucide-react';
import { format } from 'date-fns';

interface BookingCardProps {
  id: string;
  status: string;
  description: string | null;
  location_address: string | null;
  created_at: string;
  services: { name_ar: string; name_en: string } | null;
}

export function BookingCard({
  id,
  status,
  description,
  location_address,
  created_at,
  services,
}: BookingCardProps) {
  return (
    <Link href={`/customer/bookings/${id}`}>
      <Card className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium" dir="auto">
                    {services?.name_ar ?? 'Service'}
                  </h3>
                  <BookingStatus status={status} />
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(created_at), 'MMM d, yyyy')}
                  </span>
                  {location_address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {location_address}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
