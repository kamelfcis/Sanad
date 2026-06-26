'use client';

import { Badge } from '@/components/ui/badge';
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_VARIANTS,
} from '@/lib/validations/booking';

interface BookingStatusProps {
  status: string;
}

export function BookingStatus({ status }: BookingStatusProps) {
  const label = BOOKING_STATUS_LABELS[status] ?? status;
  const variant = BOOKING_STATUS_VARIANTS[status] ?? 'secondary';

  return <Badge variant={variant}>{label}</Badge>;
}
