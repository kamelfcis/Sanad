'use client';

import { Badge } from '@/components/ui/badge';
import type { PaymentStatus } from '@/types/payments';
import { cn } from '@/lib/utils/cn';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useAdminI18nOptional } from '@/lib/i18n/admin/use-admin-t';

const STATUS_VARIANTS: Record<
  PaymentStatus,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock; className: string }
> = {
  pending: {
    variant: 'secondary',
    icon: Clock,
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  approved: {
    variant: 'default',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  rejected: {
    variant: 'destructive',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

const DEFAULT_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  rejectionReason?: string | null;
  className?: string;
  context?: 'admin';
}

export function PaymentStatusBadge({
  status,
  rejectionReason,
  className,
  context,
}: PaymentStatusBadgeProps) {
  const adminI18n = useAdminI18nOptional();
  const config = STATUS_VARIANTS[status];
  const Icon = config.icon;
  const displayLabel =
    context === 'admin' && adminI18n
      ? adminI18n.t(`payments.status.${status}`)
      : DEFAULT_LABELS[status];

  return (
    <div className={cn('space-y-1', className)}>
      <Badge variant="outline" className={cn('gap-1 font-medium', config.className)}>
        <Icon className="h-3 w-3" />
        {displayLabel}
      </Badge>
      {status === 'rejected' && rejectionReason && (
        <p className="text-xs text-destructive">{rejectionReason}</p>
      )}
    </div>
  );
}
