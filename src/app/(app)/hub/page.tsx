import type { Metadata } from 'next';
import { Glow } from '@/components/shell/glow';
import { HubCards } from '@/features/dashboard/components/hub-cards';

export const metadata: Metadata = { title: 'Hub' };

/**
 * Navigation hub — DESIGN.md §11. Top bar, then content at 1120px with 88px
 * top padding. No module tab row on this screen.
 */
export default function HubPage() {
  return (
    <main className="hirs-app hub-page">
      <Glow variant="hub" />
      <div className="hirs-wrap hirs-wrap--hub">
        <HubCards />
      </div>
    </main>
  );
}
