import type { Metadata } from 'next';
import { Glow } from '@/components/shell/glow';
import { ProjectWriteGate } from '@/features/operations/components/project-write-gate';
import { ProjectForm } from '@/features/operations/components/project-form';

export const metadata: Metadata = { title: 'Add project' };

/** The form owns its breadcrumb, header, rail and fixed action bar. */
export default function NewProjectPage() {
  return (
    <main className="hirs-app ef-page">
      <Glow variant="module" />
      <div className="hirs-wrap">
        <ProjectWriteGate>
          <ProjectForm />
        </ProjectWriteGate>
      </div>
    </main>
  );
}
