'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdminTechniciansList, type AdminTechnicianListItem } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AdminPremiumTable,
  AdminPremiumTableBody,
  AdminPremiumTableCell,
  AdminPremiumTableHead,
  AdminPremiumTableHeaderCell,
  AdminPremiumTableRow,
} from '@/components/admin/admin-premium-table';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { Search, Users } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';
import { cn } from '@/lib/utils/cn';

const statusColors: Record<string, string> = {
  verified: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-950 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200/80 dark:bg-amber-950 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-700 ring-1 ring-red-200/80 dark:bg-red-950 dark:text-red-400',
  suspended: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-400',
  unverified: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200/80 dark:bg-sky-950 dark:text-sky-400',
};

export default function AdminTechniciansPage() {
  const { t, formatDate, dir } = useAdminT();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminTechniciansList(search, page);
  const isRtl = dir === 'rtl';

  const statusLabel = (status: string) => {
    const key = `technicians.status.${status}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">{t('technicians.title')}</h1>
        <p className="mt-1 text-[#64748B]">{t('technicians.subtitle')}</p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search
            className={cn(
              'absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]',
              isRtl ? 'right-3' : 'left-3',
            )}
          />
          <Input
            placeholder={t('technicians.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={cn(
              'border-[#E2E8F0] bg-white shadow-sm focus-visible:ring-[#FF6B00]/30',
              isRtl ? 'pr-9' : 'pl-9',
            )}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {translateAdminError(error.message, t)}
        </div>
      ) : !data?.technicians.length ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#E2E8F0] bg-white py-16 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6B00]/10">
            <Users className="h-7 w-7 text-[#FF6B00]" />
          </div>
          <h2 className="text-lg font-semibold text-[#0F172A]">{t('technicians.empty.title')}</h2>
          <p className="text-sm text-[#64748B]">{t('technicians.empty.subtitle')}</p>
        </div>
      ) : (
        <>
          <AdminPremiumTable>
            <AdminPremiumTableHead>
              <AdminPremiumTableHeaderCell>{t('tables.name')}</AdminPremiumTableHeaderCell>
              <AdminPremiumTableHeaderCell>{t('tables.email')}</AdminPremiumTableHeaderCell>
              <AdminPremiumTableHeaderCell>{t('tables.status')}</AdminPremiumTableHeaderCell>
              <AdminPremiumTableHeaderCell>{t('tables.jobs')}</AdminPremiumTableHeaderCell>
              <AdminPremiumTableHeaderCell className="hidden md:table-cell">
                {t('tables.rating')}
              </AdminPremiumTableHeaderCell>
              <AdminPremiumTableHeaderCell className="hidden md:table-cell">
                {t('tables.joined')}
              </AdminPremiumTableHeaderCell>
              <AdminPremiumTableHeaderCell>{t('tables.action')}</AdminPremiumTableHeaderCell>
            </AdminPremiumTableHead>
            <AdminPremiumTableBody>
              {data.technicians.map((tech: AdminTechnicianListItem) => (
                <AdminPremiumTableRow key={tech.id}>
                  <AdminPremiumTableCell className="font-medium text-[#0F172A]">
                    {tech.full_name ?? t('customers.unnamed')}
                  </AdminPremiumTableCell>
                  <AdminPremiumTableCell className="text-[#64748B]" dir="ltr">
                    {tech.email ?? t('common.dash')}
                  </AdminPremiumTableCell>
                  <AdminPremiumTableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border-0 px-2.5 py-0.5 text-xs font-medium',
                        statusColors[tech.verification_status] ?? '',
                      )}
                    >
                      {statusLabel(tech.verification_status)}
                    </Badge>
                  </AdminPremiumTableCell>
                  <AdminPremiumTableCell className="font-medium tabular-nums text-[#0F172A]">
                    {tech.completed_jobs ?? 0}
                  </AdminPremiumTableCell>
                  <AdminPremiumTableCell className="hidden text-[#64748B] md:table-cell">
                    {tech.average_rating
                      ? `${Number(tech.average_rating).toFixed(1)}★`
                      : t('common.dash')}
                  </AdminPremiumTableCell>
                  <AdminPremiumTableCell className="hidden text-[#64748B] md:table-cell">
                    {tech.created_at ? formatDate(tech.created_at) : t('common.dash')}
                  </AdminPremiumTableCell>
                  <AdminPremiumTableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-[#FF6B00] hover:bg-[#FF6B00]/10 hover:text-[#FF6B00]"
                    >
                      <Link href={`/admin/technicians/${tech.id}`}>{t('common.view')}</Link>
                    </Button>
                  </AdminPremiumTableCell>
                </AdminPremiumTableRow>
              ))}
            </AdminPremiumTableBody>
          </AdminPremiumTable>

          <AdminPagination
            page={page}
            totalPages={Math.ceil(data.total / data.limit)}
            total={data.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
