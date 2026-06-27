'use client';

import { useState } from 'react';
import {
  useAdminPayments,
  useAdminApprovePayment,
  useAdminRejectPayment,
} from '@/hooks/use-payments';
import { PaymentStatusBadge } from '@/components/payments/payment-status-badge';
import type { AdminPayment, PaymentStatus } from '@/types/payments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AdminFilterPills,
} from '@/components/admin/admin-list-chrome';
import { AdminListShell } from '@/components/admin/admin-list-shell';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { Banknote, ExternalLink } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';

function PaymentMethodLabel({
  method,
  t,
}: {
  method: string;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  return (
    <Badge variant="outline">
      {method === 'instapay'
        ? t('payments.methods.instapay')
        : t('payments.methods.vodafoneCash')}
    </Badge>
  );
}

function PaymentActions({
  payment,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  t,
}: {
  payment: AdminPayment;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
  t: ReturnType<typeof useAdminT>['t'];
}) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');

  if (payment.status !== 'pending') return null;

  if (showReject) {
    return (
      <div className="space-y-2">
        <div>
          <Label htmlFor={`reason-${payment.id}`} className="text-xs">
            {t('payments.rejectionReason')}
          </Label>
          <Input
            id={`reason-${payment.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('payments.reasonPlaceholder')}
            className="h-8 w-full text-xs sm:w-48"
          />
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="destructive"
            disabled={!reason.trim() || isRejecting}
            onClick={() => {
              onReject(payment.id, reason.trim());
              setShowReject(false);
              setReason('');
            }}
          >
            {t('payments.confirmReject')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowReject(false);
              setReason('');
            }}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => onApprove(payment.id)} disabled={isApproving}>
        {t('payments.approve')}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setShowReject(true)}>
        {t('payments.reject')}
      </Button>
    </div>
  );
}

function PaymentCard({
  payment,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  t,
  formatDateTime,
}: {
  payment: AdminPayment;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
  t: ReturnType<typeof useAdminT>['t'];
  formatDateTime: ReturnType<typeof useAdminT>['formatDateTime'];
}) {
  return (
    <AdminEntityCard className="text-start">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="font-medium text-[#0F172A]">
              {payment.customer?.full_name ?? t('payments.customer')}
            </span>
            <PaymentMethodLabel method={payment.payment_method} t={t} />
            <PaymentStatusBadge status={payment.status} context="admin" />
          </div>
          <p className="text-sm text-[#64748B]">
            {payment.booking?.services?.name_ar ?? t('payments.booking')} ·{' '}
            {Number(payment.amount).toFixed(2)} EGP
          </p>
          <p className="text-xs text-[#94A3B8]">{formatDateTime(payment.created_at)}</p>
          {payment.rejection_reason ? (
            <p className="text-xs text-destructive">
              {t('payments.reason', { reason: payment.rejection_reason })}
            </p>
          ) : null}
          <a
            href={payment.screenshot_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[#FF6B00] underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('payments.viewScreenshot')}
          </a>
        </div>
        <PaymentActions
          payment={payment}
          onApprove={onApprove}
          onReject={onReject}
          isApproving={isApproving}
          isRejecting={isRejecting}
          t={t}
        />
      </div>
    </AdminEntityCard>
  );
}

export default function AdminPaymentsPage() {
  const { t, formatDateTime } = useAdminT();
  const [filter, setFilter] = useState<PaymentStatus | undefined>('pending');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useAdminPayments(filter, page);
  const approve = useAdminApprovePayment();
  const reject = useAdminRejectPayment();

  const filters: { label: string; value: string }[] = [
    { label: t('payments.filters.all'), value: '' },
    { label: t('payments.filters.pending'), value: 'pending' },
    { label: t('payments.filters.approved'), value: 'approved' },
    { label: t('payments.filters.rejected'), value: 'rejected' },
  ];

  const filterValue = filter ?? '';

  return (
    <AdminListShell
      pageId="payments"
      title={t('payments.title')}
      subtitle={t('payments.subtitle')}
      defaultView="cards"
      cardsLayout="stack"
      skeletonClassName="h-28 w-full rounded-2xl"
      filters={
        <AdminFilterPills
          filters={filters}
          value={filterValue}
          onChange={(value) => {
            setFilter((value as PaymentStatus) || undefined);
            setPage(1);
          }}
        />
      }
      isLoading={isLoading}
      error={error ? translateAdminError(error.message, t) : null}
      isEmpty={!data?.payments.length}
      empty={<AdminEmptyState icon={Banknote} title={t('payments.empty')} />}
      pagination={
        data ? (
          <AdminPagination
            page={page}
            totalPages={Math.max(1, Math.ceil(data.total / data.limit))}
            total={data.total}
            onPageChange={setPage}
          />
        ) : null
      }
      table={
        <AdminPremiumTable>
          <AdminPremiumTableHead>
            <AdminPremiumTableHeaderCell>{t('tables.customer')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.service')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.amount')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.status')}</AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell className="hidden md:table-cell">
              {t('tables.date')}
            </AdminPremiumTableHeaderCell>
            <AdminPremiumTableHeaderCell>{t('tables.action')}</AdminPremiumTableHeaderCell>
          </AdminPremiumTableHead>
          <AdminPremiumTableBody>
            {data?.payments.map((payment) => (
              <AdminPremiumTableRow key={payment.id}>
                <AdminPremiumTableCell className="font-medium text-[#0F172A]">
                  {payment.customer?.full_name ?? t('payments.customer')}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="text-[#64748B]">
                  {payment.booking?.services?.name_ar ?? t('payments.booking')}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="tabular-nums text-[#0F172A]" dir="ltr">
                  {Number(payment.amount).toFixed(2)} EGP
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <PaymentStatusBadge status={payment.status} context="admin" />
                </AdminPremiumTableCell>
                <AdminPremiumTableCell className="hidden text-[#64748B] md:table-cell">
                  {formatDateTime(payment.created_at)}
                </AdminPremiumTableCell>
                <AdminPremiumTableCell>
                  <PaymentActions
                    payment={payment}
                    onApprove={(id) => approve.mutate(id)}
                    onReject={(id, rejection_reason) =>
                      reject.mutate({ paymentId: id, rejection_reason })
                    }
                    isApproving={approve.isPending}
                    isRejecting={reject.isPending}
                    t={t}
                  />
                </AdminPremiumTableCell>
              </AdminPremiumTableRow>
            ))}
          </AdminPremiumTableBody>
        </AdminPremiumTable>
      }
      cards={
        data?.payments.map((payment) => (
          <PaymentCard
            key={payment.id}
            payment={payment}
            onApprove={(id) => approve.mutate(id)}
            onReject={(id, rejection_reason) =>
              reject.mutate({ paymentId: id, rejection_reason })
            }
            isApproving={approve.isPending}
            isRejecting={reject.isPending}
            t={t}
            formatDateTime={formatDateTime}
          />
        )) ?? null
      }
    />
  );
}
