import { z } from 'zod';
import { normalizeEgyptianPhone } from '@/lib/constants/technician-registration';

const loginIdentifierSchema = z
  .string()
  .min(1, 'Email or phone is required')
  .refine(
    (val) =>
      z.string().email().safeParse(val).success ||
      /^01[0125]\d{8}$/.test(normalizeEgyptianPhone(val)),
    { message: 'Please enter a valid email address or Egyptian mobile number' },
  );

export const loginSchema = z.object({
  email: loginIdentifierSchema,
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['customer', 'technician'], {
      required_error: 'Please select a role',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const roleSelectionSchema = z.object({
  role: z.enum(['customer', 'technician'], {
    required_error: 'Please select a role',
  }),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/** OAuth callback query params — blocks open redirects via `next` */
export const authCallbackQuerySchema = z.object({
  code: z.string().min(1).optional(),
  next: z
    .string()
    .max(500)
    .refine((path) => path.startsWith('/') && !path.startsWith('//'), {
      message: 'Invalid redirect path',
    })
    .optional(),
  role: z.enum(['customer', 'technician']).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type AuthCallbackQuery = z.infer<typeof authCallbackQuerySchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RoleSelectionInput = z.infer<typeof roleSelectionSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
