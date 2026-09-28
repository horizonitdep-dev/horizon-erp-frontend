import { z } from 'zod';

/**
 * Mirrors ChangePasswordDto: at least 8 characters with a letter and a number,
 * plus the server's refusal to "change" to the same password — otherwise a
 * forced change could be satisfied by re-typing the seeded one.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Za-z]/, 'Include at least one letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string().min(1, 'Type the new password again'),
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ['newPassword'],
    message: 'Choose a password different from your current one',
  })
  .refine((v) => v.confirmPassword === v.newPassword, {
    path: ['confirmPassword'],
    message: 'The two passwords do not match',
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
