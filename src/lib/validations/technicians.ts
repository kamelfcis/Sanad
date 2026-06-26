import { z } from 'zod';
import { paginationPageSchema, uuidSchema, verificationStatusSchema } from '@/lib/validations/common';
import { EGYPT_GOVERNORATES, TECHNICIAN_SPECIALTIES } from '@/lib/constants/technician-registration';

const specialtyValues = TECHNICIAN_SPECIALTIES.map((s) => s.value) as [string, ...string[]];
const governorateValues = [...EGYPT_GOVERNORATES] as [string, ...string[]];

export const browseTechniciansSortSchema = z.enum(['rating', 'price', 'distance', 'response']);

export const browseTechniciansQuerySchema = paginationPageSchema.extend({
  search: z.string().max(100).optional(),
  specialty: z.enum(specialtyValues).optional(),
  category: z.string().max(100).optional(),
  governorate: z.enum(governorateValues).optional(),
  sort: browseTechniciansSortSchema.optional().default('rating'),
  maxPrice: z.coerce.number().min(0).max(10000).optional(),
  availableOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export const updateTechnicianProfileSchema = z.object({
  bio: z.string().max(2000, 'Bio must not exceed 2000 characters').optional().nullable(),
  years_experience: z
    .number()
    .int()
    .min(0, 'Years of experience cannot be negative')
    .max(60, 'Years of experience seems too high')
    .optional()
    .nullable(),
  max_distance_km: z
    .number()
    .min(1, 'Minimum distance is 1 km')
    .max(500, 'Maximum distance is 500 km')
    .optional(),
  is_available: z.boolean().optional(),
  phone: z
    .string()
    .max(20, 'Phone number is too long')
    .regex(/^[\d+\-\s()]*$/, 'Invalid phone number format')
    .optional()
    .nullable(),
});

export const updateTechnicianSkillsSchema = z.object({
  skills: z
    .array(
      z.object({
        service_id: uuidSchema,
        price_override: z.number().min(0).max(999999).optional().nullable(),
      }),
    )
    .max(50, 'Maximum 50 skills allowed'),
});

export const adminTechniciansQuerySchema = paginationPageSchema.extend({
  search: z.string().max(100).optional(),
  status: verificationStatusSchema.optional(),
});

export const adminTechnicianStatusSchema = z.object({
  action: z.enum(['approve', 'reject', 'suspend', 'reactivate'], {
    required_error: 'Action is required',
  }),
  reason: z.string().max(500, 'Reason must not exceed 500 characters').optional().nullable(),
});

export const adminCustomersQuerySchema = paginationPageSchema.extend({
  search: z.string().max(100).optional(),
});

export type UpdateTechnicianProfileInput = z.infer<typeof updateTechnicianProfileSchema>;
