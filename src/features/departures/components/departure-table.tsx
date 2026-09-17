'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { routes } from '@/core/config/routes';
import { EM_DASH, formatDate, initials } from '@/lib/format';
import { REASON_LABELS, type DepartureListItem } from '../types';
import { ApprovalTicks, StageStatus } from './departure-stage';

/**
 * Cancelled employees — the same table markup as Current employees, different
 * columns (guide §7): Employee, Designation, Reason, Departure date, Stage,
 * Approvals.
 *
 * Row click opens the departure record — the one place in HR where a row click
 * goes somewhere this sprint. The name is also a real link, so the row is
 * reachable by keyboard and middle-click without relying on the row handler.
 */

const columnHelper = createColumnHelper<DepartureListItem>();

/** The only column here the API can sort by. */
const SORTABLE = new Set(['departureDate']);

export function DepartureTable({
  data,
  sorting,
  onSortingChange,
}: {
  data: DepartureListItem[];
  sorting: SortingState;
  onSortingChange: (updater: React.SetStateAction<SortingState>) => void;
}) {
  const router = useRouter();

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.employee.name, {
        id: 'employee',
        header: 'Employee',
        enableSorting: false,
        cell: (info) => {
          const { employee, referenceNo } = info.row.original;
          return (
            <div className="cell-name">
              <span className="chip">{initials(employee.name)}</span>
              <div>
                <Link
                  href={routes.hr.departure(employee.id)}
                  className="cell-link"
                  onClick={(event) => event.stopPropagation()}
                >
                  <b>{employee.name}</b>
                </Link>
                <span title={referenceNo}>{employee.employeeCode}</span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.employee.designation, {
        id: 'designation',
        header: 'Designation',
        enableSorting: false,
        cell: (info) => info.getValue() || EM_DASH,
      }),
      columnHelper.accessor('reason', {
        header: 'Reason',
        enableSorting: false,
        cell: (info) => {
          const reason = info.getValue();
          return reason ? REASON_LABELS[reason] : <span className="cell-muted">Not set</span>;
        },
      }),
      columnHelper.accessor('departureDate', {
        header: 'Departure date',
        cell: (info) => <span className="cell-num">{formatDate(info.getValue())}</span>,
      }),
      columnHelper.accessor('stage', {
        header: 'Stage',
        enableSorting: false,
        cell: (info) => <StageStatus stage={info.getValue()} />,
      }),
      columnHelper.display({
        id: 'approvals',
        header: 'Approvals',
        cell: (info) => <ApprovalTicks {...info.row.original.approvals} />,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="table-scroll">
      <table className="hirs-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = SORTABLE.has(header.column.id) && header.column.getCanSort();
                const direction = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    aria-sort={
                      direction === 'asc'
                        ? 'ascending'
                        : direction === 'desc'
                          ? 'descending'
                          : undefined
                    }
                  >
                    {canSort ? (
                      <button
                        type="button"
                        className="th-sort"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span className="th-sort-arrow" aria-hidden="true">
                          {direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : ''}
                        </span>
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              data-voided={row.original.stage === 'VOIDED' || undefined}
              onClick={() => router.push(routes.hr.departure(row.original.employee.id))}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
