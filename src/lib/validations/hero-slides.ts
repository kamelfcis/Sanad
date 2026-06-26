import { z } from 'zod';
import { slugSchema } from '@/lib/validations/common';

const iconKeySchema = z
  .string()
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'Icon key must be lowercase alphanumeric with hyphens')
  .optional()
  .nullable();

export const createHeroSlideSchema = z.object({
  image_url: z.string().url('Valid image URL is required').max(2048),
  title_ar: z.string().min(1, 'Arabic title is required').max(100),
  subtitle_ar: z.string().min(1, 'Arabic subtitle is required').max(200).default('خدمة احترافية'),
  icon_key: iconKeySchema,
  service_category_slug: slugSchema.optional().nullable(),
  sort_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional().default(true),
});

export const updateHeroSlideSchema = createHeroSlideSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
);

export const reorderHeroSlidesSchema = z.object({
  ordered_ids: z.array(z.string().uuid()).min(1),
});

export type CreateHeroSlideInput = z.infer<typeof createHeroSlideSchema>;
export type UpdateHeroSlideInput = z.infer<typeof updateHeroSlideSchema>;
