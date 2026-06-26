'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import Link from 'next/link';
import { useAdminTechniciansList } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';
import { cn } from '@/lib/utils/cn';

const statusColors: Record<string, string> = {
  verified: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  suspended: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  unverified: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
};

export default function AdminTechniciansPage() {
  const { t, formatDate, dir } = useAdminT();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminTechniciansList(search, page);
  const isRtl = dir === 'rtl';
  const textAlign = dir === 'ltr' ? 'text-left' : '';

  const statusLabel = (status: string) => {
    const key = `technicians.status.${status}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t('technicians.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('technicians.subtitle')}</p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className={cn('absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground', isRtl ? 'right-3' : 'left-3')} />
          <Input
            placeholder={t('technicians.searchPlaceholder')}
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
      ) : !data?.technicians.length ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">{t('technicians.empty.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('technicians.empty.subtitle')}</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <table className={cn('w-full text-sm', textAlign)}>
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 font-medium">{t('tables.name')}</th>
                  <th className="px-4 py-3 font-medium">{t('tables.email')}</th>
                  <th className="px-4 py-3 font-medium">{t('tables.status')}</th>
                  <th className="px-4 py-3 font-medium">{t('tables.jobs')}</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">{t('tables.rating')}</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">{t('tables.joined')}</th>
                  <th className="px-4 py-3 text-end font-medium">{t('tables.action')}</th>
                </tr>
              </thead>
              <tbody>
                {data.technicians.map((tech: any) => (
                  <tr key={tech.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{tech.full_name ?? t('customers.unnamed')}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tech.email ?? t('common.dash')}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusColors[tech.verification_status] ?? ''}>
                        {statusLabel(tech.verification_status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{tech.completed_jobs ?? 0}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {tech.average_rating ? `${Number(tech.average_rating).toFixed(1)}★` : t('common.dash')}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {tech.created_at ? formatDate(tech.created_at) : t('common.dash')}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/technicians/${tech.id}`}>{t('common.view')}</Link>
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
