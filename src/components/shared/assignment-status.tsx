'use client';

import { Badge } from '@/components/ui/badge';
import { useDashboardLocale } from '@/lib/i18n/dashboard-locale';

const STATUS_LABELS_AR: Record<string, string> = {
  pending: 'بانتظار الرد',
  accepted: 'مقبول',
  rejected: 'مرفوض',
  cancelled: 'ملغي',
};

const STATUS_LABELS_EN: Record<string, string> = {
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
  const { locale } = useDashboardLocale();
  const labels = locale === 'en' ? STATUS_LABELS_EN : STATUS_LABELS_AR;
  const label = labels[status] ?? status;
  const variant = STATUS_VARIANTS[status] ?? 'secondary';
  return <Badge variant={variant}>{label}</Badge>;
}
