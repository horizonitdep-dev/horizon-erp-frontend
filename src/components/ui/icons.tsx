/**
 * Icons extracted from the mockups — DESIGN.md §10.
 *
 * 24×24 viewBox, fill="none", stroke="currentColor", round caps and joins.
 * Stroke width varies by icon and is part of the design: do not normalise it.
 * Use lucide-react only for an icon that is not here.
 */

type IconProps = {
  size?: number;
  className?: string;
};

type BaseProps = IconProps & {
  strokeWidth: number;
  children: React.ReactNode;
};

function Icon({ size, strokeWidth, className, children }: BaseProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/* ── UI icons — sizes and strokes from §10 ─────────────────────────────── */

export function SearchIcon({ size = 15, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  );
}

export function BellIcon({ size = 19, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.6} className={className}>
      <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
      <path d="M13.7 20a2 2 0 0 1-3.4 0" />
    </Icon>
  );
}

export function MailIcon({ size = 18, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.6} className={className}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="m3 7 9 6 9-6" />
    </Icon>
  );
}

export function EyeIcon({ size = 18, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.6} className={className}>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </Icon>
  );
}

export function EyeOffIcon({ size = 18, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.6} className={className}>
      <path d="M9.9 5.7A9.9 9.9 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a17.6 17.6 0 0 1-3.4 4.1" />
      <path d="M6.2 6.9A17.4 17.4 0 0 0 2 12s3.6 6.5 10 6.5a9.7 9.7 0 0 0 4.1-.9" />
      <path d="M9.9 9.9a2.8 2.8 0 0 0 4 4" />
      <path d="m3 3 18 18" />
    </Icon>
  );
}

export function PlusIcon({ size = 16, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} className={className}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function ExportIcon({ size = 16, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.7} className={className}>
      <path d="M12 15V3" />
      <path d="m7.5 7.5 4.5-4.5 4.5 4.5" />
      <path d="M3.5 15v3.5a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V15" />
    </Icon>
  );
}

export function ChevronDownIcon({ size = 13, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} className={className}>
      <path d="m5 8.5 7 7 7-7" />
    </Icon>
  );
}

export function CheckIcon({ size = 13, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2.4} className={className}>
      <path d="m4 12.5 5 5L20 6.5" />
    </Icon>
  );
}

export function AlertIcon({ size = 14, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.8} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.3v.2" />
    </Icon>
  );
}

export function SunIcon({ size = 16, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.7} className={className}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
    </Icon>
  );
}

export function MoonIcon({ size = 16, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.7} className={className}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.5 8.5 0 1 0 20 14.2Z" />
    </Icon>
  );
}

export function PencilIcon({ size = 14, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.7} className={className}>
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </Icon>
  );
}

export function MoreIcon({ size = 14, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} className={className}>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </Icon>
  );
}

export function InboxIcon({ size = 20, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.6} className={className}>
      <path d="M3 13h4l1.5 3h7L17 13h4" />
      <path d="M5.5 4.5h13l2.5 8.5v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Z" />
    </Icon>
  );
}

export function InfoIcon({ size = 14, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={2} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8v.01" />
    </Icon>
  );
}

/* ── Project types and accommodation — from hirs-ops-add-project.html ──── */

/** A client site; also "client provided" accommodation. */
export function SiteIcon({ size = 17, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.7} className={className}>
      <path d="M3 20V9.5L12 3l9 6.5V20" />
      <path d="M9 20v-6h6v6" />
    </Icon>
  );
}

export function MarkupIcon({ size = 17, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.7} className={className}>
      <rect x="2.5" y="7" width="19" height="13" rx="2.5" />
      <path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
      <path d="M2.5 12h19" />
    </Icon>
  );
}

export function InternalIcon({ size = 17, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.7} className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M8 4v16M3 10h5" />
    </Icon>
  );
}

export function CampIcon({ size = 16, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.7} className={className}>
      <path d="M4 21V10l8-6 8 6v11" />
      <path d="M4 14h16M9 21v-5h6v5" />
    </Icon>
  );
}

/* ── Department icons — 23px, stroke 1.6, paths transcribed from §10 ────── */

export function OverviewIcon({ size = 23, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.6} className={className}>
      <path d="M3 12h4l3 8 4-16 3 8h4" />
    </Icon>
  );
}

export function HrIcon({ size = 23, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.6} className={className}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M17 11a3 3 0 1 0 0-6" />
      <path d="M18 20a6 6 0 0 0-3-5.2" />
    </Icon>
  );
}

export function BusinessIcon({ size = 23, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.6} className={className}>
      <rect x="2.5" y="7" width="19" height="13" rx="2.5" />
      <path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
      <path d="M2.5 12h19" />
    </Icon>
  );
}

export function OperationsIcon({ size = 23, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.6} className={className}>
      <path d="M3 20V9.5L12 3l9 6.5V20" />
      <path d="M9 20v-6h6v6" />
    </Icon>
  );
}

export function FinanceIcon({ size = 23, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.6} className={className}>
      <path d="M12 2v20" />
      <path d="M17 6.5c0-2-2.2-3-5-3s-5 1-5 3 2.2 2.8 5 3.5 5 1.5 5 3.5-2.2 3-5 3-5-1-5-3" />
    </Icon>
  );
}

export function ItIcon({ size = 23, className }: IconProps) {
  return (
    <Icon size={size} strokeWidth={1.6} className={className}>
      <rect x="2.5" y="4" width="19" height="13" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </Icon>
  );
}

/** Department icon by module id, for the hub cards and KPI row. */
export const DEPARTMENT_ICONS = {
  overview: OverviewIcon,
  hr: HrIcon,
  business: BusinessIcon,
  operations: OperationsIcon,
  finance: FinanceIcon,
  it: ItIcon,
} as const;
