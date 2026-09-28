'use client';

import { useState } from 'react';
import { ACCESS } from '@/core/config/access';
import { apiMessage } from '@/core/api/unwrap';
import { Button } from '@/components/ui/button';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { PlusIcon } from '@/components/ui/icons';
import { EM_DASH, formatDate } from '@/lib/format';
import { useCanAccess } from '@/features/auth/components/access-gate';
import { useTrades } from '@/core/reference/use-trades';
import {
  useCreateVehicle,
  useDailyReport,
  useDeleteVehicle,
  useSaveDailyLog,
  useSaveExpectedArrival,
} from '../hooks/use-operations';
import { today } from '../lib/format';
import type { DailyLog } from '../types';
import { DailyMatrix } from './daily-matrix';

/**
 * The daily manpower report.
 *
 * The matrix is computed, so any past date reproduces that day exactly. The
 * three panels below it are the parts that genuinely are typed in, and each
 * saves on its own — this page is filled in across a day by different people,
 * and one save button for all of it loses somebody's work.
 */
export function DailyReportPage() {
  const [date, setDate] = useState(today());
  const query = useDailyReport(date);
  const canWrite = useCanAccess(ACCESS.operationsDailyWrite);

  return (
    <>
      <div className="hirs-head an">
        <div>
          <h1 className="t-h1">Daily report</h1>
          <p className="lede">
            Headcount is worked out from the placements, so any past date can be reproduced. Only
            the camp figures, vehicles and expected arrivals are typed in.
          </p>
        </div>
        <div className="head-actions">
          <label className="op-inline-field" htmlFor="op-report-date">
            <span>Date</span>
            <input
              id="op-report-date"
              type="date"
              value={date}
              max={today()}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
        </div>
      </div>

      <section className="panel an">
        <header className="ef-phead">
          <div>
            <h2>Manpower on {formatDate(date)}</h2>
            <p className="note">
              Projects first, then statuses. Each man is counted once — on a handover day he counts
              at the site he moved to.
            </p>
          </div>
        </header>

        <div className="ef-pbody">
          {query.isPending ? (
            <div className="panel-skeleton">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="panel-skeleton-row" />
              ))}
            </div>
          ) : query.isError ? (
            <ErrorState
              message={apiMessage(query.error, 'The daily report could not be loaded.')}
              action={
                <Button variant="ghost" onClick={() => query.refetch()}>
                  Try again
                </Button>
              }
            />
          ) : query.data ? (
            <DailyMatrix report={query.data} />
          ) : null}
        </div>
      </section>

      {query.data ? (
        <>
          <div className="op-grid3 an">
            <CampPanel key={date} date={date} camp={query.data.camp} canWrite={canWrite} />
            <VehiclePanel vehicles={query.data.vehicles} canWrite={canWrite} />
            <ExpectedArrivalsPanel
              date={date}
              arrivals={query.data.expectedArrivals}
              canWrite={canWrite}
            />
          </div>
          <NotePanel key={`note-${date}`} date={date} camp={query.data.camp} canWrite={canWrite} />
        </>
      ) : null}
    </>
  );
}

/** Vacant is computed by the API and rendered read-only — never an input. */
function CampPanel({
  date,
  camp,
  canWrite,
}: {
  date: string;
  camp: DailyLog | null;
  canWrite: boolean;
}) {
  const save = useSaveDailyLog(date);
  // Initialised from the log this panel was mounted with. The parent keys it
  // by date, so changing date remounts rather than syncing in an effect.
  const [form, setForm] = useState({
    foodReceived: camp?.foodReceived?.toString() ?? '',
    rooms: camp?.rooms?.toString() ?? '',
    capacity: camp?.capacity?.toString() ?? '',
    occupancy: camp?.occupancy?.toString() ?? '',
  });

  const num = (value: string) => (value === '' ? null : Number(value));

  const commit = () =>
    save.mutate({
      foodReceived: num(form.foodReceived),
      rooms: num(form.rooms),
      capacity: num(form.capacity),
      occupancy: num(form.occupancy),
      // `note` belongs to NotePanel now. Sending it from here would overwrite
      // whatever is in it with this panel's stale copy.
    });

  const vacant =
    form.capacity !== '' && form.occupancy !== ''
      ? Number(form.capacity) - Number(form.occupancy)
      : null;

  /** Label left, a narrow mono number right — one row each, per the mockup. */
  const row = (key: 'foodReceived' | 'rooms' | 'capacity' | 'occupancy', label: string) => (
    <div className="op-kv">
      <label className="k" htmlFor={`op-camp-${key}`}>
        {label}
      </label>
      <input
        id={`op-camp-${key}`}
        type="number"
        min={0}
        value={form[key]}
        disabled={!canWrite || save.isPending}
        onChange={(event) => setForm((f) => ({ ...f, [key]: event.target.value }))}
        onBlur={commit}
      />
    </div>
  );

  return (
    <section className="panel">
      <header className="ef-phead">
        <div>
          <h2>Camp</h2>
          <p className="note">Saves as you leave each field.</p>
        </div>
      </header>

      <div className="ef-pbody">
        {row('foodReceived', 'Food received')}
        {row('rooms', 'Rooms')}
        {row('capacity', 'Capacity')}
        {row('occupancy', 'Occupancy')}

        {/* Vacant is derived from capacity and occupancy — never typed in. */}
        <div className="op-kv">
          <span className="k">Vacant</span>
          <span className="ro">{vacant === null ? EM_DASH : vacant}</span>
        </div>

        <SavedLine at={camp?.updatedAt} className="op-saved--camp" />
      </div>
    </section>
  );
}

function VehiclePanel({
  vehicles,
  canWrite,
}: {
  vehicles: { id: string; model: string; plateNo: string; assignment: string | null }[];
  canWrite: boolean;
}) {
  const create = useCreateVehicle();
  const remove = useDeleteVehicle();
  const [draft, setDraft] = useState({ model: '', plateNo: '', assignment: '' });
  const [adding, setAdding] = useState(false);

  const add = () => {
    create.mutate(
      {
        model: draft.model.trim(),
        plateNo: draft.plateNo.trim(),
        assignment: draft.assignment.trim() || undefined,
      },
      {
        onSuccess: () => {
          setDraft({ model: '', plateNo: '', assignment: '' });
          setAdding(false);
        },
      },
    );
  };

  return (
    <section className="panel">
      <header className="ef-phead">
        <div>
          <h2>Vehicles</h2>
          <p className="note">Moves to the Transport module when that is built.</p>
        </div>
      </header>

      <div className="ef-pbody">
        <table className="op-mini">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Plate</th>
              <th>Assignment</th>
              {canWrite ? <th aria-label="Actions" /> : null}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td>{vehicle.model}</td>
                <td className="mono">{vehicle.plateNo}</td>
                <td>{vehicle.assignment ?? EM_DASH}</td>
                {canWrite ? (
                  <td>
                    <button
                      type="button"
                      className="op-del"
                      aria-label={`Remove ${vehicle.model}`}
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(vehicle.id)}
                    >
                      ×
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}

            {/* The draft row appears only once "Add vehicle" is pressed, so the
                panel rests as a plain list the way the report does. */}
            {canWrite && adding ? (
              <tr>
                <td>
                  <input
                    autoFocus
                    aria-label="Vehicle"
                    placeholder="Hiace"
                    value={draft.model}
                    onChange={(event) => setDraft((d) => ({ ...d, model: event.target.value }))}
                  />
                </td>
                <td>
                  <input
                    aria-label="Plate number"
                    placeholder="50/70229"
                    value={draft.plateNo}
                    onChange={(event) => setDraft((d) => ({ ...d, plateNo: event.target.value }))}
                  />
                </td>
                <td>
                  <input
                    aria-label="Assignment"
                    placeholder="Camp, office"
                    value={draft.assignment}
                    onChange={(event) =>
                      setDraft((d) => ({ ...d, assignment: event.target.value }))
                    }
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="op-del"
                    aria-label="Discard this row"
                    onClick={() => {
                      setAdding(false);
                      setDraft({ model: '', plateNo: '', assignment: '' });
                    }}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {canWrite ? (
          adding ? (
            <Button
              variant="ghost"
              disabled={!draft.model.trim() || !draft.plateNo.trim() || create.isPending}
              onClick={add}
            >
              {create.isPending ? 'Saving…' : 'Save vehicle'}
            </Button>
          ) : (
            <button type="button" className="op-addrow" onClick={() => setAdding(true)}>
              <PlusIcon size={15} />
              Add vehicle
            </button>
          )
        ) : null}
      </div>
    </section>
  );
}

/** Typed in, because the sheet expects people who are not in the system yet. */
function ExpectedArrivalsPanel({
  date,
  arrivals,
  canWrite,
}: {
  date: string;
  arrivals: { id: string; tradeId: string; count: number; trade: { name: string } }[];
  canWrite: boolean;
}) {
  const save = useSaveExpectedArrival();
  const { data: trades } = useTrades('SITE');
  const [tradeId, setTradeId] = useState('');
  const [count, setCount] = useState('');
  const [adding, setAdding] = useState(false);

  const add = () => {
    save.mutate(
      { date, tradeId, count: Number(count) },
      {
        onSuccess: () => {
          setTradeId('');
          setCount('');
          setAdding(false);
        },
      },
    );
  };

  return (
    <section className="panel">
      <header className="ef-phead">
        <div>
          <h2>Expected arrivals</h2>
          <p className="note">People due on this date who are not in the master list yet.</p>
        </div>
      </header>

      <div className="ef-pbody">
        {/* The mockup carries a Date column, because its list runs across the
            coming week. The report returns arrivals for its own date only, so
            a Date column here would repeat one value down every row. */}
        <table className="op-mini">
          <thead>
            <tr>
              <th>Trade</th>
              <th className="num">Count</th>
              {canWrite ? <th aria-label="Actions" /> : null}
            </tr>
          </thead>
          <tbody>
            {arrivals.map((arrival) => (
              <tr key={arrival.id}>
                <td>{arrival.trade.name}</td>
                <td className="num">{arrival.count}</td>
                {canWrite ? (
                  <td>
                    <button
                      type="button"
                      className="op-del"
                      aria-label={`Remove ${arrival.trade.name}`}
                      disabled={save.isPending}
                      onClick={() => save.mutate({ date, tradeId: arrival.tradeId, count: 0 })}
                    >
                      ×
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}

            {canWrite && adding ? (
              <tr>
                <td>
                  <select
                    autoFocus
                    aria-label="Trade"
                    value={tradeId}
                    onChange={(event) => setTradeId(event.target.value)}
                  >
                    <option value="">Select a trade…</option>
                    {trades?.map((trade) => (
                      <option key={trade.id} value={trade.id}>
                        {trade.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    aria-label="How many"
                    type="number"
                    min={1}
                    placeholder="0"
                    value={count}
                    onChange={(event) => setCount(event.target.value)}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="op-del"
                    aria-label="Discard this row"
                    onClick={() => {
                      setAdding(false);
                      setTradeId('');
                      setCount('');
                    }}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {arrivals.length === 0 && !adding ? (
          <p className="op-note-inline">None recorded for {formatDate(date)}.</p>
        ) : null}

        {canWrite ? (
          adding ? (
            <Button variant="ghost" disabled={!tradeId || !count || save.isPending} onClick={add}>
              {save.isPending ? 'Saving…' : 'Save arrival'}
            </Button>
          ) : (
            <button type="button" className="op-addrow" onClick={() => setAdding(true)}>
              <PlusIcon size={15} />
              Add expected arrival
            </button>
          )
        ) : null}
      </div>
    </section>
  );
}

/**
 * "Saved 09:42" under a panel that autosaves.
 *
 * The mockup reads "Saved 09:42 by Shankar Rana", but `DailyLog` carries only
 * `updatedAt` — there is no `updatedBy` on the API, so the name is left off
 * rather than invented.
 */
function SavedLine({ at, className }: { at?: string | undefined; className?: string }) {
  if (!at) return null;

  const time = new Date(at);
  if (Number.isNaN(time.getTime())) return null;

  return (
    <p className={`op-saved ${className ?? ''}`.trim()}>
      <i className="dot" />
      Saved{' '}
      {new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(time)}
    </p>
  );
}

/**
 * The report's closing note — a full-width panel under the three columns, as
 * in the mockup. It is part of the same daily log as the camp figures, so it
 * saves through the same endpoint.
 */
function NotePanel({
  date,
  camp,
  canWrite,
}: {
  date: string;
  camp: DailyLog | null;
  canWrite: boolean;
}) {
  const save = useSaveDailyLog(date);
  const [note, setNote] = useState(camp?.note ?? '');

  return (
    <section className="panel op-note-panel an">
      <header className="ef-phead">
        <div>
          <h2>Note</h2>
          <p className="note">Appears at the foot of the report</p>
        </div>
        <SavedLine at={camp?.updatedAt} />
      </header>
      <div className="ef-pbody">
        <textarea
          className="op-notefield"
          aria-label="Report note"
          value={note}
          disabled={!canWrite || save.isPending}
          placeholder="Anything the report should say at the foot."
          onChange={(event) => setNote(event.target.value)}
          onBlur={() => save.mutate({ note: note.trim() || null })}
        />
      </div>
    </section>
  );
}
