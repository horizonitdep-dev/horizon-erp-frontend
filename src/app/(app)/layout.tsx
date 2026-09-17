import { TopBar } from '@/components/shell/top-bar';
import { RequireAuth } from '@/features/auth/components/require-auth';

/**
 * The protected shell — DESIGN.md §6. Everything signed-in sits under the top
 * bar; nothing renders until the boot-time refresh has settled.
 *
 * Module tabs are NOT here: the hub mockup has a top bar and no tab row. They
 * belong to the (module) group, which is every page that is inside a
 * department. The sub-nav belongs to the module itself (see hr/layout.tsx).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <TopBar />
      {children}
    </RequireAuth>
  );
}
