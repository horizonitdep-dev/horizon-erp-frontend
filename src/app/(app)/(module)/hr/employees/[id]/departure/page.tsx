import type { Metadata } from 'next';
import { Glow } from '@/components/shell/glow';
import { DepartureRecord } from '@/features/departures/components/departure-record';

export const metadata: Metadata = { title: 'Departure record' };

export default async function DeparturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="hirs-app">
      <Glow variant="module" />
      <div className="hirs-wrap">
        <DepartureRecord employeeId={id} />
      </div>
    </main>
  );
}
