import { z } from 'zod';
import { bookingStatusSchema, paginationOffsetSchema, uuidSchema } from '@/lib/validations/common';

export const listBookingsQuerySchema = paginationOffsetSchema.extend({
  status: bookingStatusSchema.optional(),
});

export const updateBookingStatusSchema = z.object({
  status: bookingStatusSchema,
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

export const BOOKING_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  pending: 'secondary',
  matched: 'warning',
  accepted: 'default',
  in_progress: 'default',
  completed: 'success',
  cancelled: 'destructive',
  disputed: 'destructive',
};
