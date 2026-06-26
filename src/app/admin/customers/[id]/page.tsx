'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAdminCustomer } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { BookingStatus } from '@/components/shared/booking-status';
import { cn } from '@/lib/utils/cn';

export default function AdminCustomerDetailPage() {
  const { t, formatDate, dir } = useAdminT();
  const params = useParams();
  const id = params.id as string;
  const { data: customer, isLoading, error } = useAdminCustomer(id);
  const backIconClass = dir === 'ltr' ? 'mr-1' : 'ml-1';

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

  if (error || !customer) {
    return (
      <div className="p-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">{t('customers.detail.notFound')}</h1>
        <Button asChild><Link href="/admin/customers">{t('customers.detail.back')}</Link></Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/admin/customers">
          <ArrowLeft className={cn('h-4 w-4', backIconClass)} /> {t('customers.detail.back')}
        </Link>
      </Button>

      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{customer.full_name ?? t('customers.detail.unnamed')}</h1>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
            <p className="text-sm text-muted-foreground">{customer.phone ?? t('customers.detail.noPhone')}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t('customers.detail.bookings', { count: customer.bookings?.length ?? 0 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.bookings?.length > 0 ? (
              <div className="space-y-2">
                {customer.bookings.map((b: any) => (
                  <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" dir="auto">{b.services?.name_ar ?? t('customers.detail.booking')}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(b.created_at)}</p>
                    </div>
                    <span className="ms-2 shrink-0">
                      <BookingStatus status={b.status} context="admin" />
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('customers.detail.noBookings')}</p>
            )}
          </CardContent>
        </Card>

        {customer.reviews?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t('customers.detail.reviews', { count: customer.reviews.length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customer.reviews.map((r: any) => (
                  <div key={r.id} className="rounded-md bg-muted/50 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      <span className="text-muted-foreground">— {r.technician?.full_name ?? t('customers.detail.unknown')}</span>
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
