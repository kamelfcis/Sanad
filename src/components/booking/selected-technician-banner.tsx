'use client';

import Link from 'next/link';
import { Star, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useTechnicianPreview } from '@/hooks/use-browse-technicians';

interface SelectedTechnicianBannerProps {
  technicianId: string;
}

export function SelectedTechnicianBanner({ technicianId }: SelectedTechnicianBannerProps) {
  const { data: technician, isLoading, error } = useTechnicianPreview(technicianId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    );
  }

  if (error || !technician) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        تعذّر تحميل بيانات الصنايعي.{' '}
        <Link href="/services" className="font-medium underline">
          ارجع لاختيار صنايعي آخر
        </Link>
      </div>
    );
  }

  const initials = (technician.full_name ?? 'ص')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const ratingLabel =
    technician.average_rating > 0 ? technician.average_rating.toFixed(1) : '—';

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 border-2 border-primary/20">
          <AvatarImage src={technician.avatar_url ?? undefined} alt={technician.full_name ?? 'صنايعي'} />
          <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary">أنت تحجز مع:</p>
          <p className="mt-0.5 text-lg font-bold text-text-primary">{technician.full_name ?? 'صنايعي'}</p>
          <p className="text-sm text-text-secondary">{technician.specialty_label}</p>
          <div className="mt-1 flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="font-semibold">{ratingLabel}</span>
            <span className="text-text-muted">({technician.completed_jobs} شغلة)</span>
          </div>
        </div>
      </div>

      <Button variant="link" size="sm" asChild className="mt-2 h-auto p-0 text-text-secondary">
        <Link href="/services">
          <ArrowRight className="ml-1 h-4 w-4" />
          اختر صنايعي آخر
        </Link>
      </Button>
    </div>
  );
}
