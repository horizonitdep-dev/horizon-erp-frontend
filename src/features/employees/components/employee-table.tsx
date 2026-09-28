'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { routes } from '@/core/config/routes';
import { EM_DASH, formatDate, initials } from '@/lib/format';
import { PencilIcon } from '@/components/ui/icons';
import { EmployeeStatus, VisaExpiry } from './employee-status';
import { SORTABLE_FIELDS, type Employee } from '../types';

/**
 * DESIGN.md §7 TABLE. TanStack Table owns sorting and column state; the markup
 * stays ours. Paging and filtering are server-side, so the table is told what
 * to display rather than deriving it.
 *
 * The mockup's "Deployed to" and "Camp" columns have no backend equivalent —
 * per the add-employee design, camp, client and site belong to the Operations
 * module, not the employee record. Department and reporting manager are the
 * real fields for that slot, so they take it rather than two permanently empty
 * columns.
 *
 * Row click is a deliberate no-op: employee detail is out of this sprint.
 */

const columnHelper = createColumnHelper<Employee>();

/** Only these four are sortable server-side; the rest render inert headers. */
const SORTABLE = new Set<string>(SORTABLE_FIELDS);

export function EmployeeTable({
  data,
  sorting,
  onSortingChange,
}: {
  data: Employee[];
  sorting: SortingState;
  onSortingChange: (updater: React.SetStateAction<SortingState>) => void;
}) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Employee',
        cell: (info) => {
          const employee = info.row.original;
          return (
            <div className="cell-name">
              <span className="chip">{initials(employee.name)}</span>
              <div>
                <b>{employee.name}</b>
                <span>{employee.employeeCode}</span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.trade?.name ?? null, {
        id: 'trade',
        header: 'Designation',
        enableSorting: false,
        cell: (info) => info.getValue() || EM_DASH,
      }),
      columnHelper.accessor('nationality', {
        header: 'Nationality',
        enableSorting: false,
        cell: (info) => info.getValue() || EM_DASH,
      }),
      columnHelper.accessor('department', {
        header: 'Department',
        enableSorting: false,
        cell: (info) => info.getValue() || EM_DASH,
      }),
      columnHelper.accessor('reportingManager', {
        header: 'Reporting to',
        enableSorting: false,
        cell: (info) => info.getValue() || EM_DASH,
      }),
      columnHelper.accessor('joiningDate', {
        header: 'Joined',
        cell: (info) => <span className="cell-num">{formatDate(info.getValue())}</span>,
      }),
      // A display column, not an accessor: the expiry lives on the current visa
      // DOCUMENT now, and the API cannot order by a to-many relation's column.
      columnHelper.display({
        id: 'visaExpiry',
        header: 'Visa expiry',
        cell: (info) => <VisaExpiry employee={info.row.original} />,
      }),
      columnHelper.display({
        id: 'status',
        header: 'Status',
        cell: (info) => <EmployeeStatus employee={info.row.original} />,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => (
          <div className="row-actions">
            <Link
              className="row-action"
              href={routes.hr.editEmployee(info.row.original.id)}
              aria-label={`Edit ${info.row.original.name}`}
            >
              <PencilIcon />
            </Link>
          </div>
        ),
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
            <tr key={row.id} data-inert="true">
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
