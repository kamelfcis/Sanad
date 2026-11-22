'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookingStatus } from '@/components/shared/booking-status';
import { CancelBookingDialog } from '@/components/shared/cancel-booking-dialog';
import { isCustomerCancellableStatus } from '@/lib/validations/booking';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Ban, Banknote, Calendar, MapPin, Star, Wrench } from 'lucide-react';
import { formatCairoDateTime } from '@/lib/datetime/cairo';
import { getBookingDisplayPrice } from '@/lib/pricing/booking-display-price';
import { formatMoney } from '@/lib/currency/format';
import type { BookingTechnicianInfo, BookingTechnicianProfile } from '@/hooks/use-bookings';

interface BookingCardProps {
  id: string;
  status: string;
  description: string | null;
  location_address: string | null;
  created_at: string;
  price_quote?: number | null;
  services: { name_ar: string; name_en: string; price?: number | null } | null;
  technician?: BookingTechnicianInfo | null;
  technician_profile?: BookingTechnicianProfile | null;
}

export function BookingCard({
  id,
  status,
  description,
  location_address,
  created_at,
  price_quote,
  services,
  technician,
  technician_profile,
}: BookingCardProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const canCancel = isCustomerCancellableStatus(status);
  const displayPrice = getBookingDisplayPrice(price_quote, services?.price ?? null);
  const techPhoto =
    technician_profile?.profile_photo_url ?? technician?.avatar_url ?? undefined;
  const techName = technician?.full_name?.trim();
  const showRateCta = status === 'completed';

  return (
    <>
      <Card className="transition-all hover:border-primary/50 hover:shadow-sm" dir="rtl">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <Link
              href={`/customer/bookings/${id}`}
              className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium" dir="auto">
                      {services?.name_ar ?? 'خدمة'}
                    </h3>
                    <BookingStatus status={status} />
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatCairoDateTime(created_at, { dateStyle: 'medium' })}
                    </span>
                    {location_address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {location_address}
                      </span>
                    )}
                    {displayPrice != null && (
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Banknote className="h-3 w-3" />
                        {formatMoney(displayPrice)}
                      </span>
                    )}
                  </div>
                  {techName && (
                    <div className="mt-2 flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={techPhoto} alt={techName} />
                        <AvatarFallback className="text-[10px]">
                          {techName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{techName}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>

            <div className="flex shrink-0 flex-col gap-2">
              {showRateCta && (
                <Button type="button" variant="secondary" size="sm" asChild>
                  <Link href={`/customer/bookings/${id}/review`}>
                    <Star className="ml-1 h-3.5 w-3.5" />
                    قم بالتقييم
                  </Link>
                </Button>
              )}
            {canCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                data-testid="booking-card-cancel"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCancelOpen(true);
                }}
              >
                <Ban className="ml-1 h-3.5 w-3.5" />
                إلغاء
              </Button>
            )}
            </div>
          </div>
        </CardContent>
      </Card>

      {canCancel && (
        <CancelBookingDialog
          bookingId={id}
          serviceNameAr={services?.name_ar}
          open={cancelOpen}
          onOpenChange={setCancelOpen}
        />
      )}
    </>
  );
}
