import type { Metadata } from 'next';
import { Glow } from '@/components/shell/glow';
import { EmployeeList } from '@/features/employees/components/employee-list';

export const metadata: Metadata = { title: 'Current employees' };

/** Module page — DESIGN.md §11. Content at 1320px, 36px top padding. */
export default function EmployeesPage() {
  return (
    <main className="hirs-app">
      <Glow variant="module" />
      <div className="hirs-wrap">
        <EmployeeList />
      </div>
    </main>
  );
}
