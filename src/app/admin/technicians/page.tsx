'use client';

import { useState } from 'react';
import { useAdminTechniciansList, type AdminTechnicianListItem } from '@/hooks/use-admin';
import { Badge } from '@/components/ui/badge';
import {
  AdminPremiumTable,
  AdminPremiumTableBody,
  AdminPremiumTableCell,
  AdminPremiumTableHead,
  AdminPremiumTableHeaderCell,
  AdminPremiumTableRow,
} from '@/components/admin/admin-premium-table';
import {
  AdminEmptyState,
  AdminEntityCard,
  AdminEntityCardActions,
  AdminEntityCardField,
  AdminSearchInput,
  AdminTableActionLink,
} from '@/components/admin/admin-list-chrome';
import { AdminListShell } from '@/components/admin/admin-list-shell';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { Users } from 'lucide-react';
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

function TechnicianStatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn('border-0 px-2.5 py-0.5 text-xs font-medium', statusColors[status] ?? '')}
    >
      {label}
    </Badge>
  );
}

function TechnicianCard({
  tech,
  t,
  formatDate,
  statusLabel,
}: {
  tech: AdminTechnicianListItem;
  t: ReturnType<typeof useAdminT>['t'];
  formatDate: ReturnType<typeof useAdminT>['formatDate'];
  statusLabel: (status: string) => string;
}) {
  return (
    <AdminEntityCard>
      <AdminEntityCardField label={t('tables.name')}>
        <span className="font-medium text-[#0F172A]">
          {tech.full_name ?? t('customers.unnamed')}
        </span>
      </AdminEntityCardField>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <AdminEntityCardField label={t('tables.email')}>
          <span className="text-[#64748B]" dir="ltr">
            {tech.email ?? t('common.dash')}
          </span>
        </AdminEntityCardField>
        <AdminEntityCardField label={t('tables.status')}>
          <TechnicianStatusBadge
            status={tech.verification_status}
            label={statusLabel(tech.verification_status)}
          />
        </AdminEntityCardField>
        <AdminEntityCardField label={t('tables.jobs')}>
          <span className="font-medium tabular-nums text-[#0F172A]">
            {tech.completed_jobs ?? 0}
          </span>
        </AdminEntityCardField>
        <AdminEntityCardField label={t('tables.rating')}>
          <span className="text-[#64748B]">
            {tech.average_rating
              ? `${Number(tech.average_rating).toFixed(1)}★`
              : t('common.dash')}
          </span>
        </AdminEntityCardField>
        <AdminEntityCardField label={t('tables.joined')}>
          <span className="text-[#64748B]">
            {tech.created_at ? formatDate(tech.created_at) : t('common.dash')}
          </span>
        </AdminEntityCardField>
      </div>
      <AdminEntityCardActions>
        <AdminTableActionLink href={`/admin/technicians/${tech.id}`}>
          {t('common.view')}
        </AdminTableActionLink>
      </AdminEntityCardActions>
    </AdminEntityCard>
  );
}

export default function AdminTechniciansPage() {
  const { t, formatDate } = useAdminT();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminTechniciansList(search, page);

  const statusLabel = (status: string) => {
    const key = `technicians.status.${status}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  return (
    <AdminListShell
      pageId="technicians"
      title={t('technicians.title')}
      subtitle={t('technicians.subtitle')}
      defaultView="table"
      search={
        <AdminSearchInput
          placeholder={t('technicians.searchPlaceholder')}
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
      }
      isLoading={isLoading}
      error={error ? translateAdminError(error.message, t) : null}
      isEmpty={!data?.technicians.length}
      empty={
        <AdminEmptyState
          icon={Users}
          title={t('technicians.empty.title')}
          subtitle={t('technicians.empty.subtitle')}
        />
      }
      pagination={
        data ? (
          <AdminPagination
            page={page}
            totalPages={Math.ceil(data.total / data.limit)}
            total={data.total}
            onPageChange={setPage}
          />
        ) : null
      }
      table={
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
            {data?.technicians.map((tech) => (
              <AdminPremiumTableRow key={tech.id}>
                <AdminPremiumTableCell className="font-medium text-[#0F172A]">
                  {tech.full_name ?? t('customers.unnamed')}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="text-[#64748B]" dir="ltr">
                  {tech.email ?? t('common.dash')}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <TechnicianStatusBadge
                    status={tech.verification_status}
                    label={statusLabel(tech.verification_status)}
                  />
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
                  <AdminTableActionLink href={`/admin/technicians/${tech.id}`}>
                    {t('common.view')}
                  </AdminTableActionLink>
                </AdminPremiumTableCell>
              </AdminPremiumTableRow>
            ))}
          </AdminPremiumTableBody>
        </AdminPremiumTable>
      }
      cards={
        data?.technicians.map((tech) => (
          <TechnicianCard
            key={tech.id}
            tech={tech}
            t={t}
            formatDate={formatDate}
            statusLabel={statusLabel}
          />
        )) ?? null
      }
    />
  );
}
