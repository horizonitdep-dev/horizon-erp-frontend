import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Glow } from '@/components/shell/glow';
import { MasterList } from '@/features/operations/components/master-list';

export const metadata: Metadata = { title: 'Master list' };

/** Suspense because the list reads its filters from the URL. */
export default function MasterListPage() {
  return (
    <main className="hirs-app op-page">
      <Glow variant="module" />
      <div className="hirs-wrap">
        <Suspense fallback={null}>
          <MasterList />
        </Suspense>
      </div>
    </main>
  );
}
