'use client';

import { Badge } from '@/components/ui/badge';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Awaiting Response',
  accepted: 'Accepted',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'destructive',
  cancelled: 'secondary',
};

interface AssignmentStatusProps {
  status: string;
}

export function AssignmentStatus({ status }: AssignmentStatusProps) {
  const label = STATUS_LABELS[status] ?? status;
  const variant = STATUS_VARIANTS[status] ?? 'secondary';
  return <Badge variant={variant}>{label}</Badge>;
}
