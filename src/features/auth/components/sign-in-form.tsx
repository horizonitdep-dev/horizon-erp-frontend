'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { PasswordField, TextField } from '@/components/ui/text-field';
import { AlertIcon, MailIcon } from '@/components/ui/icons';
import { loginSchema, type LoginFormValues } from '../schemas/login.schema';
import { useLogin } from '../hooks/use-login';

export function SignInForm({ redirectTo }: { redirectTo?: string }) {
  const { signIn, isPending, error } = useLogin(redirectTo);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  const onSubmit = handleSubmit((values) => {
    signIn({ email: values.email, password: values.password, remember: values.rememberMe });
  });

  return (
    <form className="signin-form an" onSubmit={onSubmit} noValidate>
      <h1 className="t-h2">Sign in</h1>
      <p className="lede">Use your Horizon work account.</p>

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@horizon.ae"
        icon={<MailIcon />}
        error={errors.email?.message}
        {...register('email')}
      />

      <PasswordField
        label="Password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password')}
      />

      {/* The server's own message — a rejected sign-in explains itself. */}
      {error ? (
        <p className="field-error signin-form-error" role="alert">
          <AlertIcon size={14} />
          {error}
        </p>
      ) : null}

      <div className="signin-row">
        <label>
          <input type="checkbox" className="checkbox" {...register('rememberMe')} />
          Keep me signed in
        </label>
        <a href="/forgot-password">Forgot password?</a>
      </div>

      <div className="signin-submit">
        <Button variant="submit" type="submit" disabled={isPending}>
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </div>

      <p className="signin-note">
        Accounts are provisioned by IT.
        <br />
        Contact the service desk for access.
      </p>
    </form>
  );
}
