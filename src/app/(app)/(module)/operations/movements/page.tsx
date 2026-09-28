import type { Metadata } from 'next';
import { Glow } from '@/components/shell/glow';
import { MovementLog } from '@/features/operations/components/movement-log';

export const metadata: Metadata = { title: 'Mobilization' };

export default function MovementsPage() {
  return (
    <main className="hirs-app">
      <Glow variant="module" />
      <div className="hirs-wrap">
        <MovementLog />
      </div>
    </main>
  );
}
