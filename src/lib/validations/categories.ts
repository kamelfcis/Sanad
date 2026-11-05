import { z } from 'zod';
import { slugSchema } from '@/lib/validations/common';

export const createCategorySchema = z.object({
  name_ar: z.string().min(1, 'Arabic name is required').max(100),
  name_en: z.string().min(1, 'English name is required').max(100),
  slug: slugSchema,
  description: z.string().max(1000).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export const updateCategorySchema = createCategorySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
);

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
