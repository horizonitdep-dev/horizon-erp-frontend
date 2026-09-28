'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiMessage, fieldErrors, statusOf } from '@/core/api/unwrap';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/components/ui/text-field';
import { AlertIcon } from '@/components/ui/icons';
import { useChangePassword } from '../hooks/use-change-password';
import { useSession } from '../hooks/use-session';
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from '../schemas/change-password.schema';

/**
 * Change password — forced on first sign-in. Every account is seeded with a
 * known password (`<name>@HIRS2026`), so until it is replaced the app shows
 * nothing else.
 */
export function ChangePasswordForm() {
  const { user } = useSession();
  const change = useChangePassword();
  const forced = !!user?.mustChangePassword;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(({ currentPassword, newPassword }) => {
    change.mutate(
      { currentPassword, newPassword },
      {
        onError: (error) => {
          if (statusOf(error) === 401) {
            setError('currentPassword', { message: 'That is not your current password' });
            return;
          }
          for (const e of fieldErrors(error)) {
            if (e.field === 'newPassword' || e.field === 'currentPassword') {
              setError(e.field, { message: e.message });
            }
          }
        },
      },
    );
  });

  // A 401 or a field error is shown on its input; anything else goes here.
  const generalError =
    change.isError && statusOf(change.error) !== 401 && fieldErrors(change.error).length === 0
      ? apiMessage(change.error, 'Your password could not be changed. Try again.')
      : null;

  return (
    <section className="panel cp-panel an">
      <form className="cp-form" onSubmit={onSubmit} noValidate>
        <h1 className="t-h2">{forced ? 'Set your own password' : 'Change password'}</h1>
        <p className="lede">
          {forced
            ? 'Your account was created with a temporary password. Choose your own before continuing.'
            : 'Signing in elsewhere will end once your password changes.'}
        </p>

        <PasswordField
          label={forced ? 'Temporary password' : 'Current password'}
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <PasswordField
          label="New password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <p className="cp-rules">At least 8 characters, with a letter and a number.</p>

        {generalError ? (
          <p className="field-error" role="alert">
            <AlertIcon size={14} />
            {generalError}
          </p>
        ) : null}

        <Button type="submit" variant="submit" disabled={change.isPending}>
          {change.isPending ? 'Saving…' : forced ? 'Set password and continue' : 'Change password'}
        </Button>
      </form>
    </section>
  );
}
