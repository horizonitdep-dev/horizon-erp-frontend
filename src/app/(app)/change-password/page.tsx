import type { Metadata } from 'next';
import { Glow } from '@/components/shell/glow';
import { ChangePasswordForm } from '@/features/auth/components/change-password-form';

export const metadata: Metadata = { title: 'Change password' };

/**
 * Inside the protected shell, so it needs a session — but outside the (module)
 * group, so there are no tabs to wander off through while a change is forced.
 */
export default function ChangePasswordPage() {
  return (
    <main className="hirs-app">
      <Glow variant="module" />
      <div className="hirs-wrap cp-wrap">
        <ChangePasswordForm />
      </div>
    </main>
  );
}
