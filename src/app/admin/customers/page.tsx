'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import Link from 'next/link';
import { useAdminCustomers } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';
import { cn } from '@/lib/utils/cn';

export default function AdminCustomersPage() {
  const { t, formatDate, dir } = useAdminT();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminCustomers(search, page);
  const isRtl = dir === 'rtl';
  const textAlign = dir === 'ltr' ? 'text-left' : '';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t('customers.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('customers.subtitle')}</p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className={cn('absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground', isRtl ? 'right-3' : 'left-3')} />
          <Input
            placeholder={t('customers.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={isRtl ? 'pr-9' : 'pl-9'}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {translateAdminError(error.message, t)}
        </div>
      ) : !data?.customers.length ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">{t('customers.empty')}</h2>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <table className={cn('w-full text-sm', textAlign)}>
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 font-medium">{t('tables.name')}</th>
                  <th className="px-4 py-3 font-medium">{t('tables.email')}</th>
                  <th className="px-4 py-3 font-medium">{t('tables.phone')}</th>
                  <th className="px-4 py-3 font-medium">{t('tables.bookings')}</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">{t('tables.joined')}</th>
                  <th className="px-4 py-3 text-end font-medium">{t('tables.action')}</th>
                </tr>
              </thead>
              <tbody>
                {data.customers.map((c: any) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{c.full_name ?? t('customers.unnamed')}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email ?? t('common.dash')}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone ?? t('common.dash')}</td>
                    <td className="px-4 py-3">{c.booking_count}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {c.created_at ? formatDate(c.created_at) : t('common.dash')}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/customers/${c.id}`}>{t('common.view')}</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('common.pageOf', {
                page: data.page,
                totalPages: Math.ceil(data.total / data.limit),
                total: data.total,
              })}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" /> {t('common.previous')}
              </Button>
              <Button variant="outline" size="sm" disabled={page * data.limit >= data.total} onClick={() => setPage(page + 1)}>
                {t('common.next')} <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
