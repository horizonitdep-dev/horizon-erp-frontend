import type { Metadata } from 'next';
import { Glow } from '@/components/shell/glow';
import { ProjectList } from '@/features/operations/components/project-list';

export const metadata: Metadata = { title: 'Projects' };

export default function ProjectsPage() {
  return (
    <main className="hirs-app">
      <Glow variant="module" />
      <div className="hirs-wrap">
        <ProjectList />
      </div>
    </main>
  );
}
