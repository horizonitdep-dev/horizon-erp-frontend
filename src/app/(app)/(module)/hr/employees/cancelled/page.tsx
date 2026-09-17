import type { Metadata } from 'next';
import { Glow } from '@/components/shell/glow';
import { DepartureList } from '@/features/departures/components/departure-list';

export const metadata: Metadata = { title: 'Cancelled employees' };

/** A static segment, so it takes precedence over the sibling [id] routes. */
export default function CancelledEmployeesPage() {
  return (
    <main className="hirs-app">
      <Glow variant="module" />
      <div className="hirs-wrap">
        <DepartureList />
      </div>
    </main>
  );
}
