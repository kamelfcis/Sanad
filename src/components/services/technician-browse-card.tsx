'use client';

import Link from 'next/link';
import { useFormatMoney } from '@/hooks/use-site-settings';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Heart, Phone, Star, CalendarCheck, ShieldCheck, WifiOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { formatDistanceKm } from '@/lib/geo';
import { buildNewBookingHref } from '@/lib/booking/booking-links';
import { buildLoginHrefWithNext } from '@/lib/auth/safe-redirect';
import { createClient } from '@/lib/supabase/client';
import type { BrowseTechnician, TechnicianBrowseBadge } from '@/types/technician-browse';

const BADGE_LABELS: Record<
  TechnicianBrowseBadge,
  { label: string; variant: 'success' | 'warning' | 'secondary' | 'default'; icon?: typeof ShieldCheck }
> = {
  verified: { label: 'موثّق', variant: 'success', icon: ShieldCheck },
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
  const { formatMoney } = useFormatMoney();

  const isOffline = !technician.is_available;
  const displayName = technician.full_name ?? 'صنايعي';

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

  // The `available` badge is redundant next to the dedicated offline badge.
  const visibleBadges = isOffline
    ? technician.badges.filter((badge) => badge !== 'available')
    : technician.badges;

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

  const ratingLabel = technician.average_rating > 0 ? technician.average_rating.toFixed(1) : '—';

  return (
    <article
      dir="rtl"
      aria-label={`${displayName} — ${isOffline ? 'غير متاح' : 'متاح'}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card bg-gradient-to-br from-card via-card to-muted/20 p-5 shadow-sm transition-all duration-200',
        isOffline ? 'opacity-60 grayscale' : 'hover:border-primary/30 hover:shadow-lg',
      )}
    >
      <div className="mb-4 flex items-start gap-4">
        <div className="relative shrink-0">
          <Link href={bookingHref} className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <Avatar
              className={cn(
                'h-14 w-14 ring-2 ring-offset-2 ring-offset-background',
                isOffline ? 'ring-zinc-300 dark:ring-zinc-600' : 'ring-primary/20',
              )}
            >
              <AvatarImage
                src={technician.avatar_url ?? undefined}
                alt={displayName}
                loading="lazy"
                width={56}
                height={56}
              />
              <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
          </Link>

          {/* Presence dot — the card's live signal. */}
          <span className="absolute bottom-0 end-0 flex h-3 w-3">
            {!isOffline && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70 motion-reduce:animate-none" />
            )}
            <span
              className={cn(
                'relative inline-flex h-3 w-3 rounded-full ring-2 ring-background',
                isOffline ? 'bg-zinc-400' : 'bg-emerald-500',
              )}
            />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          {isOffline && (
            <Badge variant="secondary" className="mb-1.5 gap-1 text-xs font-semibold">
              <WifiOff className="h-3 w-3" />
              غير متاح الآن
            </Badge>
          )}

          <Link href={bookingHref} className="block">
            <div className={cn(!isOffline && 'border-s-2 border-primary ps-2')}>
              <h3
                className="truncate text-lg font-bold text-text-primary transition-colors group-hover:text-primary"
                style={{ fontFamily: 'var(--font-cairo)' }}
              >
                {displayName}
              </h3>
              <p className="mt-0.5 truncate text-sm text-text-secondary">
                {technician.specialty_label}
                {technician.area ? ` · ${technician.area}` : ''}
              </p>
            </div>
          </Link>

          {visibleBadges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {visibleBadges.map((badge) => {
                const Icon = BADGE_LABELS[badge].icon;
                return (
                  <Badge
                    key={badge}
                    variant={BADGE_LABELS[badge].variant}
                    className="gap-1 text-xs font-semibold"
                  >
                    {Icon ? <Icon className="h-3 w-3" /> : null}
                    {BADGE_LABELS[badge].label}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label={favorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          onClick={() => setFavorited((value) => !value)}
          className="rounded-full p-2 text-text-muted transition-colors touch-manipulation hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Heart className={cn('h-5 w-5', favorited && 'fill-primary text-primary')} />
        </button>
      </div>

      <div className="mb-4 flex items-center gap-1 text-sm">
        <Star className="h-4 w-4 fill-warning text-warning" />
        <span className="font-semibold text-text-primary">{ratingLabel}</span>
        <span className="text-text-muted">({technician.completed_jobs} شغلة)</span>
      </div>

      <div className="mb-5 grid grid-cols-3 divide-x divide-border rtl:divide-x-reverse rounded-xl bg-muted/50 p-4">
        <div className="px-1 text-center">
          <p className="text-xl font-black text-primary">
            {technician.starting_price > 0 ? formatMoney(Math.round(technician.starting_price)) : '—'}
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">يبدأ من</p>
        </div>
        <div className="px-1 text-center">
          <p className="text-xl font-black text-text-primary">{formatDistanceKm(technician.distance_km)}</p>
          <p className="mt-0.5 text-[11px] text-text-muted">المسافة</p>
        </div>
        <div className="px-1 text-center">
          <p className="text-xl font-black text-text-primary">{technician.response_time_minutes} د</p>
          <p className="mt-0.5 text-[11px] text-text-muted">الاستجابة</p>
        </div>
      </div>

      <div className={cn('mt-auto flex flex-col gap-2', isOffline && 'cursor-not-allowed')}>
        <Button
          type="button"
          className="h-11 w-full gap-2 rounded-xl font-bold touch-manipulation"
          onClick={handleBook}
          disabled={isOffline}
          aria-disabled={isOffline}
        >
          <CalendarCheck className="h-4 w-4" />
          {isOffline ? 'غير متاح حالياً' : 'احجز مع هذا الفني'}
        </Button>
        {!isOffline && technician.phone && (
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full gap-2 rounded-xl font-bold touch-manipulation"
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
