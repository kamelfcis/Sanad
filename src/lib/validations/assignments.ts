import { z } from 'zod';
import { assignmentStatusSchema, uuidSchema } from '@/lib/validations/common';

export const assignmentRespondSchema = z.object({
  action: z.enum(['accept', 'reject'], {
    required_error: 'Action is required',
    invalid_type_error: 'Action must be "accept" or "reject"',
  }),
});

export const adminAssignTechnicianSchema = z.object({
  technician_id: uuidSchema,
});

export const listAssignmentsQuerySchema = z.object({
  status: assignmentStatusSchema.optional(),
});

export type AssignmentRespondInput = z.infer<typeof assignmentRespondSchema>;
