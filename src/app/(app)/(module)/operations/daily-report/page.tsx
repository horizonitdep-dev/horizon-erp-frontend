import type { Metadata } from 'next';
import { Glow } from '@/components/shell/glow';
import { DailyReportPage } from '@/features/operations/components/daily-report';

export const metadata: Metadata = { title: 'Daily report' };

export default function DailyReport() {
  return (
    <main className="hirs-app">
      <Glow variant="module" />
      <div className="hirs-wrap">
        <DailyReportPage />
      </div>
    </main>
  );
}
