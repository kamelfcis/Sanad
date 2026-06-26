'use client';

import { Badge } from '@/components/ui/badge';
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_VARIANTS,
} from '@/lib/validations/booking';
import { useAdminI18nOptional } from '@/lib/i18n/admin/use-admin-t';

interface BookingStatusProps {
  status: string;
  context?: 'admin';
}

export function BookingStatus({ status, context }: BookingStatusProps) {
  const adminI18n = useAdminI18nOptional();
  const label =
    context === 'admin' && adminI18n
      ? adminI18n.t(`bookingStatus.${status}`)
      : (BOOKING_STATUS_LABELS[status] ?? status);
  const variant = BOOKING_STATUS_VARIANTS[status] ?? 'secondary';

  return <Badge variant={variant}>{label}</Badge>;
}
