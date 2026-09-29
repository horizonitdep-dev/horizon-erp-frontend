import { z } from 'zod';
import { ACCOMMODATIONS, MANAGED_BY, PROJECT_TYPES } from '../types';

/**
 * Mirrors the project DTO. Only a client site is managed by a department —
 * nobody "runs" a visa-only company or the office — so managed-by is required
 * for SITE and ignored for the other two.
 */
export const projectSchema = z
  .object({
    type: z.enum(PROJECT_TYPES),
    name: z.string().trim().min(2, 'Give the project a name'),
    location: z.string().trim().optional(),
    // A radio group with nothing checked reads as null, not undefined — an
    // internal row has no manager, and accommodation is optional for all.
    managedBy: z.enum(MANAGED_BY).nullish(),
    accommodation: z.enum(ACCOMMODATIONS).nullish(),
    inDailyReport: z.boolean(),
    remark: z.string().trim().optional(),
  })
  .refine((v) => v.type !== 'SITE' || !!v.managedBy, {
    path: ['managedBy'],
    message: 'Pick who manages this site',
  });

export type ProjectFormValues = z.infer<typeof projectSchema>;
