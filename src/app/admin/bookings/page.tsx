'use client';

import { useState } from 'react';
import { useAdminBookings } from '@/hooks/use-admin';
import { BookingStatus } from '@/components/shared/booking-status';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';

export default function AdminBookingsPage() {
  const { t, formatDateTime, dir } = useAdminT();
  const [statusFilter, setStatusFilter] = useState('');
  const { data: bookings, isLoading, error } = useAdminBookings(statusFilter || undefined);
  const textAlign = dir === 'ltr' ? 'text-left' : '';

  const statusFilters = [
    { label: t('bookings.filters.all'), value: '' },
    { label: t('bookings.filters.pending'), value: 'pending' },
    { label: t('bookings.filters.matched'), value: 'matched' },
    { label: t('bookings.filters.active'), value: 'in_progress' },
    { label: t('bookings.filters.completed'), value: 'completed' },
    { label: t('bookings.filters.cancelled'), value: 'cancelled' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t('bookings.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('bookings.subtitle')}</p>
      </div>

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

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {translateAdminError(error.message, t)}
        </div>
      ) : !bookings || bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('bookings.empty.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {statusFilter
                ? t('bookings.empty.withStatus', { status: statusFilter })
                : t('bookings.empty.none')}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className={cn('w-full text-sm', textAlign)}>
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">{t('tables.service')}</th>
                <th className="px-4 py-3 font-medium">{t('tables.customer')}</th>
                <th className="px-4 py-3 font-medium">{t('tables.technician')}</th>
                <th className="px-4 py-3 font-medium">{t('tables.status')}</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">{t('tables.date')}</th>
                <th className="px-4 py-3 text-end font-medium">{t('tables.action')}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3" dir="auto">
                    <p className="truncate font-medium">{b.services?.name_ar ?? t('common.unknown')}</p>
                    <p className="text-xs text-muted-foreground">{b.services?.name_en}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b.customer?.full_name ?? b.customer_id.slice(0, 8) + '...'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b.technician?.full_name ?? (b.technician_id ? `${b.technician_id.slice(0, 8)}...` : t('common.dash'))}
                  </td>
                  <td className="px-4 py-3"><BookingStatus status={b.status} context="admin" /></td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {formatDateTime(b.created_at)}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/bookings/${b.id}`}>{t('common.view')}</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
