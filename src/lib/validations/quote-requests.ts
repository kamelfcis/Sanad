import { z } from 'zod';
import { uuidSchema } from '@/lib/validations/common';

export const QUOTE_STATUSES = ['submitted', 'quoted', 'accepted', 'declined'] as const;

export const QUOTE_STATUS_LABELS_AR: Record<(typeof QUOTE_STATUSES)[number], string> = {
  submitted: 'بانتظار العرض',
  quoted: 'تم التسعير',
  accepted: 'مقبول',
  declined: 'مرفوض',
};

export const createQuoteRequestSchema = z.object({
  contractor_id: uuidSchema,
  specialty: z.string().max(80).optional().nullable(),
  project_description: z.string().min(10, 'وصف المشروع قصير جدًا').max(2000),
  address: z.string().min(5, 'العنوان مطلوب').max(500),
});

export const updateQuoteRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('quote'),
    quoted_amount: z.coerce.number().positive('أدخل مبلغ العرض').max(10_000_000),
  }),
  z.object({
    action: z.literal('decline'),
  }),
  z.object({
    action: z.literal('accept'),
  }),
]);

export type CreateQuoteRequestInput = z.infer<typeof createQuoteRequestSchema>;
export type UpdateQuoteRequestInput = z.infer<typeof updateQuoteRequestSchema>;
