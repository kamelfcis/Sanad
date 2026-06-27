'use client';

import { useState } from 'react';
import { useAdminBookings } from '@/hooks/use-admin';
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
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';

type BookingRow = NonNullable<ReturnType<typeof useAdminBookings>['data']>[number];

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
      <p className="truncate font-medium text-[#0F172A]">
        {booking.services?.name_ar ?? t('common.unknown')}
      </p>
      <p className="text-xs text-[#64748B]">{booking.services?.name_en}</p>
    </>
  );
}

function BookingCustomerDisplay({ booking }: { booking: BookingRow }) {
  return (
    <span className="text-[#64748B]">
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
    <span className="text-[#64748B]">
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
}: {
  booking: BookingRow;
  t: ReturnType<typeof useAdminT>['t'];
  formatDateTime: ReturnType<typeof useAdminT>['formatDateTime'];
  formatCurrency: ReturnType<typeof useAdminT>['formatCurrency'];
}) {
  const customerName = bookingCustomerName(booking, t);
  const scheduledAt = booking.preferred_time ?? booking.created_at;

  return (
    <AdminEntityCard>
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
        <AdminEntityCardActionsGroup />
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
  const { data: bookings, isLoading, error } = useAdminBookings(statusFilter || undefined);

  const statusFilters = [
    { label: t('bookings.filters.all'), value: '' },
    { label: t('bookings.filters.pending'), value: 'pending' },
    { label: t('bookings.filters.matched'), value: 'matched' },
    { label: t('bookings.filters.active'), value: 'in_progress' },
    { label: t('bookings.filters.completed'), value: 'completed' },
    { label: t('bookings.filters.cancelled'), value: 'cancelled' },
  ];

  return (
    <AdminListShell
      pageId="bookings"
      title={t('bookings.title')}
      subtitle={t('bookings.subtitle')}
      defaultView="table"
      filters={
        <AdminFilterPills filters={statusFilters} value={statusFilter} onChange={setStatusFilter} />
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
      table={
        <AdminPremiumTable>
          <AdminPremiumTableHead>
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
                <AdminPremiumTableCell className="hidden text-[#64748B] md:table-cell">
                  {formatDateTime(b.created_at)}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <AdminTableActionLink href={`/admin/bookings/${b.id}`}>
                    {t('common.view')}
                  </AdminTableActionLink>
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
          />
        )) ?? null
      }
    />
  );
}
