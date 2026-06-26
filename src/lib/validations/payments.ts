import { z } from 'zod';
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '@/types/payments';
import { paginationPageSchema, uuidSchema } from '@/lib/validations/common';

export const MAX_PAYMENT_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const paymentMethodSchema = z.enum(PAYMENT_METHODS);

export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);

export const createPaymentSchema = z.object({
  payment_method: paymentMethodSchema,
  screenshot_url: z.string().url('Invalid screenshot URL'),
  amount: z.number().positive('Amount must be positive').optional(),
});

export const rejectPaymentSchema = z.object({
  rejection_reason: z
    .string()
    .min(1, 'Rejection reason is required')
    .max(500, 'Rejection reason must not exceed 500 characters'),
});

export const adminPaymentsQuerySchema = paginationPageSchema.extend({
  status: paymentStatusSchema.optional(),
});

export const updatePaymentSettingsSchema = z.object({
  instapay_number: z.string().min(1, 'InstaPay number is required').max(50),
  instapay_name: z.string().min(1, 'InstaPay account name is required').max(100),
  vodafone_cash_number: z.string().min(1, 'Vodafone Cash number is required').max(50),
  instructions: z.string().max(2000, 'Instructions must not exceed 2000 characters'),
});

export const paymentIdParamsSchema = z.object({
  id: uuidSchema,
});
