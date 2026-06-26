'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Heart, Phone, Star, CalendarCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { formatDistanceKm } from '@/lib/geo';
import { buildNewBookingHref } from '@/lib/booking/booking-links';
import { buildLoginHrefWithNext } from '@/lib/auth/safe-redirect';
import { createClient } from '@/lib/supabase/client';
import type { BrowseTechnician, TechnicianBrowseBadge } from '@/types/technician-browse';

const BADGE_LABELS: Record<TechnicianBrowseBadge, { label: string; variant: 'success' | 'warning' | 'secondary' | 'default' }> = {
  verified: { label: 'موثّق', variant: 'success' },
  high_rating: { label: 'تقييم عالي', variant: 'warning' },
  fast_response: { label: 'استجابة سريعة', variant: 'secondary' },
  available: { label: 'متاح', variant: 'success' },
};

interface TechnicianBrowseCardProps {
  technician: BrowseTechnician;
}

export function TechnicianBrowseCard({ technician }: TechnicianBrowseCardProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);

  const initials = useMemo(() => {
    return (technician.full_name ?? 'ص')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [technician.full_name]);

  const bookingHref = buildNewBookingHref({
    serviceId: technician.primary_service_id,
    technicianId: technician.id,
  });

  const handleBook = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push(buildLoginHrefWithNext(bookingHref));
      return;
    }
    router.push(bookingHref);
  };

  const handleCall = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push(buildLoginHrefWithNext(bookingHref));
      return;
    }
    if (technician.phone) {
      window.location.href = `tel:${technician.phone}`;
    }
  };

  const ratingLabel =
    technician.average_rating > 0
      ? technician.average_rating.toFixed(1)
      : '—';

  return (
    <article className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-lg">
      <div className="mb-4 flex items-start gap-4">
        <Link href={bookingHref} className="shrink-0">
          <Avatar className="h-14 w-14 border-2 border-primary/10">
            <AvatarImage src={technician.avatar_url ?? undefined} alt={technician.full_name ?? 'صنايعي'} />
            <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <Link href={bookingHref} className="block">
            <h3
              className="truncate text-lg font-bold text-text-primary transition-colors group-hover:text-primary"
              style={{ fontFamily: 'var(--font-cairo)' }}
            >
              {technician.full_name ?? 'صنايعي'}
            </h3>
            <p className="mt-0.5 text-sm text-text-secondary">
              {technician.specialty_label}
              {technician.area ? ` · ${technician.area}` : ''}
            </p>
          </Link>

          {technician.badges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {technician.badges.map((badge) => (
                <Badge key={badge} variant={BADGE_LABELS[badge].variant} className="text-[10px]">
                  {BADGE_LABELS[badge].label}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label={favorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          onClick={() => setFavorited((value) => !value)}
          className="rounded-full p-2 text-text-muted transition-colors hover:bg-muted hover:text-primary"
        >
          <Heart className={cn('h-5 w-5', favorited && 'fill-primary text-primary')} />
        </button>
      </div>

      <div className="mb-4 flex items-center gap-1 text-sm">
        <Star className="h-4 w-4 fill-warning text-warning" />
        <span className="font-semibold text-text-primary">{ratingLabel}</span>
        <span className="text-text-muted">({technician.completed_jobs} شغلة)</span>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3 rounded-xl bg-muted/50 p-3">
        <div className="text-center">
          <p className="text-lg font-bold text-primary">
            {technician.starting_price > 0 ? `${Math.round(technician.starting_price)}` : '—'}
            {technician.starting_price > 0 && (
              <span className="mr-0.5 text-xs font-medium text-text-muted">ج.م</span>
            )}
          </p>
          <p className="text-[11px] text-text-muted">يبدأ من</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-text-primary">{formatDistanceKm(technician.distance_km)}</p>
          <p className="text-[11px] text-text-muted">المسافة</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-text-primary">{technician.response_time_minutes} د</p>
          <p className="text-[11px] text-text-muted">الاستجابة</p>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <Button type="button" className="w-full gap-2" onClick={handleBook}>
          <CalendarCheck className="h-4 w-4" />
          احجز مع هذا الفني
        </Button>
        {technician.phone && (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleCall}
          >
            <Phone className="h-4 w-4" />
            اتصل
          </Button>
        )}
      </div>
    </article>
  );
}
