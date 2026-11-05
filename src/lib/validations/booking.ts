import { z } from 'zod';
import { bookingStatusSchema, paginationOffsetSchema, uuidSchema } from '@/lib/validations/common';

export const CUSTOMER_CANCELLABLE_STATUSES = ['pending', 'matched', 'accepted'] as const;

export function isCustomerCancellableStatus(status: string): boolean {
  return (CUSTOMER_CANCELLABLE_STATUSES as readonly string[]).includes(status);
}

export const createBookingSchema = z.object({
  service_id: uuidSchema,
  description: z.string().min(10, 'الوصف قصير جدًا').max(2000),
  location_address: z.string().min(5, 'العنوان مطلوب').max(500),
  location_lat: z.number().finite().optional().nullable(),
  location_lng: z.number().finite().optional().nullable(),
  apartment_number: z.string().max(50).optional().nullable(),
  floor_number: z.string().max(50).optional().nullable(),
  preferred_time: z.string().optional().nullable(),
  image_urls: z.array(z.string().url()).max(8).default([]),
  technician_id: uuidSchema.optional().nullable(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const listBookingsQuerySchema = paginationOffsetSchema.extend({
  status: bookingStatusSchema.optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional().nullable(),
});

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  matched: 'Matched',
  accepted: 'Accepted',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

export const BOOKING_STATUS_LABELS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  matched: 'تم التعيين',
  accepted: 'مقبول',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  disputed: 'متنازع عليه',
};

export const BOOKING_STATUS_VARIANTS: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  pending: 'warning',
  matched: 'secondary',
  accepted: 'success',
  in_progress: 'default',
  completed: 'success',
  cancelled: 'destructive',
  disputed: 'outline',
};
