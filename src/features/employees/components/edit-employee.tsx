'use client';

import Link from 'next/link';
import { routes } from '@/core/config/routes';
import { apiMessage, statusOf } from '@/core/api/unwrap';
import { Button } from '@/components/ui/button';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { useEmployee } from '../hooks/use-employees';
import { EmployeeForm } from './employee-form';

/**
 * Loads the employee, then hands the shared form its defaults. The form is not
 * rendered until the record arrives — mounting it empty and filling it later
 * would reset anything already typed.
 */
export function EditEmployee({ id }: { id: string }) {
  const { data, isPending, isError, error, refetch } = useEmployee(id);

  if (isPending) {
    return (
      <>
        <div className="hirs-head">
          <Skeleton className="head-skeleton" />
        </div>
        <div className="panel form-panel">
          <div className="panel-skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="panel-skeleton-row" />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (isError) {
    const notFound = statusOf(error) === 404;
    return (
      <div className="panel form-panel">
        <ErrorState
          title={notFound ? 'That employee does not exist' : 'That did not load'}
          message={
            notFound
              ? 'It may have been removed. Check the list for the current record.'
              : apiMessage(error, 'The employee could not be loaded.')
          }
          action={
            <>
              <Link href={routes.hr.employees} className="btn-ghost">
                Back to employees
              </Link>
              {notFound ? null : (
                <Button variant="ghost" onClick={() => refetch()}>
                  Try again
                </Button>
              )}
            </>
          }
        />
      </div>
    );
  }

  // The form renders its own breadcrumb and header, so nothing is added here.
  return <EmployeeForm employee={data} />;
}
