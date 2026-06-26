import { Badge } from '@/components/ui/badge';
import type { PaymentStatus } from '@/types/payments';
import { cn } from '@/lib/utils/cn';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock; className: string }
> = {
  pending: {
    label: 'Pending Review',
    variant: 'secondary',
    icon: Clock,
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  approved: {
    label: 'Approved',
    variant: 'default',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  rejectionReason?: string | null;
  className?: string;
}

export function PaymentStatusBadge({ status, rejectionReason, className }: PaymentStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className={cn('space-y-1', className)}>
      <Badge variant="outline" className={cn('gap-1 font-medium', config.className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
      {status === 'rejected' && rejectionReason && (
        <p className="text-xs text-destructive">{rejectionReason}</p>
      )}
    </div>
  );
}
