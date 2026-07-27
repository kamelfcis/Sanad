'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { useAdminCustomers, useAdminDeleteUser } from '@/hooks/use-admin';
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
import { AdminModerationDialog } from '@/components/admin/admin-moderation-dialog';
import {
  AdminBlockedBadge,
  AdminModerationActions,
} from '@/components/admin/admin-moderation-actions';
import {
  AdminBulkDeleteToolbar,
  AdminCardSelectToggle,
  AdminSelectAllHeaderCell,
  AdminSelectRowCell,
} from '@/components/admin/admin-bulk-select';
import { useAdminModeration, type ModerationRequest } from '@/hooks/use-admin-moderation';
import { useAdminTableSelection } from '@/hooks/use-admin-table-selection';
import { useAdminBulkDelete } from '@/hooks/use-admin-bulk-delete';
import { Calendar, Eye, Users } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';
import { isUserRowDeletable } from '@/lib/admin/moderation';
import { useAuthStore } from '@/store/auth-store';

function CustomerNameDisplay({
  customer,
  t,
}: {
  customer: any;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  return (
    <span className="flex flex-wrap items-center gap-1.5 font-medium text-[#0F172A] dark:text-foreground">
      {customer.full_name ?? t('customers.unnamed')}
      {customer.is_blocked ? <AdminBlockedBadge /> : null}
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
  onModerate,
  isPending,
  isSelected,
  onSelect,
  selectable,
  notSelectableReason,
}: {
  customer: any;
  t: ReturnType<typeof useAdminT>['t'];
  formatDate: ReturnType<typeof useAdminT>['formatDate'];
  onModerate: (request: ModerationRequest) => void;
  isPending: boolean;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  selectable: boolean;
  notSelectableReason: string;
}) {
  const name = customer.full_name ?? t('customers.unnamed');

  return (
    <AdminEntityCard>
      <AdminCardSelectToggle
        id={customer.id}
        checked={isSelected}
        onChange={onSelect}
        disabled={!selectable}
        disabledReason={notSelectableReason}
      />

      <AdminEntityCardHeader
        title={name}
        subtitle={t('customers.card.subtitle')}
        avatar={<AdminEntityCardAvatar fallback={customerInitials(name)} />}
        badge={
          <div className="flex flex-wrap items-center gap-1.5">
            {customer.is_blocked ? <AdminBlockedBadge /> : null}
            <AdminEntityCardMetaPill variant="orange">
              {t('customers.detail.bookings', { count: customer.booking_count ?? 0 })}
            </AdminEntityCardMetaPill>
          </div>
        }
      />

      <AdminEntityCardInfoBox className="mt-4" columns={1}>
        <AdminEntityCardInfoRow label={t('tables.email')}>
          <AdminEntityCardInfoLtrValue className="text-[#64748B] dark:text-muted-foreground">
            {customer.email ?? t('common.dash')}
          </AdminEntityCardInfoLtrValue>
        </AdminEntityCardInfoRow>
        <AdminEntityCardInfoRow label={t('tables.phone')}>
          <AdminEntityCardInfoLtrValue className="text-[#64748B] dark:text-muted-foreground">
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
        <AdminEntityCardActionsGroup>
          <AdminModerationActions
            id={customer.id}
            name={name}
            subject="customer"
            isBlocked={customer.is_blocked}
            disabled={isPending}
            onRequest={onModerate}
          />
        </AdminEntityCardActionsGroup>
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
  const { request: moderate, dialogProps, isPending } = useAdminModeration();
  const actingAdminId = useAuthStore((s) => s.profile?.id ?? null);

  const rows: any[] = data?.customers ?? [];
  const selection = useAdminTableSelection(
    rows.map((c) => ({ id: c.id, selectable: isUserRowDeletable(c, actingAdminId) })),
    `${search}|${page}`,
  );
  const deleteUser = useAdminDeleteUser();
  const bulkDelete = useAdminBulkDelete({
    subject: 'customers',
    requireConfirmPhrase: true,
    deleteOne: (id) => deleteUser.mutateAsync({ userId: id }),
    // Accounts the server refused stay selected so the failure is visible.
    onSettled: ({ failed }) => selection.replace(failed),
  });

  return (
    <>
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
      bulkToolbar={
        <AdminBulkDeleteToolbar
          count={selection.count}
          isPending={bulkDelete.isPending}
          onDelete={() => bulkDelete.request(selection.selected)}
          onClear={selection.clear}
        />
      }
      table={
        <AdminPremiumTable>
          <AdminPremiumTableHead>
            <AdminSelectAllHeaderCell
              state={selection.headerState}
              onChange={selection.selectAll}
              disabled={!selection.hasSelectableRows || bulkDelete.isPending}
            />
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
            {rows.map((c: any) => (
              <AdminPremiumTableRow key={c.id}>
                <AdminSelectRowCell
                  id={c.id}
                  checked={selection.isSelected(c.id)}
                  onChange={(checked) => selection.toggle(c.id, checked)}
                  disabled={bulkDelete.isPending || !isUserRowDeletable(c, actingAdminId)}
                  disabledReason={t('moderation.bulk.protectedRow')}
                />
                <AdminPremiumTableCell>
                  <CustomerNameDisplay customer={c} t={t} />
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="text-[#64748B] dark:text-muted-foreground" dir="ltr">
                  {c.email ?? t('common.dash')}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="text-[#64748B] dark:text-muted-foreground" dir="ltr">
                  {c.phone ?? t('common.dash')}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="font-medium tabular-nums text-[#0F172A] dark:text-foreground">
                  {c.booking_count}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="hidden text-[#64748B] dark:text-muted-foreground md:table-cell">
                  {c.created_at ? formatDate(c.created_at) : t('common.dash')}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <div className="flex flex-wrap items-center gap-1">
                    <AdminTableActionLink href={`/admin/customers/${c.id}`}>
                      {t('common.view')}
                    </AdminTableActionLink>
                    <AdminModerationActions
                      id={c.id}
                      name={c.full_name ?? t('customers.unnamed')}
                      subject="customer"
                      isBlocked={c.is_blocked}
                      disabled={isPending}
                      onRequest={moderate}
                    />
                  </div>
                </AdminPremiumTableCell>
              </AdminPremiumTableRow>
            ))}
          </AdminPremiumTableBody>
        </AdminPremiumTable>
      }
      cards={
        rows.map((c: any) => (
          <CustomerCard
            key={c.id}
            customer={c}
            t={t}
            formatDate={formatDate}
            onModerate={moderate}
            isPending={isPending}
            isSelected={selection.isSelected(c.id)}
            onSelect={(checked) => selection.toggle(c.id, checked)}
            selectable={!bulkDelete.isPending && isUserRowDeletable(c, actingAdminId)}
            notSelectableReason={t('moderation.bulk.protectedRow')}
          />
        ))
      }
    />
    <AdminModerationDialog {...dialogProps} />
    <AdminModerationDialog {...bulkDelete.dialogProps} />
    </>
  );
}
