import { z } from 'zod';
import { priceTypeSchema, slugSchema, uuidSchema } from '@/lib/validations/common';

export const listServicesQuerySchema = z.object({
  category: z.string().max(100).optional(),
  category_id: uuidSchema.optional(),
  id: uuidSchema.optional(),
});

export const createServiceSchema = z.object({
  category_id: uuidSchema,
  name_ar: z.string().min(1, 'Arabic name is required').max(100),
  name_en: z.string().min(1, 'English name is required').max(100),
  slug: slugSchema,
  description: z.string().max(2000).optional().nullable(),
  price: z.number().min(0).max(999999).optional().nullable(),
  price_type: priceTypeSchema.optional().default('fixed'),
  is_active: z.boolean().optional().default(true),
});

export const updateServiceSchema = createServiceSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
);

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
