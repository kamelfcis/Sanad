import { z } from 'zod';
import { bookingStatusSchema, paginationPageSchema, uuidSchema } from '@/lib/validations/common';

export const adminBookingStatusSchema = z.object({
  status: bookingStatusSchema,
  reason: z.string().max(500, 'Reason must not exceed 500 characters').optional().nullable(),
});

export const auditLogsQuerySchema = paginationPageSchema.extend({
  entity_type: z.string().max(50).optional(),
  action: z.string().max(100).optional(),
});

export const adminEntityIdSchema = z.object({
  id: uuidSchema,
});

export const adminBookingsQuerySchema = paginationPageSchema.extend({
  status: bookingStatusSchema.optional(),
});
