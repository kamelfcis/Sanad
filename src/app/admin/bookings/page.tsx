'use client';

import { useState } from 'react';
import { useAdminBookings } from '@/hooks/use-admin';
import { BookingStatus } from '@/components/shared/booking-status';
import { ClipboardList } from 'lucide-react';
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
  AdminFilterPills,
  AdminTableActionLink,
} from '@/components/admin/admin-list-chrome';
import { AdminListShell } from '@/components/admin/admin-list-shell';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';

type BookingRow = NonNullable<ReturnType<typeof useAdminBookings>['data']>[number];

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
}: {
  booking: BookingRow;
  t: ReturnType<typeof useAdminT>['t'];
  formatDateTime: ReturnType<typeof useAdminT>['formatDateTime'];
}) {
  return (
    <AdminEntityCard>
      <AdminEntityCardField label={t('tables.service')}>
        <BookingServiceDisplay booking={booking} t={t} />
      </AdminEntityCardField>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <AdminEntityCardField label={t('tables.customer')}>
          <BookingCustomerDisplay booking={booking} />
        </AdminEntityCardField>
        <AdminEntityCardField label={t('tables.technician')}>
          <BookingTechnicianDisplay booking={booking} t={t} />
        </AdminEntityCardField>
        <AdminEntityCardField label={t('tables.status')}>
          <BookingStatus status={booking.status} context="admin" />
        </AdminEntityCardField>
        <AdminEntityCardField label={t('tables.date')}>
          <span className="text-[#64748B]">{formatDateTime(booking.created_at)}</span>
        </AdminEntityCardField>
      </div>
      <AdminEntityCardActions>
        <AdminTableActionLink href={`/admin/bookings/${booking.id}`}>
          {t('common.view')}
        </AdminTableActionLink>
      </AdminEntityCardActions>
    </AdminEntityCard>
  );
}

export default function AdminBookingsPage() {
  const { t, formatDateTime } = useAdminT();
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
          <BookingCard key={b.id} booking={b} t={t} formatDateTime={formatDateTime} />
        )) ?? null
      }
    />
  );
}
