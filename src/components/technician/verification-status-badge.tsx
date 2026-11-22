'use client';

import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Clock, XCircle, Ban } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary'; icon: typeof ShieldCheck; className?: string }
> = {
  verified: {
    label: 'موثّق',
    variant: 'success',
    icon: ShieldCheck,
  },
  pending: {
    label: 'قيد المراجعة',
    variant: 'warning',
    icon: Clock,
    className: 'border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100',
  },
  rejected: {
    label: 'مرفوض',
    variant: 'destructive',
    icon: XCircle,
  },
  suspended: {
    label: 'موقوف',
    variant: 'secondary',
    icon: Ban,
  },
};

export function VerificationStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: 'secondary' as const,
    icon: Clock,
  };
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant === 'destructive' ? 'destructive' : config.variant === 'success' ? 'success' : 'outline'}
      className={cn('gap-1.5 px-3 py-1', config.className)}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {config.label}
    </Badge>
  );
}
