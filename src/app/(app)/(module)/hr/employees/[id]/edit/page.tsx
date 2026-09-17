import type { Metadata } from 'next';
import { Glow } from '@/components/shell/glow';
import { EditEmployee } from '@/features/employees/components/edit-employee';

export const metadata: Metadata = { title: 'Edit employee' };

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="hirs-app ef-page">
      <Glow variant="module" />
      <div className="hirs-wrap">
        <EditEmployee id={id} />
      </div>
    </main>
  );
}
