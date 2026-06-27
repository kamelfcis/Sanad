import { z } from 'zod';
import { paginationPageSchema, slugSchema } from '@/lib/validations/common';
import { CATEGORY_PRESET_ICON_KEYS } from '@/lib/icons/category-icons';

const categoryIconTypeSchema = z.enum(['preset', 'upload']);

const categoryFieldsSchema = z.object({
  name_ar: z.string().min(1, 'Arabic name is required').max(100),
  name_en: z.string().min(1, 'English name is required').max(100),
  slug: slugSchema,
  description: z.string().max(1000).optional().nullable(),
  icon: z.string().max(2048).optional().nullable(),
  icon_type: categoryIconTypeSchema.optional(),
  is_active: z.boolean().optional(),
});

function refineCategoryIcon(
  data: {
    icon?: string | null;
    icon_type?: 'preset' | 'upload';
  },
  ctx: z.RefinementCtx,
) {
  const iconType = data.icon_type ?? 'preset';

  if (iconType === 'preset' && data.icon && !CATEGORY_PRESET_ICON_KEYS.includes(data.icon)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid preset icon',
      path: ['icon'],
    });
  }

  if (iconType === 'upload' && data.icon && !data.icon.startsWith('http')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Uploaded icon must be a valid URL',
      path: ['icon'],
    });
  }
}

export const createCategorySchema = categoryFieldsSchema
  .extend({
    icon_type: categoryIconTypeSchema.optional().default('preset'),
    is_active: z.boolean().optional().default(true),
  })
  .superRefine(refineCategoryIcon);

export const updateCategorySchema = categoryFieldsSchema
  .partial()
  .superRefine(refineCategoryIcon)
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const adminCategoriesQuerySchema = paginationPageSchema.extend({
  search: z.string().max(100).optional(),
});
