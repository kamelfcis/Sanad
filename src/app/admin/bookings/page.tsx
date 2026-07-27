'use client';

import { useState } from 'react';
import { useAdminBookings, useAdminDeleteBooking } from '@/hooks/use-admin';
import { BookingStatus } from '@/components/shared/booking-status';
import { Calendar, ClipboardList, Clock, Eye } from 'lucide-react';
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
  AdminEntityCardHeader,
  AdminEntityCardInfoBox,
  AdminEntityCardInfoRow,
  AdminEntityCardMeta,
  AdminEntityCardMetaPill,
  AdminEntityCardPrimaryAction,
  AdminFilterPills,
  AdminTableActionLink,
} from '@/components/admin/admin-list-chrome';
import { AdminListShell } from '@/components/admin/admin-list-shell';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { AdminModerationDialog } from '@/components/admin/admin-moderation-dialog';
import { AdminModerationActions } from '@/components/admin/admin-moderation-actions';
import {
  AdminBulkDeleteToolbar,
  AdminCardSelectToggle,
  AdminSelectAllHeaderCell,
  AdminSelectRowCell,
} from '@/components/admin/admin-bulk-select';
import { useAdminModeration, type ModerationRequest } from '@/hooks/use-admin-moderation';
import { useAdminTableSelection } from '@/hooks/use-admin-table-selection';
import { useAdminBulkDelete } from '@/hooks/use-admin-bulk-delete';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';
import { useAdminListPagination } from '@/hooks/use-admin-list-pagination';
import { asAdminListItems } from '@/lib/admin/list-items';

type BookingRow = NonNullable<
  ReturnType<typeof useAdminBookings>['data']
>['bookings'][number];

function bookingStatusVariant(
  status: string,
): 'success' | 'warning' | 'danger' | 'muted' | 'orange' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
    case 'disputed':
      return 'danger';
    case 'in_progress':
    case 'matched':
    case 'accepted':
      return 'orange';
    default:
      return 'muted';
  }
}

function bookingStatusLabel(status: string, t: ReturnType<typeof useAdminT>['t']): string {
  const key = `bookingStatus.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

function BookingStatusPill({
  status,
  t,
}: {
  status: string;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  return (
    <AdminEntityCardMetaPill variant={bookingStatusVariant(status)}>
      {bookingStatusLabel(status, t)}
    </AdminEntityCardMetaPill>
  );
}

function bookingCustomerName(booking: BookingRow, t: ReturnType<typeof useAdminT>['t']): string {
  return booking.customer?.full_name ?? t('customers.unnamed');
}

function BookingServiceDisplay({
  booking,
  t,
}: {
  booking: BookingRow;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  return (
    <>
      <p className="truncate font-medium text-[#0F172A] dark:text-foreground">
        {booking.services?.name_ar ?? t('common.unknown')}
      </p>
      <p className="text-xs text-[#64748B] dark:text-muted-foreground">{booking.services?.name_en}</p>
    </>
  );
}

/** Bookings have no name, so the dialog identifies them by a short id. */
function bookingShortRef(id: string) {
  return `#${id.slice(0, 8)}`;
}

function BookingCustomerDisplay({ booking }: { booking: BookingRow }) {
  return (
    <span className="text-[#64748B] dark:text-muted-foreground">
      {booking.customer?.full_name ?? `${booking.customer_id.slice(0, 8)}...`}
    </span>
  );
}

function BookingTechnicianDisplay({
  booking,
  t,
}: {
  booking: BookingRow;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  return (
    <span className="text-[#64748B] dark:text-muted-foreground">
      {booking.technician?.full_name ??
        (booking.technician_id ? `${booking.technician_id.slice(0, 8)}...` : t('common.dash'))}
    </span>
  );
}

function BookingCard({
  booking,
  t,
  formatDateTime,
  formatCurrency,
  onModerate,
  isPending,
  isSelected,
  onSelect,
}: {
  booking: BookingRow;
  t: ReturnType<typeof useAdminT>['t'];
  formatDateTime: ReturnType<typeof useAdminT>['formatDateTime'];
  formatCurrency: ReturnType<typeof useAdminT>['formatCurrency'];
  onModerate: (request: ModerationRequest) => void;
  isPending: boolean;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}) {
  const customerName = bookingCustomerName(booking, t);
  const scheduledAt = booking.preferred_time ?? booking.created_at;

  return (
    <AdminEntityCard>
      <AdminCardSelectToggle id={booking.id} checked={isSelected} onChange={onSelect} />

      <AdminEntityCardHeader
        title={customerName}
        subtitle={t('bookings.card.subtitle')}
        badge={<BookingStatusPill status={booking.status} t={t} />}
      />

      <AdminEntityCardInfoBox className="mt-4">
        <AdminEntityCardInfoRow label={t('tables.service')} fullWidth>
          <BookingServiceDisplay booking={booking} t={t} />
        </AdminEntityCardInfoRow>
        <AdminEntityCardInfoRow label={t('tables.amount')}>
          <span className="font-semibold tabular-nums">
            {booking.price_quote != null && Number(booking.price_quote) > 0
              ? formatCurrency(Number(booking.price_quote))
              : t('common.dash')}
          </span>
        </AdminEntityCardInfoRow>
      </AdminEntityCardInfoBox>

      <AdminEntityCardMeta className="mt-3">
        <AdminEntityCardMetaPill variant="muted">
          <Calendar className="h-3 w-3 shrink-0" aria-hidden />
          {formatDateTime(scheduledAt)}
        </AdminEntityCardMetaPill>
        {booking.preferred_time ? (
          <AdminEntityCardMetaPill variant="orange">
            <Clock className="h-3 w-3 shrink-0" aria-hidden />
            {t('bookings.card.preferredTime')}
          </AdminEntityCardMetaPill>
        ) : null}
      </AdminEntityCardMeta>

      <AdminEntityCardActions>
        <AdminEntityCardActionsGroup>
          <AdminModerationActions
            id={booking.id}
            name={bookingShortRef(booking.id)}
            subject="booking"
            disabled={isPending}
            onRequest={onModerate}
          />
        </AdminEntityCardActionsGroup>
        <AdminEntityCardPrimaryAction href={`/admin/bookings/${booking.id}`} icon={Eye}>
          {t('common.view')}
        </AdminEntityCardPrimaryAction>
      </AdminEntityCardActions>
    </AdminEntityCard>
  );
}

export default function AdminBookingsPage() {
  const { t, formatDateTime, formatCurrency } = useAdminT();
  const [statusFilter, setStatusFilter] = useState('');
  const { page, limit, setPage, setLimit, resetPage } = useAdminListPagination();
  const { data, isLoading, error } = useAdminBookings(statusFilter || undefined, page, limit);
  const bookings = asAdminListItems(data, 'bookings');
  const { request: moderate, dialogProps, isPending } = useAdminModeration();

  const selection = useAdminTableSelection(
    bookings ?? [],
    `${statusFilter}|${page}|${limit}`,
  );
  const deleteBooking = useAdminDeleteBooking();
  const bulkDelete = useAdminBulkDelete({
    subject: 'bookings',
    requireConfirmPhrase: true,
    deleteOne: (id) => deleteBooking.mutateAsync({ bookingId: id }),
    // Rows that failed stay selected so the admin can see what is left over.
    onSettled: ({ failed }) => selection.replace(failed),
  });

  const statusFilters = [
    { label: t('bookings.filters.all'), value: '' },
    { label: t('bookings.filters.pending'), value: 'pending' },
    { label: t('bookings.filters.matched'), value: 'matched' },
    { label: t('bookings.filters.active'), value: 'in_progress' },
    { label: t('bookings.filters.completed'), value: 'completed' },
    { label: t('bookings.filters.cancelled'), value: 'cancelled' },
  ];

  return (
    <>
    <AdminListShell
      pageId="bookings"
      title={t('bookings.title')}
      subtitle={t('bookings.subtitle')}
      defaultView="table"
      filters={
        <AdminFilterPills
          filters={statusFilters}
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            resetPage();
          }}
        />
      }
      isLoading={isLoading}
      error={error ? translateAdminError(error.message, t) : null}
      isEmpty={!bookings?.length}
      empty={
        <AdminEmptyState
          icon={ClipboardList}
          title={t('bookings.empty.title')}
          subtitle={
            statusFilter
              ? t('bookings.empty.withStatus', { status: statusFilter })
              : t('bookings.empty.none')
          }
        />
      }
      pagination={
        data ? (
          <AdminPagination
            page={page}
            totalPages={Math.max(1, Math.ceil(data.total / data.limit))}
            total={data.total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
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
            <AdminPremiumTableHeaderCell>{t('tables.service')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.customer')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.technician')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.status')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell className="hidden md:table-cell">
              {t('tables.date')}
            </AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.action')}</AdminPremiumTableHeaderCell>
          </AdminPremiumTableHead>
          <AdminPremiumTableBody>
            {bookings?.map((b) => (
              <AdminPremiumTableRow key={b.id}>
                <AdminSelectRowCell
                  id={b.id}
                  checked={selection.isSelected(b.id)}
                  onChange={(checked) => selection.toggle(b.id, checked)}
                  disabled={bulkDelete.isPending}
                />
                <AdminPremiumTableCell dir="auto">
                  <BookingServiceDisplay booking={b} t={t} />
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <BookingCustomerDisplay booking={b} />
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <BookingTechnicianDisplay booking={b} t={t} />
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <BookingStatus status={b.status} context="admin" />
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="hidden text-[#64748B] dark:text-muted-foreground md:table-cell">
                  {formatDateTime(b.created_at)}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <div className="flex flex-wrap items-center gap-1">
                    <AdminTableActionLink href={`/admin/bookings/${b.id}`}>
                      {t('common.view')}
                    </AdminTableActionLink>
                    <AdminModerationActions
                      id={b.id}
                      name={bookingShortRef(b.id)}
                      subject="booking"
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
        bookings?.map((b) => (
          <BookingCard
            key={b.id}
            booking={b}
            t={t}
            formatDateTime={formatDateTime}
            formatCurrency={formatCurrency}
            onModerate={moderate}
            isPending={isPending}
            isSelected={selection.isSelected(b.id)}
            onSelect={(checked) => selection.toggle(b.id, checked)}
          />
        )) ?? null
      }
    />
    <AdminModerationDialog {...dialogProps} />
    <AdminModerationDialog {...bulkDelete.dialogProps} />
    </>
  );
}
