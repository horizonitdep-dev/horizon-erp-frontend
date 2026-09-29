import type { Metadata } from 'next';
import { Glow } from '@/components/shell/glow';
import { EditProject } from '@/features/operations/components/edit-project';
import { ProjectWriteGate } from '@/features/operations/components/project-write-gate';

export const metadata: Metadata = { title: 'Edit project' };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="hirs-app ef-page">
      <Glow variant="module" />
      <div className="hirs-wrap">
        <ProjectWriteGate>
          <EditProject id={id} />
        </ProjectWriteGate>
      </div>
    </main>
  );
}
