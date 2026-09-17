import { z } from 'zod';

/**
 * Environment, validated once at module load so a missing or malformed value
 * fails loudly at boot rather than as a confusing runtime error later.
 *
 * NEXT_PUBLIC_* vars must be referenced by their full literal name — Next
 * inlines them at build time and cannot see a dynamic lookup.
 */

const schema = z.object({
  apiUrl: z.string().min(1, 'NEXT_PUBLIC_API_URL is required'),
  visaUrgentDays: z.coerce.number().int().positive(),
  visaWarningDays: z.coerce.number().int().positive(),
});

const parsed = schema.safeParse({
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003/api/v1',
  visaUrgentDays: process.env.NEXT_PUBLIC_VISA_URGENT_DAYS ?? 30,
  visaWarningDays: process.env.NEXT_PUBLIC_VISA_WARNING_DAYS ?? 90,
});

if (!parsed.success) {
  throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
