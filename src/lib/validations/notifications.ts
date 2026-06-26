import { z } from 'zod';
import { NOTIFICATION_TYPES } from '@/types/notifications';
import { paginationOffsetSchema, uuidSchema } from '@/lib/validations/common';

export const listNotificationsQuerySchema = paginationOffsetSchema.extend({
  is_read: z.enum(['true', 'false', 'all']).default('all'),
  type: z.enum(NOTIFICATION_TYPES).optional(),
  search: z.string().trim().max(200).optional(),
});

export const notificationIdParamsSchema = z.object({
  id: uuidSchema,
});

export const bulkNotificationIdsSchema = z.object({
  ids: z.array(uuidSchema).min(1).max(100),
});
