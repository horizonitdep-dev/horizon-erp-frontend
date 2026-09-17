'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fieldErrors } from '@/core/api/unwrap';
import type { UserRole } from '@/core/config/roles';
import { formatDate } from '@/lib/format';
import { useHasRole } from '@/features/auth/components/role-gate';
import { EfChoice, EfInput, EfTextarea } from '@/features/employees/components/employee-form-fields';
import { useSaveClearance } from '../hooks/use-departures';
import {
  clearanceSchema,
  toClearancePayload,
  toClearanceValues,
  type ClearanceValues,
} from '../schemas/departure.schema';
import type { Departure } from '../types';
import { PanelFoot, YES_NO, YES_NO_LABELS } from './panel-parts';

export const CLEARANCE_ROLES: readonly UserRole[] = ['OPERATIONS', 'HR', 'CHAIRMAN', 'MD'];

/**
 * Reproduced verbatim from the Employee Departure Form. It is a legal
 * statement the driver signs, not a caption — do not reword it.
 */
export const DRIVER_ACKNOWLEDGEMENT =
  'This is to acknowledge that I personally accompanied the below employee to the airport on his departure date and ensured that he completed all necessary airport procedures, including securing his boarding pass.';

/**
 * Panel 2 — "To be completed by Drop off Driver / Operations Staff".
 *
 * A TRANSCRIPTION screen, not a live checklist. The driver fills the paper form
 * by hand at the airport; this is typed in afterwards, at a desk. Every date and
 * time is what the driver wrote, which is why each date sits beside its time the
 * way it does on the page — the person typing reads left to right off paper.
 *
 * Who typed it and when is shown in the header, and is a different fact from
 * who signed.
 */
export function ClearancePanel({ departure, frozen }: { departure: Departure; frozen: boolean }) {
  const canEdit = useHasRole(CLEARANCE_ROLES) && !frozen;
  const save = useSaveClearance(departure.id);
  const locked = !departure.hrSectionComplete;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ClearanceValues>({
    resolver: zodResolver(clearanceSchema),
    defaultValues: toClearanceValues(departure),
  });

  const onSubmit = handleSubmit((values) => {
    save.mutate(toClearancePayload(values), {
      onSuccess: (saved) => reset(toClearanceValues(saved)),
      onError: (error) => {
        for (const e of fieldErrors(error)) {
          if (e.field && e.field in values) {
            setError(e.field as keyof ClearanceValues, { message: e.message });
          }
        }
      },
    });
  });

  return (
    <section className="panel an" aria-labelledby="dp-part2" data-locked={locked || undefined}>
      <header className="ef-phead">
        <span className="ef-pnum">Part 2</span>
        <div>
          <h2 id="dp-part2">Airport clearance</h2>
          <p className="note">
            Entered from the signed paper form. Dates and times are as the driver wrote them.
          </p>
        </div>
        {departure.clearanceRecordedAt ? (
          <p className="dp-recorded">
            Recorded by <b>{departure.clearanceRecordedBy?.fullName ?? 'unknown user'}</b> on{' '}
            {formatDate(departure.clearanceRecordedAt)}
          </p>
        ) : null}
      </header>

      {locked ? (
        <div className="ef-pbody">
          <p className="dp-lock">
            Locked until Part 1 is saved with a reason for leaving, a visa cancel date and a departure
            date. The driver fills this section on paper at the airport; it is transcribed here
            afterwards.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <fieldset className="dp-fieldset" disabled={!canEdit || save.isPending}>
            <div className="ef-pbody">
              <div className="ef-grid-3">
                <EfChoice
                  label="Immigration cleared"
                  options={YES_NO}
                  labels={YES_NO_LABELS}
                  error={errors.immigrationCleared}
                  {...register('immigrationCleared')}
                />
                <EfInput
                  label="Date"
                  type="date"
                  error={errors.immigrationClearedDate}
                  {...register('immigrationClearedDate')}
                />
                <EfInput
                  label="Time"
                  type="time"
                  error={errors.immigrationClearedTime}
                  {...register('immigrationClearedTime')}
                />

                <EfChoice
                  label="Security check cleared"
                  options={YES_NO}
                  labels={YES_NO_LABELS}
                  error={errors.securityCleared}
                  {...register('securityCleared')}
                />
                <EfInput
                  label="Date"
                  type="date"
                  error={errors.securityClearedDate}
                  {...register('securityClearedDate')}
                />
                <EfInput
                  label="Time"
                  type="time"
                  error={errors.securityClearedTime}
                  {...register('securityClearedTime')}
                />

                <EfInput
                  label="Airport parking ticket number"
                  className="mono-field"
                  error={errors.parkingTicketNo}
                  {...register('parkingTicketNo')}
                />
                <EfInput
                  label="Time in"
                  type="time"
                  error={errors.parkingTimeIn}
                  {...register('parkingTimeIn')}
                />
                <EfInput
                  label="Time out"
                  type="time"
                  error={errors.parkingTimeOut}
                  {...register('parkingTimeOut')}
                />
              </div>
            </div>

            <div className="ef-pbody">
              <blockquote className="dp-ack">{DRIVER_ACKNOWLEDGEMENT}</blockquote>

              <div className="ef-grid-3">
                <EfInput label="Driver name" error={errors.driverName} {...register('driverName')} />
                <EfInput
                  label="Date"
                  type="date"
                  optionalNote="beside the signature"
                  error={errors.driverSignedDate}
                  {...register('driverSignedDate')}
                />
                <EfInput
                  label="Time"
                  type="time"
                  error={errors.driverSignedTime}
                  {...register('driverSignedTime')}
                />
              </div>

              <div className="ef-grid dp-gap-top">
                <EfInput
                  label="Reporting manager name"
                  error={errors.reportingManagerName}
                  {...register('reportingManagerName')}
                />
                <EfChoice
                  label="Reporting manager signed"
                  options={YES_NO}
                  labels={YES_NO_LABELS}
                  error={errors.reportingManagerSigned}
                  {...register('reportingManagerSigned')}
                />
                <EfTextarea
                  className="ef-span"
                  label="Remarks"
                  error={errors.remarks}
                  {...register('remarks')}
                />
              </div>
            </div>
          </fieldset>

          <PanelFoot
            canEdit={canEdit}
            frozen={frozen}
            isDirty={isDirty}
            isPending={save.isPending}
            saveLabel="Save clearance"
            viewOnlyReason="Operations staff, HR, the Managing Director and the Chairman can transcribe clearance."
          />
        </form>
      )}
    </section>
  );
}
