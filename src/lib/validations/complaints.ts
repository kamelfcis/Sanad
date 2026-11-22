import { z } from 'zod';
import { uuidSchema } from '@/lib/validations/common';

export const createComplaintSchema = z.object({
  booking_id: uuidSchema,
  body: z
    .string()
    .min(10, 'اكتب تفاصيل الشكوى (10 أحرف على الأقل)')
    .max(2000, 'النص طويل جداً'),
});

export const adminComplaintUpdateSchema = z.object({
  status: z.enum(['open', 'reviewing', 'closed']),
  admin_notes: z.string().max(2000).optional().nullable(),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
