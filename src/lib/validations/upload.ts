import { z } from 'zod';
import { MAX_PAYMENT_UPLOAD_SIZE_BYTES } from '@/lib/validations/payments';

export const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const ALLOWED_UPLOAD_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'] as const;

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const uploadRequestSchema = z.object({
  fileType: z.enum(ALLOWED_UPLOAD_MIME_TYPES, {
    required_error: 'fileType is required',
    invalid_type_error: 'Invalid file type. Allowed: JPEG, PNG, WebP, PDF',
  }),
  fileSize: z
    .number()
    .int()
    .positive('fileSize must be positive')
    .max(MAX_UPLOAD_SIZE_BYTES, 'File too large. Maximum size is 10MB.')
    .optional(),
  purpose: z.enum(['default', 'payment']).default('default'),
}).superRefine((data, ctx) => {
  if (data.purpose === 'payment' && data.fileSize !== undefined && data.fileSize > MAX_PAYMENT_UPLOAD_SIZE_BYTES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Payment screenshot too large. Maximum size is 5MB.',
      path: ['fileSize'],
    });
  }
});

export type UploadRequestInput = z.infer<typeof uploadRequestSchema>;
