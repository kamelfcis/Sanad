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
  AdminEntityCardTagPill,
  AdminFilterPills,
} from '@/components/admin/admin-list-chrome';
import { AdminListShell } from '@/components/admin/admin-list-shell';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { Banknote, ExternalLink, Calendar } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';

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
  formatCurrency,
}: {
  payment: AdminPayment;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
  t: ReturnType<typeof useAdminT>['t'];
  formatDateTime: ReturnType<typeof useAdminT>['formatDateTime'];
  formatCurrency: ReturnType<typeof useAdminT>['formatCurrency'];
}) {
  return (
    <AdminEntityCard>
      <AdminEntityCardHeader
        title={payment.customer?.full_name ?? t('payments.customer')}
        subtitle={formatCurrency(Number(payment.amount))}
        badge={<PaymentStatusBadge status={payment.status} context="admin" />}
      />

      <AdminEntityCardMeta className="mt-3">
        <AdminEntityCardTagPill>
          {payment.payment_method === 'instapay'
            ? t('payments.methods.instapay')
            : t('payments.methods.vodafoneCash')}
        </AdminEntityCardTagPill>
      </AdminEntityCardMeta>

      <AdminEntityCardInfoBox className="mt-4">
        <AdminEntityCardInfoRow label={t('tables.service')} fullWidth>
          <span className="text-[#64748B]">
            {payment.booking?.services?.name_ar ?? t('payments.booking')}
          </span>
        </AdminEntityCardInfoRow>
        {payment.rejection_reason ? (
          <AdminEntityCardInfoRow label={t('payments.rejectionReason')} fullWidth>
            <span className="text-destructive">{payment.rejection_reason}</span>
          </AdminEntityCardInfoRow>
        ) : null}
      </AdminEntityCardInfoBox>

      <AdminEntityCardMeta className="mt-3">
        <AdminEntityCardMetaPill variant="muted">
          <Calendar className="h-3 w-3 shrink-0" aria-hidden />
          {formatDateTime(payment.created_at)}
        </AdminEntityCardMetaPill>
        <AdminEntityCardPrimaryAction
          href={payment.screenshot_url}
          icon={ExternalLink}
          ariaLabel={t('payments.viewScreenshot')}
          external
          className="px-3 py-1 text-xs"
        >
          {t('payments.viewScreenshot')}
        </AdminEntityCardPrimaryAction>
      </AdminEntityCardMeta>

      {payment.status === 'pending' ? (
        <AdminEntityCardActions>
          <AdminEntityCardActionsGroup>
            <PaymentActions
              payment={payment}
              onApprove={onApprove}
              onReject={onReject}
              isApproving={isApproving}
              isRejecting={isRejecting}
              t={t}
            />
          </AdminEntityCardActionsGroup>
        </AdminEntityCardActions>
      ) : null}
    </AdminEntityCard>
  );
}

export default function AdminPaymentsPage() {
  const { t, formatDateTime, formatCurrency } = useAdminT();
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
      defaultView="table"
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
                  {formatCurrency(Number(payment.amount))}
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
            formatCurrency={formatCurrency}
          />
        )) ?? null
      }
    />
  );
}
