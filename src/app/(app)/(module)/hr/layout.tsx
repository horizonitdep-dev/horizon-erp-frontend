import { HrSubNav } from '@/features/employees/components/hr-sub-nav';

/** HR adds the sub-nav above the content — DESIGN.md §11 module page. */
export default function HrLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HrSubNav />
      {children}
    </>
  );
}
