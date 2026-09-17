'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { UserRole } from '@/core/config/roles';
import { routes } from '@/core/config/routes';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { RoleGate } from '@/features/auth/components/role-gate';
import { useCancelEmployee } from '../hooks/use-employee-mutations';
import type { Employee } from '../types';

const WRITE_ROLES: readonly UserRole[] = ['HR', 'CHAIRMAN', 'MD'];

/**
 * The cancel flow — guide §7. Confirm, open a draft departure, route straight
 * to it. No reason is asked for here: it is picked on the departure form among
 * the other fields, and asking twice is worse.
 *
 * A cancelled employee gets a link to their departure record instead.
 */
export function CancelEmployment({ employee }: { employee: Employee }) {
  const [open, setOpen] = useState(false);
  const cancel = useCancelEmployee();

  if (employee.employmentStatus === 'CANCELLED') {
    return (
      <Link href={routes.hr.departure(employee.id)} className="btn-ghost">
        View departure record
      </Link>
    );
  }

  return (
    <RoleGate allow={WRITE_ROLES}>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Cancel employment
      </Button>
      <ConfirmDialog
        open={open}
        title={`Cancel ${employee.name}?`}
        confirmLabel="Cancel and open departure form"
        tone="danger"
        isPending={cancel.isPending}
        onClose={() => setOpen(false)}
        onConfirm={() =>
          cancel.mutate({ id: employee.id, name: employee.name }, { onSettled: () => setOpen(false) })
        }
      >
        <p>
          {employee.name} moves to Cancelled employees and a departure form is opened for HR to fill
          in. You will pick the reason for leaving on that form.
        </p>
        <p>This can be undone by reinstating — the departure form is then voided, not deleted.</p>
      </ConfirmDialog>
    </RoleGate>
  );
}
