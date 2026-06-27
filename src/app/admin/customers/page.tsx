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
  AdminEntityCardActionsGroup,
  AdminEntityCardAvatar,
  AdminEntityCardHeader,
  AdminEntityCardInfoBox,
  AdminEntityCardInfoLtrValue,
  AdminEntityCardInfoRow,
  AdminEntityCardMeta,
  AdminEntityCardMetaPill,
  AdminEntityCardPrimaryAction,
  AdminSearchInput,
  AdminTableActionLink,
} from '@/components/admin/admin-list-chrome';
import { AdminListShell } from '@/components/admin/admin-list-shell';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { Calendar, Eye, Users } from 'lucide-react';
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

function customerInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
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
  const name = customer.full_name ?? t('customers.unnamed');

  return (
    <AdminEntityCard>
      <AdminEntityCardHeader
        title={name}
        subtitle={t('customers.card.subtitle')}
        avatar={<AdminEntityCardAvatar fallback={customerInitials(name)} />}
        badge={
          <AdminEntityCardMetaPill variant="orange">
            {t('customers.detail.bookings', { count: customer.booking_count ?? 0 })}
          </AdminEntityCardMetaPill>
        }
      />

      <AdminEntityCardInfoBox className="mt-4" columns={1}>
        <AdminEntityCardInfoRow label={t('tables.email')}>
          <AdminEntityCardInfoLtrValue className="text-[#64748B]">
            {customer.email ?? t('common.dash')}
          </AdminEntityCardInfoLtrValue>
        </AdminEntityCardInfoRow>
        <AdminEntityCardInfoRow label={t('tables.phone')}>
          <AdminEntityCardInfoLtrValue className="text-[#64748B]">
            {customer.phone ?? t('common.dash')}
          </AdminEntityCardInfoLtrValue>
        </AdminEntityCardInfoRow>
      </AdminEntityCardInfoBox>

      <AdminEntityCardMeta className="mt-3">
        <AdminEntityCardMetaPill variant="muted">
          <Calendar className="h-3 w-3 shrink-0" aria-hidden />
          {customer.created_at ? formatDate(customer.created_at) : t('common.dash')}
        </AdminEntityCardMetaPill>
      </AdminEntityCardMeta>

      <AdminEntityCardActions>
        <AdminEntityCardActionsGroup />
        <AdminEntityCardPrimaryAction href={`/admin/customers/${customer.id}`} icon={Eye}>
          {t('common.view')}
        </AdminEntityCardPrimaryAction>
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
