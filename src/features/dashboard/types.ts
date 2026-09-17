import type { ModuleId } from '@/core/config/modules';

/**
 * ⚠️ NOT CONFIRMED — GET /dashboard/summary does not exist on the backend yet
 * (HIRS API 1.0 exposes auth and users only). This mirrors what the dashboard
 * and hub mockups display, so the screens light up unchanged when it ships.
 *
 * Until then every panel renders its error state and every figure renders `—`,
 * rather than a fabricated number.
 */

export type DashboardRange = 'month' | 'quarter' | 'year';

export interface DepartmentKpi {
  id: ModuleId;
  label: string;
  /** `null` renders as `—`. A KPI with no data is not a zero. */
  value: number | null;
  /** The mono line under the number, e.g. "18 joined this month". */
  detail?: string | null;
  /** The bordered footer line, e.g. "9 documents expiring". */
  alert?: string | null;
  alertLevel?: 'warn' | 'bad' | 'good' | null;
}

export interface ManagerRow {
  id: string;
  manager: string;
  clients: number | null;
  headcount: number | null;
  /** Minor units are not used; this is a plain AED amount. */
  value: number | null;
  margin: number | null;
}

export interface AttentionItem {
  id: string;
  text: string;
  /** "Today" / "This week" — the group heading it sits under. */
  group: string;
  /** Relative timestamp shown right-aligned in mono. */
  ago: string;
  level: 'warn' | 'bad' | 'good';
  href?: string | null;
}

export interface DeploymentMonth {
  /** Three-letter month label, e.g. "Aug". */
  month: string;
  value: number;
  current?: boolean;
}

export interface DashboardSummary {
  kpis: DepartmentKpi[];
  managers: ManagerRow[];
  attention: AttentionItem[];
  deployment: DeploymentMonth[];
  /** Drives the hub headline count. Absent means the headline stays static. */
  actionCount?: number | null;
}
