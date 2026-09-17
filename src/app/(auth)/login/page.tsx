import type { Metadata } from 'next';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SignInForm } from '@/features/auth/components/sign-in-form';

export const metadata: Metadata = { title: 'Sign in' };

/**
 * DESIGN.md §11. Two columns, 44% / 56%, min-height 760px.
 * The left panel is graphite in both themes — `.on-graphite` re-scopes the
 * tokens locally, so nothing here duplicates a colour value.
 */

/**
 * ⚠️ FLAGGED (guide §6.1) — these come from a public endpoint if one exists.
 * No backend yet, so they render the mockup's static values.
 */
const PANEL_STATS = [
  { value: '412', caption: 'People on the books today' },
  { value: '23', caption: 'Active contracts across the Gulf' },
  { value: '3', caption: 'Camps, 480 beds, 87% occupied' },
] as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="signin">
      <aside className="signin-left on-graphite">
        <span className="glow glow--signin-left" />

        <div className="hirs-logo">
          <span className="hirs-spark hirs-spark--lg">H</span>
          <span className="t-logo-lg">HIRS</span>
        </div>

        <div className="signin-brief an">
          <h1 className="t-display-lg">
            Manpower,
            <br />
            <span className="grad-text">managed.</span>
          </h1>
          <p>
            Contracts, camps, deployment and payroll — one system, from mobilisation to final
            settlement.
          </p>

          <div className="signin-stats">
            {PANEL_STATS.map((stat) => (
              <div key={stat.caption}>
                <div className="t-metric-sm">{stat.value}</div>
                <div className="cap">{stat.caption}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="signin-fine">Horizon Group of Companies · Abu Dhabi · Est. 1995</p>
      </aside>

      <main className="signin-right">
        <span className="glow glow--signin-right" />
        <div className="signin-theme-toggle">
          <ThemeToggle />
        </div>
        <SignInForm redirectTo={next} />
      </main>
    </div>
  );
}
