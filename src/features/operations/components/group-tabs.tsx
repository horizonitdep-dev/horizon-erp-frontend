'use client';

import { formatCount } from '@/lib/format';
import type { EmployeeGroup, MasterSummary } from '../types';
import { GROUP_LABELS, GROUP_TABS, groupTone } from '../lib/groups';

/**
 * Which group of the master list you are looking at — a second row of pills
 * under the sub-nav, deliberately NOT another sub-nav.
 *
 * The sub-nav already means "which Operations screen". Reusing it for "which
 * group" would make two different questions look like the same control.
 */
export function GroupTabs({
  value,
  summary,
  onChange,
}: {
  value: EmployeeGroup;
  summary?: MasterSummary;
  onChange: (group: EmployeeGroup) => void;
}) {
  return (
    <div className="op-groups" role="tablist" aria-label="Worker groups">
      {GROUP_TABS.map((group) => {
        const count = summary?.groups[group] ?? 0;
        const tone = groupTone(group, count);
        const selected = value === group;

        return (
          <button
            key={group}
            type="button"
            role="tab"
            aria-selected={selected}
            className="op-group"
            data-selected={selected}
            data-tone={tone}
            onClick={() => onChange(group)}
          >
            <span>{GROUP_LABELS[group]}</span>
            <span className="op-group-count">{summary ? formatCount(count) : '·'}</span>
          </button>
        );
      })}
    </div>
  );
}
