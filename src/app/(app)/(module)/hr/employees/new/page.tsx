import type { Metadata } from 'next';
import { Glow } from '@/components/shell/glow';
import { EmployeeForm } from '@/features/employees/components/employee-form';

export const metadata: Metadata = { title: 'Add employee' };

/** The form owns its breadcrumb, header, rail and fixed action bar. */
export default function NewEmployeePage() {
  return (
    <main className="hirs-app ef-page">
      <Glow variant="module" />
      <div className="hirs-wrap">
        <EmployeeForm />
      </div>
    </main>
  );
}
