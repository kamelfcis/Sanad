import { z } from 'zod';

const egyptianPhoneSchema = z
  .string()
  .trim()
  .min(11, 'رقم الموبايل مطلوب')
  .max(11)
  .refine((phone) => /^01[0125]\d{8}$/.test(phone), {
    message: 'أدخل رقم موبايل مصري صحيح (01xxxxxxxxx)',
  });

export const customerProfileSchema = z.object({
  full_name: z.string().min(2, 'الاسم مطلوب').max(120),
  phone: egyptianPhoneSchema,
  default_address: z.string().min(5, 'العنوان مطلوب').max(500),
  default_location_lat: z.number().min(-90).max(90),
  default_location_lng: z.number().min(-180).max(180),
  default_apartment_number: z.string().max(32).optional().nullable(),
  default_floor_number: z.string().max(32).optional().nullable(),
});

export type CustomerProfileInput = z.infer<typeof customerProfileSchema>;
