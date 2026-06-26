'use client';

import { useState } from 'react';
import { format } from 'date-fns';
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

const FILTERS: { label: string; value: PaymentStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

function PaymentRow({
  payment,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  payment: AdminPayment;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');

  const methodLabel = payment.payment_method === 'instapay' ? 'InstaPay' : 'Vodafone Cash';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{payment.customer?.full_name ?? 'Customer'}</span>
              <Badge variant="outline">{methodLabel}</Badge>
              <PaymentStatusBadge status={payment.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {payment.booking?.services?.name_ar ?? 'Booking'} · {Number(payment.amount).toFixed(2)} EGP
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(payment.created_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
            {payment.rejection_reason && (
              <p className="text-xs text-destructive">Reason: {payment.rejection_reason}</p>
            )}
            <a
              href={payment.screenshot_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View screenshot
            </a>
          </div>

          {payment.status === 'pending' && (
            <div className="shrink-0 space-y-2">
              {showReject ? (
                <>
                  <div>
                    <Label htmlFor={`reason-${payment.id}`} className="text-xs">Rejection reason</Label>
                    <Input
                      id={`reason-${payment.id}`}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reason..."
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
                      Confirm Reject
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowReject(false); setReason(''); }}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onApprove(payment.id)}
                    disabled={isApproving}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowReject(true)}
                  >
                    Reject
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
  const [filter, setFilter] = useState<PaymentStatus | undefined>('pending');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useAdminPayments(filter, page);
  const approve = useAdminApprovePayment();
  const reject = useAdminRejectPayment();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="mt-1 text-muted-foreground">Review manual InstaPay and Vodafone Cash payments.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
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
          Failed to load payments.
        </div>
      ) : !data?.payments.length ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Banknote className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">No payments found</h2>
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
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {data.page} of {Math.max(1, Math.ceil(data.total / data.limit))} ({data.total} total)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * data.limit >= data.total}
                onClick={() => setPage(page + 1)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
