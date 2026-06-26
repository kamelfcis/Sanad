import { z } from 'zod';

export const uuidSchema = z.string().uuid('Invalid ID format');

export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug must not exceed 100 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens');

export const paginationOffsetSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const paginationPageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const bookingStatusSchema = z.enum([
  'pending',
  'matched',
  'accepted',
  'in_progress',
  'completed',
  'cancelled',
  'disputed',
]);

export const assignmentStatusSchema = z.enum(['pending', 'accepted', 'rejected', 'cancelled']);

export const verificationStatusSchema = z.enum([
  'unverified',
  'pending',
  'verified',
  'rejected',
]);

export const priceTypeSchema = z.enum(['fixed', 'hourly', 'estimate']);

/** Routes with no query parameters — rejects unexpected keys */
export const emptyQuerySchema = z.object({}).strict();
