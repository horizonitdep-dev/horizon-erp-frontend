import { OperationsSubNav } from '@/features/operations/components/operations-sub-nav';

/** Operations adds its sub-nav above the content — DESIGN.md §11 module page. */
export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OperationsSubNav />
      {children}
    </>
  );
}
