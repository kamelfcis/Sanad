import { z } from 'zod';
import { paginationOffsetSchema, uuidSchema } from '@/lib/validations/common';

export const createReviewSchema = z.object({
  booking_id: uuidSchema,
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comment: z
    .string()
    .max(2000, 'Comment must not exceed 2000 characters')
    .optional()
    .nullable(),
});

export const listReviewsQuerySchema = paginationOffsetSchema
  .extend({
    technician_id: uuidSchema.optional(),
    booking_id: uuidSchema.optional(),
  })
  .refine((data) => data.technician_id || data.booking_id, {
    message: 'technician_id or booking_id is required',
    path: ['technician_id'],
  });

export const adminListReviewsQuerySchema = z.object({
  hidden: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const moderateReviewSchema = z.object({
  action: z.enum(['hide', 'restore'], {
    required_error: 'Action is required',
    invalid_type_error: 'Action must be "hide" or "restore"',
  }),
  note: z.string().max(1000, 'Note must not exceed 1000 characters').optional().nullable(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
