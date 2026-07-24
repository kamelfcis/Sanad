'use client';

import { useState } from 'react';
import { useTechnicianBookings, useTechnicianAssignments, useTechnicianProfile } from '@/hooks/use-technician';
import { TechnicianJobCard } from '@/components/shared/technician-job-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Briefcase, AlertCircle, Settings } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

const statusFilters = [
  { label: 'المتاحة', value: 'pending' },
  { label: 'قيد التنفيذ', value: 'in_progress' },
  { label: 'المكتملة', value: 'completed' },
  { label: 'الكل', value: '' },
];

export default function TechnicianJobsPage() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const isPendingFilter = statusFilter === 'pending';

  const { data: assignments, isLoading: assignmentsLoading, error: assignmentsError } =
    useTechnicianAssignments(isPendingFilter ? 'pending' : undefined);
  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } =
    useTechnicianBookings(isPendingFilter ? undefined : (statusFilter || undefined));
  const { data: techProfile } = useTechnicianProfile();

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
          <h1 className="text-3xl font-bold tracking-tight">الطلبات</h1>
          <p className="mt-1 text-muted-foreground">
            تابع طلبات الخدمة الخاصة بك وأدرها.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {techProfile && (
            <Badge
              variant={techProfile.is_available ? 'success' : 'secondary'}
              className="text-xs"
            >
              {techProfile.is_available ? 'متاح' : 'غير متصل'}
            </Badge>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/technician/profile">
              <Settings className="mr-1 h-4 w-4" />
              الملف الشخصي
            </Link>
          </Button>
        </div>
      </div>

      {/* Setup prompt */}
      {needsSetup && !isLoading && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="font-medium text-amber-800 dark:text-amber-200">أكمل ملفك الشخصي</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              أكمل ملفك الشخصي وأضف مهاراتك لتبدأ باستقبال طلبات العمل.
            </p>
          </div>
          <Button size="sm" asChild>
            <Link href="/auth/register-technician?complete=1">أكمل التسجيل</Link>
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
            {f.label}
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
          تعذّر تحميل الطلبات. يرجى تحديث الصفحة.
        </div>
      ) : isPendingFilter ? (
        assignments?.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">لا توجد طلبات متاحة</h2>
              <p className="text-sm text-muted-foreground">
                لا توجد طلبات عمل معلّقة معيّنة لك في الوقت الحالي.
              </p>
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
            <h2 className="text-lg font-semibold">لا توجد طلبات</h2>
            <p className="text-sm text-muted-foreground">
              {statusFilter ? 'لا توجد طلبات في هذه الحالة.' : 'لا توجد طلبات عمل بعد.'}
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
