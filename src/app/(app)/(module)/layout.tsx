import { ModuleTabs } from '@/components/shell/module-tabs';

/**
 * Pages that live inside a department: top bar (from the parent) → module tabs
 * → the page. A route group, so it adds chrome without touching any URL.
 */
export default function ModuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ModuleTabs />
      {children}
    </>
  );
}
