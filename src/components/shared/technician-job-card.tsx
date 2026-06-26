'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { BookingStatus } from '@/components/shared/booking-status';
import { MapPin, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/cn';

interface TechnicianJobCardProps {
  id: string;
  status: string;
  description: string | null;
  location_address: string | null;
  created_at: string;
  preferred_time: string | null;
  services: { name_ar: string; name_en: string } | null;
  profiles: { full_name: string | null } | null;
  distance?: number | null;
  href?: string;
}

export function TechnicianJobCard({
  status,
  description,
  location_address,
  created_at,
  services,
  profiles,
  href,
}: TechnicianJobCardProps) {
  const card = (
    <Card className={cn('transition-all', href && 'cursor-pointer hover:border-primary/50 hover:shadow-sm')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-medium" dir="auto">
                {services?.name_ar ?? 'Service Request'}
              </h3>
              <BookingStatus status={status} />
            </div>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {services?.name_en}
            </p>

            {description && (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {profiles?.full_name ?? 'Customer'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(created_at), 'MMM d, h:mm a')}
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
      </CardContent>
    </Card>
  );

  if (!href) return card;

  return (
    <Link href={href} className="block">
      {card}
    </Link>
  );
}
