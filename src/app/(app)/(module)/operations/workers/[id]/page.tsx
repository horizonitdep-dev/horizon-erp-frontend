import type { Metadata } from 'next';
import { Glow } from '@/components/shell/glow';
import { WorkerDetail } from '@/features/operations/components/worker-detail';

export const metadata: Metadata = { title: 'Worker' };

export default async function WorkerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="hirs-app">
      <Glow variant="module" />
      <div className="hirs-wrap">
        <WorkerDetail workerId={id} />
      </div>
    </main>
  );
}
