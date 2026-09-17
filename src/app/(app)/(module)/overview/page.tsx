import type { Metadata } from 'next';
import { Glow } from '@/components/shell/glow';
import { DashboardView } from '@/features/dashboard/components/dashboard-view';

export const metadata: Metadata = { title: 'Overview' };

/** Dashboard — DESIGN.md §11. Content at 1320px, 40px padding all round. */
export default function OverviewPage() {
  return (
    <main className="hirs-app dash-page">
      <Glow variant="dash" />
      <div className="hirs-wrap hirs-wrap--dash">
        <DashboardView />
      </div>
    </main>
  );
}
