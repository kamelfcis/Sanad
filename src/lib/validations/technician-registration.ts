import { z } from 'zod';
import {
  CAPACITY_TIERS,
  CONTRACTOR_KINDS,
  EGYPT_GOVERNORATES,
  normalizeEgyptianPhone,
  PROVIDER_ROLES,
  SPECIALIST_CONTRACTOR_SPECIALTIES,
  TEAM_SIZES,
  TECHNICIAN_SPECIALTIES,
  TECHNICIAN_TRADE_SPECIALTIES,
} from '@/lib/constants/technician-registration';

const specialtyValues = TECHNICIAN_SPECIALTIES.map((s) => s.value) as [string, ...string[]];
const governorateValues = [...EGYPT_GOVERNORATES] as [string, ...string[]];
const contractorKindValues = CONTRACTOR_KINDS.map((s) => s.value) as [string, ...string[]];
const capacityTierValues = CAPACITY_TIERS.map((s) => s.value) as [string, ...string[]];
const providerRoleValues = PROVIDER_ROLES.map((s) => s.value) as [string, ...string[]];
const tradeValues = new Set<string>(TECHNICIAN_TRADE_SPECIALTIES.map((item) => item.value));
const specialistValues = new Set<string>(SPECIALIST_CONTRACTOR_SPECIALTIES.map((item) => item.value));

const egyptianPhoneSchema = z
  .string()
  .min(1, 'رقم الموبايل مطلوب')
  .transform(normalizeEgyptianPhone)
  .refine((phone) => /^01[0125]\d{8}$/.test(phone), {
    message: 'أدخل رقم موبايل مصري صحيح (11 رقم)',
  });

const optionalEnum = <T extends [string, ...string[]]>(values: T, message: string) =>
  z.preprocess(
    (value) => (value === '' || value == null ? undefined : value),
    z.enum(values, { invalid_type_error: message }).optional(),
  );

const optionalTeamSize = z.preprocess(
  (value) => {
    if (value === '' || value == null) return undefined;
    const number = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(number) ? number : value;
  },
  z.union([z.literal(5), z.literal(10), z.literal(20)]).optional(),
);

const technicianRegisterFields = z.object({
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
    providerRole: z.enum(providerRoleValues, {
      required_error: 'اختر فني أو مقاول',
      invalid_type_error: 'اختر فني أو مقاول',
    }),
    contractorKind: optionalEnum(contractorKindValues, 'اختر نوع المقاول'),
    capacityTier: optionalEnum(capacityTierValues, 'اختر السعة الحالية'),
    teamSize: optionalTeamSize,
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
    area: z.string().min(1, 'المنطقة / الحي مطلوب').max(120, 'المنطقة طويلة جداً'),
    startingPrice: z.coerce
      .number()
      .min(1, 'سعر بداية الخدمة مطلوب')
      .max(999999, 'السعر مرتفع جداً'),
    workingHours: z.string().min(1, 'ساعات العمل مطلوبة').max(120, 'ساعات العمل طويلة جداً'),
    bio: z.string().min(20, 'اكتب نبذة لا تقل عن 20 حرف').max(500, 'النبذة طويلة جداً'),
});

function refineTechnicianRegistration(
  data: z.infer<typeof technicianRegisterFields>,
  ctx: z.RefinementCtx,
) {
    if (data.providerRole === 'technician') {
      if (!tradeValues.has(data.specialty)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'اختر تخصص الفني',
          path: ['specialty'],
        });
      }
      return;
    }

    if (!data.contractorKind) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'اختر نوع المقاول',
        path: ['contractorKind'],
      });
    }
    if (!data.capacityTier) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'اختر السعة الحالية',
        path: ['capacityTier'],
      });
    }
    if (!data.teamSize || !TEAM_SIZES.includes(data.teamSize as (typeof TEAM_SIZES)[number])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'اختر حجم الفريق: 5 أو 10 أو 20',
        path: ['teamSize'],
      });
    }
    if (data.contractorKind === 'integrated' && data.specialty !== 'general-contractor') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'المقاول المتكامل يُسجَّل تحت تخصص «مقاول متكامل»',
        path: ['specialty'],
      });
    }
    if (data.contractorKind === 'specialist' && !specialistValues.has(data.specialty)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'اختر تخصصًا محددًا للمقاول المتخصص',
        path: ['specialty'],
      });
    }
}

export const technicianRegisterSchema = technicianRegisterFields.superRefine(
  refineTechnicianRegistration,
);

export type TechnicianRegisterInput = z.infer<typeof technicianRegisterSchema>;

/** OAuth / logged-in technicians completing registration — no password */
export const technicianCompleteSchema = technicianRegisterFields
  .omit({ password: true })
  .superRefine((data, ctx) => {
    refineTechnicianRegistration(
      { ...data, password: '' } as z.infer<typeof technicianRegisterFields>,
      ctx,
    );
  });

export type TechnicianCompleteInput = z.infer<typeof technicianCompleteSchema>;
