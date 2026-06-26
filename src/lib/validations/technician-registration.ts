import { z } from 'zod';
import {
  EGYPT_GOVERNORATES,
  normalizeEgyptianPhone,
  TECHNICIAN_SPECIALTIES,
} from '@/lib/constants/technician-registration';

const specialtyValues = TECHNICIAN_SPECIALTIES.map((s) => s.value) as [string, ...string[]];
const governorateValues = [...EGYPT_GOVERNORATES] as [string, ...string[]];

const egyptianPhoneSchema = z
  .string()
  .min(1, 'رقم الموبايل مطلوب')
  .transform(normalizeEgyptianPhone)
  .refine((phone) => /^01[0125]\d{8}$/.test(phone), {
    message: 'أدخل رقم موبايل مصري صحيح (11 رقم)',
  });

export const technicianRegisterSchema = z.object({
  fullName: z
    .string()
    .min(1, 'الاسم بالكامل مطلوب')
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .max(100, 'الاسم طويل جداً'),
  phone: egyptianPhoneSchema,
  password: z
    .string()
    .min(1, 'كلمة السر مطلوبة')
    .min(8, 'كلمة السر 8 أحرف على الأقل'),
  nationalId: z
    .string()
    .min(1, 'الرقم القومي مطلوب')
    .regex(/^\d{14}$/, 'الرقم القومي يجب أن يكون 14 رقم'),
  specialty: z.enum(specialtyValues, {
    required_error: 'اختر التخصص',
    invalid_type_error: 'اختر التخصص',
  }),
  yearsExperience: z.coerce
    .number()
    .int('سنين الخبرة يجب أن تكون رقم صحيح')
    .min(0, 'سنين الخبرة لا يمكن أن تكون سالبة')
    .max(60, 'سنين الخبرة غير منطقية'),
  governorate: z.enum(governorateValues, {
    required_error: 'اختر المحافظة',
    invalid_type_error: 'اختر المحافظة',
  }),
  area: z
    .string()
    .min(1, 'المنطقة / الحي مطلوب')
    .max(120, 'المنطقة طويلة جداً'),
  startingPrice: z.coerce
    .number()
    .min(1, 'سعر بداية الخدمة مطلوب')
    .max(999999, 'السعر مرتفع جداً'),
  workingHours: z
    .string()
    .min(1, 'ساعات العمل مطلوبة')
    .max(120, 'ساعات العمل طويلة جداً'),
  bio: z
    .string()
    .min(20, 'اكتب نبذة لا تقل عن 20 حرف')
    .max(500, 'النبذة طويلة جداً'),
});

export type TechnicianRegisterInput = z.infer<typeof technicianRegisterSchema>;

/** OAuth / logged-in technicians completing registration — no password */
export const technicianCompleteSchema = technicianRegisterSchema.omit({ password: true });

export type TechnicianCompleteInput = z.infer<typeof technicianCompleteSchema>;
