'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAdminTechnician, useAdminUpdateTechnicianStatus } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, CheckCircle, Ban, RotateCcw, XCircle } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { BookingStatus } from '@/components/shared/booking-status';
import { cn } from '@/lib/utils/cn';

const statusColors: Record<string, string> = {
  verified: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-gray-100 text-gray-700',
  unverified: 'bg-blue-100 text-blue-700',
};

export default function AdminTechnicianDetailPage() {
  const { t, formatDate, dir } = useAdminT();
  const params = useParams();
  const id = params.id as string;
  const { data: tech, isLoading, error } = useAdminTechnician(id);
  const updateStatus = useAdminUpdateTechnicianStatus();
  const backIconClass = dir === 'ltr' ? 'mr-1' : 'ml-1';
  const actionIconClass = dir === 'ltr' ? 'mr-1' : 'ml-1';

  const statusLabel = (status: string) => {
    const key = `technicians.status.${status}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

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

  if (error || !tech) {
    return (
      <div className="p-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">{t('technicians.detail.notFound')}</h1>
        <Button asChild><Link href="/admin/technicians">{t('technicians.detail.back')}</Link></Button>
      </div>
    );
  }

  const actions: { label: string; action: string; icon: React.ElementType; color: string; disabled: boolean }[] = [
    { label: t('technicians.detail.approve'), action: 'approve', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700', disabled: tech.verification_status === 'verified' },
    { label: t('technicians.detail.reject'), action: 'reject', icon: XCircle, color: 'bg-red-600 hover:bg-red-700', disabled: tech.verification_status === 'rejected' },
    { label: t('technicians.detail.suspend'), action: 'suspend', icon: Ban, color: 'bg-gray-600 hover:bg-gray-700', disabled: tech.verification_status === 'suspended' },
    { label: t('technicians.detail.reactivate'), action: 'reactivate', icon: RotateCcw, color: 'bg-blue-600 hover:bg-blue-700', disabled: tech.verification_status === 'verified' },
  ];

  return (
    <div className="p-6">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/admin/technicians">
          <ArrowLeft className={cn('h-4 w-4', backIconClass)} /> {t('technicians.detail.back')}
        </Link>
      </Button>

      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{tech.full_name ?? t('technicians.detail.unnamed')}</h1>
              <Badge variant="outline" className={statusColors[tech.verification_status]}>
                {statusLabel(tech.verification_status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{tech.email}</p>
            <p className="text-sm text-muted-foreground">{tech.phone ?? t('technicians.detail.noPhone')}</p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">{t('technicians.detail.statusActions')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {actions.map((a) => (
                <Button
                  key={a.action}
                  size="sm"
                  className={a.color}
                  disabled={a.disabled || updateStatus.isPending}
                  onClick={() => {
                    if (a.action === 'reject' || a.action === 'suspend') {
                      const r = prompt(t('technicians.detail.reasonPrompt', { action: a.label }));
                      if (r) updateStatus.mutate({ technicianId: id, action: a.action, reason: r });
                    } else {
                      updateStatus.mutate({ technicianId: id, action: a.action });
                    }
                  }}
                >
                  <a.icon className={cn('h-4 w-4', actionIconClass)} /> {a.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">{t('technicians.detail.profile')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">{t('technicians.detail.yearsExperience')}</p>
                <p className="text-sm font-medium">{tech.years_experience ?? t('common.dash')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('technicians.detail.completedJobs')}</p>
                <p className="text-sm font-medium">{tech.completed_jobs}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('technicians.detail.rating')}</p>
                <p className="text-sm font-medium">
                  {tech.average_rating ? `${Number(tech.average_rating).toFixed(1)}★ (${tech.total_ratings})` : t('common.dash')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('technicians.detail.available')}</p>
                <p className="text-sm font-medium">{tech.is_available ? t('common.yes') : t('common.no')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('technicians.detail.maxDistance')}</p>
                <p className="text-sm font-medium">{tech.max_distance_km ? `${tech.max_distance_km} km` : t('common.dash')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('technicians.detail.joined')}</p>
                <p className="text-sm font-medium">{formatDate(tech.created_at)}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">{t('technicians.detail.bio')}</p>
              <p className="mt-1 text-sm" dir="auto">{tech.bio ?? t('technicians.detail.noBio')}</p>
            </div>
          </CardContent>
        </Card>

        {tech.bookings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t('technicians.detail.recentBookings', { count: tech.bookings.length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tech.bookings.slice(0, 10).map((b: any) => (
                  <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm" dir="auto">{b.services?.name_ar ?? t('technicians.detail.booking')}</p>
                      <p className="text-xs text-muted-foreground">{b.customer?.full_name ?? b.customer_id.slice(0, 8)}</p>
                    </div>
                    <span className="ms-2 shrink-0">
                      <BookingStatus status={b.status} context="admin" />
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {tech.reviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t('technicians.detail.reviews', { count: tech.reviews.length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tech.reviews.slice(0, 5).map((r: any) => (
                  <div key={r.id} className="rounded-md bg-muted/50 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{r.customer?.full_name ?? t('technicians.detail.anonymous')}</span>
                      <span className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-muted-foreground" dir="auto">{r.comment}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
