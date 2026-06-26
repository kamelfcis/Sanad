import { z } from 'zod';
import { uuidSchema } from '@/lib/validations/common';

const ALLOWED_CHAT_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const listMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().max(50).optional(),
});

export const sendMessageSchema = z
  .object({
    message: z
      .string()
      .max(5000, 'Message must not exceed 5000 characters')
      .optional()
      .nullable(),
    file_url: z.string().url('Invalid file URL').optional().nullable(),
    file_type: z.enum(ALLOWED_CHAT_FILE_TYPES).optional().nullable(),
  })
  .refine(
    (data) => (data.message && data.message.trim().length > 0) || data.file_url,
    { message: 'Message or file is required', path: ['message'] },
  )
  .refine((data) => !data.file_url || data.file_type, {
    message: 'file_type is required when file_url is provided',
    path: ['file_type'],
  });

export const conversationIdSchema = z.object({
  id: uuidSchema,
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
