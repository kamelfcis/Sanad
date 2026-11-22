'use client';

import { useState } from 'react';
import {
  useTechnicianBookings,
  useTechnicianAssignments,
  useTechnicianProfile,
  useTechnicianAssignmentsRealtime,
  useTechnicianBookingsRealtime,
} from '@/hooks/use-technician';
import { DashboardLanguageToggle } from '@/components/shared/dashboard-language-toggle';
import { useDashboardLocale } from '@/lib/i18n/dashboard-locale';
import { TechnicianJobCard } from '@/components/shared/technician-job-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Briefcase, AlertCircle, Settings } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

const statusFilters = [
  { labelAr: 'قيد الانتظار', labelEn: 'Pending', value: 'pending' },
  { labelAr: 'جاري التنفيذ', labelEn: 'In progress', value: 'in_progress' },
  { labelAr: 'مكتمل', labelEn: 'Completed', value: 'completed' },
  { labelAr: 'ملغي', labelEn: 'Cancelled', value: 'cancelled' },
];

const copy = {
  ar: {
    title: 'طلباتي',
    subtitle: 'استلم طلبات العملاء وتابع تنفيذها من هنا.',
    profile: 'الملف الشخصي',
    setupCta: 'أكمل التسجيل',
    setupTitle: 'أكمل ملفك الشخصي',
    setupBody: 'أكمل بياناتك وأضف مهاراتك لاستقبال طلبات العمل.',
    noJobsTitle: 'لا توجد طلبات متاحة',
    noJobsBody: 'لا توجد طلبات معلّقة مخصّصة لك حالياً.',
    noFilteredTitle: 'لا توجد طلبات',
    loadError: 'تعذّر تحميل الطلبات. حدّث الصفحة.',
    online: 'متصل',
    offline: 'غير متصل',
  },
  en: {
    title: 'Jobs',
    subtitle: 'Find and manage your service requests',
    profile: 'Profile',
    setupCta: 'Complete registration',
    setupTitle: 'Complete your profile',
    setupBody: 'Set up your profile and add your skills to start receiving job requests.',
    noJobsTitle: 'No available jobs',
    noJobsBody: 'There are no pending job requests assigned to you right now.',
    noFilteredTitle: 'No jobs',
    loadError: 'Failed to load jobs. Please refresh the page.',
    online: 'Online',
    offline: 'Offline',
  },
} as const;

export default function TechnicianJobsPage() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const isPendingFilter = statusFilter === 'pending';
  const { locale } = useDashboardLocale();
  const t = copy[locale];

  const { data: assignments, isLoading: assignmentsLoading, error: assignmentsError } =
    useTechnicianAssignments(isPendingFilter ? 'pending' : undefined);
  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } =
    useTechnicianBookings(isPendingFilter ? undefined : (statusFilter || undefined));
  const { data: techProfile } = useTechnicianProfile();
  useTechnicianAssignmentsRealtime(techProfile?.id);
  useTechnicianBookingsRealtime(techProfile?.id);

  const isLoading = isPendingFilter ? assignmentsLoading : bookingsLoading;
  const error = isPendingFilter ? assignmentsError : bookingsError;

  const needsSetup =
    !techProfile?.national_id ||
    !techProfile?.governorate ||
    !techProfile?.profile_photo_url ||
    !techProfile?.id_card_photo_url;

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-muted-foreground">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardLanguageToggle />
          {techProfile && (
            <Badge
              variant={techProfile.is_available ? 'success' : 'secondary'}
              className="text-xs"
            >
              {techProfile.is_available ? t.online : t.offline}
            </Badge>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/technician/profile">
              <Settings className="mr-1 h-4 w-4" />
              {t.profile}
            </Link>
          </Button>
        </div>
      </div>

      {/* Setup prompt */}
      {needsSetup && !isLoading && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="font-medium text-amber-800 dark:text-amber-200">{t.setupTitle}</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">{t.setupBody}</p>
          </div>
          <Button size="sm" asChild>
            <Link href="/auth/register-technician?complete=1">{t.setupCta}</Link>
          </Button>
        </div>
      )}

      {/* Status Filters */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              statusFilter === f.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-muted-foreground/50',
            )}
          >
            {locale === 'en' ? f.labelEn : f.labelAr}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {t.loadError}
        </div>
      ) : isPendingFilter ? (
        assignments?.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t.noJobsTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.noJobsBody}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments?.map((assignment) => (
              <TechnicianJobCard
                key={assignment.id}
                {...assignment.booking}
                href={`/technician/jobs/${assignment.id}`}
              />
            ))}
          </div>
        )
      ) : bookings?.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t.noFilteredTitle}</h2>
            <p className="text-sm text-muted-foreground">
              {statusFilter
                ? locale === 'en'
                  ? `No jobs with status "${statusFilters.find((f) => f.value === statusFilter)?.labelEn ?? statusFilter}".`
                  : `لا توجد طلبات بحالة «${statusFilters.find((f) => f.value === statusFilter)?.labelAr ?? statusFilter}».`
                : locale === 'en'
                  ? 'No jobs yet. Turn on availability from your profile.'
                  : 'لم تصلك أي طلبات بعد. فعّل توفرك من الملف الشخصي.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings?.map((booking) => (
            <TechnicianJobCard
              key={booking.id}
              {...booking}
              href={`/technician/jobs/${booking.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
