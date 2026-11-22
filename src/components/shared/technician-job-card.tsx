'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { BookingStatus } from '@/components/shared/booking-status';
import { Calendar, Banknote, MapPin, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { getBookingDisplayPrice } from '@/lib/pricing/booking-display-price';
import { formatMoney } from '@/lib/currency/format';

interface TechnicianJobCardProps {
  id?: string;
  status?: string;
  description?: string | null;
  location_address?: string | null;
  created_at?: string;
  price_quote?: number | null;
  services?: { name_ar: string; name_en?: string; price?: number | null } | null;
  href: string;
}

export function TechnicianJobCard({
  status = 'pending',
  description,
  location_address,
  created_at,
  price_quote,
  services,
  href,
}: TechnicianJobCardProps) {
  const displayPrice = getBookingDisplayPrice(price_quote, services?.price ?? null);
  return (
    <Link href={href} className="block">
      <Card className="transition-all hover:border-primary/50 hover:shadow-sm" dir="rtl">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-semibold">
                <Wrench className="h-4 w-4 text-primary" />
                {services?.name_ar ?? 'طلب خدمة'}
              </p>
              {description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <BookingStatus status={status} />
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {created_at ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(created_at), 'yyyy-MM-dd')}
              </span>
            ) : null}
            {location_address ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {location_address}
              </span>
            ) : null}
            {displayPrice != null ? (
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <Banknote className="h-3 w-3" />
                {formatMoney(displayPrice)}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
