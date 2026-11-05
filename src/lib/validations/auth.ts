import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(3, 'أدخل البريد أو رقم الموبايل'),
  password: z.string().min(6, 'كلمة المرور قصيرة جدًا'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'الاسم مطلوب'),
    email: z.string().email('بريد إلكتروني غير صالح'),
    password: z.string().min(8, 'كلمة المرور يجب أن تكون ٨ أحرف على الأقل'),
    confirmPassword: z.string(),
    role: z.enum(['customer', 'technician']).default('customer'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/** OAuth callback query (`/api/auth/callback?code=…&next=…&role=…`). */
export const authCallbackQuerySchema = z.object({
  code: z.string().min(1).optional(),
  next: z.string().optional(),
  role: z.enum(['customer', 'technician']).optional(),
});

export type AuthCallbackQuery = z.infer<typeof authCallbackQuerySchema>;
