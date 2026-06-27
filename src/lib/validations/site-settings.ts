import { z } from 'zod';
import { SUPPORTED_CURRENCIES } from '@/lib/currency/constants';

export const updateSiteSettingsSchema = z.object({
  currency: z.enum(SUPPORTED_CURRENCIES),
});
