import { z } from 'zod';

/**
 * Mirrors the backend LoginDto exactly: email must be a valid email, password
 * must be present. The backend does not set a minimum length on sign-in (only
 * on password *change*), so neither does this — a client-side minimum would
 * lock out a valid existing account.
 *
 * `rememberMe` is deliberately not part of the payload. The API runs
 * forbidNonWhitelisted and rejects it with a 400; it only decides which browser
 * store holds the refresh token.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address')
    .email('That does not look like an email address'),
  password: z.string().min(1, 'Enter your password'),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
