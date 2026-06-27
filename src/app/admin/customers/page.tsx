'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { useAdminCustomers } from '@/hooks/use-admin';
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

function CustomerNameDisplay({
  customer,
  t,
}: {
  customer: any;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  return (
    <span className="font-medium text-[#0F172A]">
      {customer.full_name ?? t('customers.unnamed')}
    </span>
  );
}

function CustomerCard({
  customer,
  t,
  formatDate,
}: {
  customer: any;
  t: ReturnType<typeof useAdminT>['t'];
  formatDate: ReturnType<typeof useAdminT>['formatDate'];
}) {
  return (
    <AdminEntityCard>
      <AdminEntityCardField label={t('tables.name')}>
        <CustomerNameDisplay customer={customer} t={t} />
      </AdminEntityCardField>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <AdminEntityCardField label={t('tables.email')}>
          <span className="text-[#64748B]" dir="ltr">
            {customer.email ?? t('common.dash')}
          </span>
        </AdminEntityCardField>
        <AdminEntityCardField label={t('tables.phone')}>
          <span className="text-[#64748B]" dir="ltr">
            {customer.phone ?? t('common.dash')}
          </span>
        </AdminEntityCardField>
        <AdminEntityCardField label={t('tables.bookings')}>
          <span className="font-medium tabular-nums text-[#0F172A]">{customer.booking_count}</span>
        </AdminEntityCardField>
        <AdminEntityCardField label={t('tables.joined')}>
          <span className="text-[#64748B]">
            {customer.created_at ? formatDate(customer.created_at) : t('common.dash')}
          </span>
        </AdminEntityCardField>
      </div>
      <AdminEntityCardActions>
        <AdminTableActionLink href={`/admin/customers/${customer.id}`}>
          {t('common.view')}
        </AdminTableActionLink>
      </AdminEntityCardActions>
    </AdminEntityCard>
  );
}

export default function AdminCustomersPage() {
  const { t, formatDate } = useAdminT();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminCustomers(search, page);

  return (
    <AdminListShell
      pageId="customers"
      title={t('customers.title')}
      subtitle={t('customers.subtitle')}
      defaultView="table"
      search={
        <AdminSearchInput
          placeholder={t('customers.searchPlaceholder')}
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
      }
      isLoading={isLoading}
      error={error ? translateAdminError(error.message, t) : null}
      isEmpty={!data?.customers.length}
      empty={<AdminEmptyState icon={Users} title={t('customers.empty')} />}
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
            <AdminPremiumTableHeaderCell>{t('tables.phone')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.bookings')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell className="hidden md:table-cell">
              {t('tables.joined')}
            </AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.action')}</AdminPremiumTableHeaderCell>
          </AdminPremiumTableHead>
          <AdminPremiumTableBody>
            {data?.customers.map((c: any) => (
              <AdminPremiumTableRow key={c.id}>
                <AdminPremiumTableCell>
                  <CustomerNameDisplay customer={c} t={t} />
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="text-[#64748B]" dir="ltr">
                  {c.email ?? t('common.dash')}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="text-[#64748B]" dir="ltr">
                  {c.phone ?? t('common.dash')}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="font-medium tabular-nums text-[#0F172A]">
                  {c.booking_count}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="hidden text-[#64748B] md:table-cell">
                  {c.created_at ? formatDate(c.created_at) : t('common.dash')}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <AdminTableActionLink href={`/admin/customers/${c.id}`}>
                    {t('common.view')}
                  </AdminTableActionLink>
                </AdminPremiumTableCell>
              </AdminPremiumTableRow>
            ))}
          </AdminPremiumTableBody>
        </AdminPremiumTable>
      }
      cards={
        data?.customers.map((c: any) => (
          <CustomerCard key={c.id} customer={c} t={t} formatDate={formatDate} />
        )) ?? null
      }
    />
  );
}
