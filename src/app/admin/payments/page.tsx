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
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Banknote, ExternalLink } from 'lucide-react';
import { useAdminT } from '@/lib/i18n/admin/use-admin-t';
import { translateAdminError } from '@/lib/i18n/admin/translate-error';

function PaymentRow({
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
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');

  const methodLabel =
    payment.payment_method === 'instapay'
      ? t('payments.methods.instapay')
      : t('payments.methods.vodafoneCash');

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{payment.customer?.full_name ?? t('payments.customer')}</span>
              <Badge variant="outline">{methodLabel}</Badge>
              <PaymentStatusBadge status={payment.status} context="admin" />
            </div>
            <p className="text-sm text-muted-foreground">
              {payment.booking?.services?.name_ar ?? t('payments.booking')} · {Number(payment.amount).toFixed(2)} EGP
            </p>
            <p className="text-xs text-muted-foreground">{formatDateTime(payment.created_at)}</p>
            {payment.rejection_reason && (
              <p className="text-xs text-destructive">{t('payments.reason', { reason: payment.rejection_reason })}</p>
            )}
            <a
              href={payment.screenshot_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t('payments.viewScreenshot')}
            </a>
          </div>

          {payment.status === 'pending' && (
            <div className="shrink-0 space-y-2">
              {showReject ? (
                <>
                  <div>
                    <Label htmlFor={`reason-${payment.id}`} className="text-xs">{t('payments.rejectionReason')}</Label>
                    <Input
                      id={`reason-${payment.id}`}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t('payments.reasonPlaceholder')}
                      className="h-8 w-48 text-xs"
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
                    <Button size="sm" variant="ghost" onClick={() => { setShowReject(false); setReason(''); }}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => onApprove(payment.id)} disabled={isApproving}>
                    {t('payments.approve')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowReject(true)}>
                    {t('payments.reject')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPaymentsPage() {
  const { t, formatDateTime } = useAdminT();
  const [filter, setFilter] = useState<PaymentStatus | undefined>('pending');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useAdminPayments(filter, page);
  const approve = useAdminApprovePayment();
  const reject = useAdminRejectPayment();

  const filters: { label: string; value: PaymentStatus | undefined }[] = [
    { label: t('payments.filters.all'), value: undefined },
    { label: t('payments.filters.pending'), value: 'pending' },
    { label: t('payments.filters.approved'), value: 'approved' },
    { label: t('payments.filters.rejected'), value: 'rejected' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t('payments.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('payments.subtitle')}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={String(f.value)}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-muted-foreground/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {translateAdminError(error.message, t)}
        </div>
      ) : !data?.payments.length ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Banknote className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">{t('payments.empty')}</h2>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.payments.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                onApprove={(id) => approve.mutate(id)}
                onReject={(id, rejection_reason) => reject.mutate({ paymentId: id, rejection_reason })}
                isApproving={approve.isPending}
                isRejecting={reject.isPending}
                t={t}
                formatDateTime={formatDateTime}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('common.pageOf', {
                page: data.page,
                totalPages: Math.max(1, Math.ceil(data.total / data.limit)),
                total: data.total,
              })}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" /> {t('common.previous')}
              </Button>
              <Button variant="outline" size="sm" disabled={page * data.limit >= data.total} onClick={() => setPage(page + 1)}>
                {t('common.next')} <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
