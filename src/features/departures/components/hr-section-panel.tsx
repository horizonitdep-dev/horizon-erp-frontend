'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fieldErrors } from '@/core/api/unwrap';
import { ACCESS } from '@/core/config/access';
import { EM_DASH, formatDate } from '@/lib/format';
import { useCanAccess } from '@/features/auth/components/access-gate';
import { EfChoice, EfInput } from '@/features/employees/components/employee-form-fields';
import { useSaveHrSection } from '../hooks/use-departures';
import {
  hrSectionSchema,
  toHrPayload,
  toHrValues,
  type HrSectionValues,
} from '../schemas/departure.schema';
import { REASON_LABELS, REASONS_FOR_LEAVING, type Departure } from '../types';
import { PanelFoot, YES_NO, YES_NO_LABELS } from './panel-parts';

/**
 * Panel 1 — "To be completed by Employee / HR". Rows follow the paper form top
 * to bottom, left to right.
 *
 * The employee's own details sit at the top as read-only rows, not disabled
 * inputs: they are not editable here, and a disabled input invites people to
 * try. They belong to the employee record and are read through the relation.
 */
export function HrSectionPanel({ departure, frozen }: { departure: Departure; frozen: boolean }) {
  const canEdit = useCanAccess(ACCESS.departureHrSection) && !frozen;
  const save = useSaveHrSection(departure.id);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<HrSectionValues>({
    resolver: zodResolver(hrSectionSchema),
    defaultValues: toHrValues(departure),
  });

  const [departureDate, mustLeaveBy, airTicketIssued] = useWatch({
    control,
    name: ['departureDate', 'mustLeaveBy', 'airTicketIssued'],
  });

  // A flight after the leave-by date is recorded, not blocked — a late booking
  // is a real situation HR needs on file.
  const lateFlight = !!departureDate && !!mustLeaveBy && departureDate > mustLeaveBy;

  const onSubmit = handleSubmit((values) => {
    save.mutate(toHrPayload(values), {
      onSuccess: (saved) => reset(toHrValues(saved)),
      onError: (error) => {
        for (const e of fieldErrors(error)) {
          if (e.field && e.field in values) {
            setError(e.field as keyof HrSectionValues, { message: e.message });
          }
        }
      },
    });
  });

  const { employee } = departure;

  return (
    <section className="panel an" aria-labelledby="dp-part1">
      <header className="ef-phead">
        <span className="ef-pnum">Part 1</span>
        <div>
          <h2 id="dp-part1">Employee / HR</h2>
          <p className="note">To be completed by the employee and HR.</p>
        </div>
      </header>

      <div className="ef-pbody">
        <dl className="dp-ro">
          <ReadOnly label="Employee ID" value={employee.employeeCode} mono />
          <ReadOnly label="Employee's name" value={employee.name} />
          <ReadOnly label="Date of joining" value={formatDate(employee.joiningDate)} />
          <ReadOnly label="Designation" value={employee.trade?.name ?? null} />
          <ReadOnly label="Emirates ID No" value={employee.emiratesIdNumber} mono />
          <ReadOnly label="Visa expiry date" value={formatDate(employee.visaExpiryDate)} />
        </dl>
        <p className="dp-note">From the employee record — edit it there.</p>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <fieldset className="dp-fieldset" disabled={!canEdit || save.isPending}>
          <div className="ef-pbody">
            <div className="ef-grid">
              <EfInput label="Site / project" error={errors.siteProject} {...register('siteProject')} />
              <EfInput label="Location" error={errors.location} {...register('location')} />

              <EfInput
                label="Visa cancel date"
                type="date"
                error={errors.visaCancelDate}
                {...register('visaCancelDate')}
              />
              <EfInput
                label="Must leave the country or change status by"
                type="date"
                error={errors.mustLeaveBy}
                {...register('mustLeaveBy')}
              />

              <EfInput label="UAE contact no" error={errors.uaeContactNo} {...register('uaeContactNo')} />
              <EfInput
                label="Home country contact no"
                error={errors.homeContactNo}
                {...register('homeContactNo')}
              />

              <EfInput
                className="ef-span"
                label="Email ID"
                type="email"
                error={errors.emailId}
                {...register('emailId')}
              />

              <EfChoice
                className="ef-span"
                label="Reason for leaving"
                options={REASONS_FOR_LEAVING}
                labels={REASON_LABELS}
                error={errors.reason}
                {...register('reason')}
              />

              <EfChoice
                label="Passport received"
                options={YES_NO}
                labels={YES_NO_LABELS}
                error={errors.passportReceived}
                {...register('passportReceived')}
              />
              <EfChoice
                label="Air ticket purchased / issued"
                options={YES_NO}
                labels={YES_NO_LABELS}
                error={errors.airTicketIssued}
                {...register('airTicketIssued')}
              />

              <EfInput
                label="Airlines number"
                className="mono-field"
                placeholder="IX178"
                required={airTicketIssued === 'YES'}
                error={errors.flightNumber}
                {...register('flightNumber')}
              />
              <EfInput
                label="Airlines name"
                placeholder="AIR INDIA EXPRESS"
                required={airTicketIssued === 'YES'}
                error={errors.airlineName}
                {...register('airlineName')}
              />

              <EfInput
                label="Departure date"
                type="date"
                error={errors.departureDate}
                hint={
                  lateFlight ? (
                    <span className="dp-warn-inline">
                      After the leave-by date. This will save, and the record will show a warning.
                    </span>
                  ) : undefined
                }
                {...register('departureDate')}
              />
              <EfInput
                label="Departure time"
                type="time"
                error={errors.departureTime}
                {...register('departureTime')}
              />

              <EfInput
                label="Departure airport"
                placeholder="ABU DHABI"
                error={errors.departureAirport}
                {...register('departureAirport')}
              />
              <EfInput
                label="Destination airport"
                placeholder="DELHI"
                error={errors.destinationAirport}
                {...register('destinationAirport')}
              />

              <EfInput
                label="Employee signed on"
                type="date"
                optionalNote="date beside the signature"
                hint="The signature itself is on the paper form, which stays in HR's file."
                error={errors.employeeSignedDate}
                {...register('employeeSignedDate')}
              />
            </div>
          </div>
        </fieldset>

        <PanelFoot
          canEdit={canEdit}
          frozen={frozen}
          isDirty={isDirty}
          isPending={save.isPending}
          saveLabel="Save HR section"
          viewOnlyReason="HR & Admin officers and above, and executives, can edit this section."
        />
      </form>
    </section>
  );
}

function ReadOnly({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="dp-ro-row">
      <dt>{label}</dt>
      <dd className={mono ? 'mono' : undefined}>{value || EM_DASH}</dd>
    </div>
  );
}
