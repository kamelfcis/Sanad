import { z } from 'zod';
import { bookingStatusSchema, paginationOffsetSchema, uuidSchema } from '@/lib/validations/common';

export const listBookingsQuerySchema = paginationOffsetSchema.extend({
  status: bookingStatusSchema.optional(),
});

export const updateBookingStatusSchema = z.object({
  status: bookingStatusSchema,
});

/** Technician-driven job lifecycle transitions (Start / Complete). */
export const technicianBookingStatusSchema = z.object({
  status: z.enum(['in_progress', 'completed']),
});
export type TechnicianBookingStatusInput = z.infer<typeof technicianBookingStatusSchema>;

/** Required current status for each technician transition target. */
export const TECHNICIAN_STATUS_PRECONDITION: Record<'in_progress' | 'completed', string> = {
  in_progress: 'accepted',
  completed: 'in_progress',
};

/** Statuses from which a customer may cancel their own booking. */
export const CUSTOMER_CANCELLABLE_STATUSES = ['pending', 'matched', 'accepted'] as const;
export type CustomerCancellableStatus = (typeof CUSTOMER_CANCELLABLE_STATUSES)[number];

export function isCustomerCancellableStatus(
  status: string,
): status is CustomerCancellableStatus {
  return (CUSTOMER_CANCELLABLE_STATUSES as readonly string[]).includes(status);
}

/** Customer booking cancel via PATCH /api/bookings/[id] */
export const cancelBookingSchema = z.object({
  status: z.literal('cancelled'),
  reason: z.string().trim().max(500).optional(),
});

export const createBookingSchema = z.object({
  service_id: z.string().uuid('Invalid service selected'),
  description: z
    .string()
    .min(10, 'Please provide at least 10 characters describing your issue')
    .max(2000, 'Description must not exceed 2000 characters'),
  location_address: z
    .string()
    .min(5, 'Please enter a valid address')
    .max(500, 'Address must not exceed 500 characters'),
  location_lat: z.number().min(-90).max(90).optional(),
  location_lng: z.number().min(-180).max(180).optional(),
  apartment_number: z.string().trim().max(20).optional(),
  floor_number: z.string().trim().max(20).optional(),
  preferred_time: z.string().optional(),
  image_urls: z.array(z.string().url()).max(5, 'Maximum 5 images allowed').default([]),
  technician_id: uuidSchema.optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  matched: 'Matched',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

export const BOOKING_STATUS_LABELS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  matched: 'تم التطابق',
  accepted: 'مقبول',
  in_progress: 'جاري التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  disputed: 'متنازع عليه',
};

export const BOOKING_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  pending: 'secondary',
  matched: 'warning',
  accepted: 'default',
  in_progress: 'default',
  completed: 'success',
  cancelled: 'destructive',
  disputed: 'destructive',
};
