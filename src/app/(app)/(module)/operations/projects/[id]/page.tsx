import type { Metadata } from 'next';
import { Glow } from '@/components/shell/glow';
import { ProjectDetail } from '@/features/operations/components/project-detail';

export const metadata: Metadata = { title: 'Project' };

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="hirs-app">
      <Glow variant="module" />
      <div className="hirs-wrap">
        <ProjectDetail projectId={id} />
      </div>
    </main>
  );
}
