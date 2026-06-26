import { z } from 'zod';
import type { AdminTranslator } from '@/lib/i18n/admin/types';

export function createAdminCategorySchema(t: AdminTranslator) {
  return z.object({
    name_ar: z.string().min(1, t('validation.nameArRequired')),
    name_en: z.string().min(1, t('validation.nameEnRequired')),
    slug: z.string().min(1, t('validation.slugRequired')),
    description: z.string().optional(),
    icon: z.string().optional(),
  });
}

export function createAdminServiceSchema(t: AdminTranslator) {
  return z.object({
    category_id: z.string().min(1, t('validation.categoryRequired')),
    name_ar: z.string().min(1, t('validation.nameArRequired')),
    name_en: z.string().min(1, t('validation.nameEnRequired')),
    slug: z.string().min(1, t('validation.slugRequired')),
    description: z.string().optional(),
    price: z.number().nullable().optional(),
    price_type: z.enum(['fixed', 'hourly', 'estimate']),
  });
}

export function createAdminHeroSlideSchema(t: AdminTranslator) {
  return z.object({
    image_url: z.string().min(1, t('validation.imageRequired')),
    title_ar: z.string().min(1, t('validation.titleRequired')),
    subtitle_ar: z.string().min(1, t('validation.required')),
    icon_key: z.string().optional(),
    service_category_slug: z.string().nullable().optional(),
    is_active: z.boolean(),
  });
}

export function createAdminBookingCancelSchema(t: AdminTranslator) {
  return z.object({
    reason: z.string().min(1, t('validation.reasonRequired')),
  });
}

export function createAdminPaymentRejectSchema(t: AdminTranslator) {
  return z.object({
    rejection_reason: z.string().min(1, t('validation.reasonRequired')),
  });
}

export function createAdminReviewModerationSchema(_t: AdminTranslator) {
  return z.object({
    note: z.string().optional(),
  });
}

export function createAdminSettingsSchema(t: AdminTranslator) {
  return z.object({
    platformName: z.string().min(1, t('validation.required')),
    supportEmail: z.string().email(t('validation.invalidEmail')),
  });
}

export function createAdminPaymentSettingsSchema(t: AdminTranslator) {
  return z.object({
    instapay_number: z.string().min(1, t('validation.required')),
    instapay_name: z.string().min(1, t('validation.required')),
    vodafone_cash_number: z.string().min(1, t('validation.required')),
    instructions: z.string().min(1, t('validation.required')),
  });
}
