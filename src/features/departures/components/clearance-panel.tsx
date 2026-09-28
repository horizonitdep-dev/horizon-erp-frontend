'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fieldErrors } from '@/core/api/unwrap';
import { ACCESS } from '@/core/config/access';
import { Button } from '@/components/ui/button';
import { AlertIcon, CheckIcon } from '@/components/ui/icons';
import { formatDate } from '@/lib/format';
import { useCanAccess } from '@/features/auth/components/access-gate';
import { useSession } from '@/features/auth/hooks/use-session';
import { EfChoice, EfInput, EfTextarea } from '@/features/employees/components/employee-form-fields';
import {
  useApproveClearance,
  useRejectClearance,
  useSaveClearance,
  useSubmitClearance,
} from '../hooks/use-departures';
import {
  clearanceSchema,
  toClearancePayload,
  toClearanceValues,
  type ClearanceValues,
} from '../schemas/departure.schema';
import { CLEARANCE_EDITABLE_STAGES, type Departure } from '../types';
import { YES_NO, YES_NO_LABELS } from './panel-parts';

/**
 * Reproduced verbatim from the Employee Departure Form. It is a legal
 * statement the driver signs, not a caption — do not reword it.
 */
export const DRIVER_ACKNOWLEDGEMENT =
  'This is to acknowledge that I personally accompanied the below employee to the airport on his departure date and ensured that he completed all necessary airport procedures, including securing his boarding pass.';

/** Plain-English names for the fields a submit needs, for the "still missing" line. */
const FIELD_LABELS: Record<string, string> = {
  immigrationCleared: 'immigration cleared',
  immigrationClearedDate: 'immigration date',
  immigrationClearedTime: 'immigration time',
  securityCleared: 'security check cleared',
  securityClearedDate: 'security date',
  securityClearedTime: 'security time',
  driverName: 'driver name',
  driverSignedDate: 'driver signed date',
};

/**
 * Panel 2 — "To be completed by Drop off Driver / Operations Staff".
 *
 * A TRANSCRIPTION screen, not a live checklist. The driver fills the paper form
 * by hand at the airport; this is typed in afterwards, at a desk. Every date and
 * time is what the driver wrote, which is why each date sits beside its time the
 * way it does on the page — the person typing reads left to right off paper.
 *
 * Maker/checker: Operations staff below the Operations Manager transcribe and
 * submit; the Operations Manager approves or sends it back. His approval is the
 * paper form's Reporting Manager row, so that row is not a field here.
 */
export function ClearancePanel({ departure }: { departure: Departure }) {
  const save = useSaveClearance(departure.id);
  const submit = useSubmitClearance(departure.id);

  const canWrite = useCanAccess(ACCESS.departureClearanceWrite);
  const openForEditing = CLEARANCE_EDITABLE_STAGES.includes(departure.stage);
  const canEdit = canWrite && openForEditing;

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

  const onSave = handleSubmit((values) => {
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

  const missing = departure.clearanceMissingFields
    .map((field) => FIELD_LABELS[field] ?? field)
    .join(', ');

  return (
    <section className="panel an" aria-labelledby="dp-part2">
      <header className="ef-phead">
        <span className="ef-pnum">Part 2</span>
        <div>
          <h2 id="dp-part2">Airport clearance</h2>
          <p className="note">
            Entered from the signed paper form by Operations. Dates and times are as the driver wrote
            them.
          </p>
        </div>
        <ClearanceStatus departure={departure} />
      </header>

      {departure.stage === 'DRAFT' ? (
        <div className="ef-pbody">
          <p className="dp-lock">
            Locked until Part 1 is saved with a reason for leaving, a visa cancel date and a departure
            date. The driver fills this section on paper at the airport; Operations transcribe it here
            afterwards.
          </p>
        </div>
      ) : (
        <>
          {departure.clearanceRejectionNote ? (
            <div className="ef-pbody">
              <p className="dp-sentback" role="status">
                <AlertIcon size={15} />
                <span>
                  <b>Sent back by {departure.clearanceRejectedBy?.fullName ?? 'the Operations Manager'}</b>
                  {departure.clearanceRejectedAt
                    ? ` on ${formatDate(departure.clearanceRejectedAt)}`
                    : ''}
                  : {departure.clearanceRejectionNote}
                </span>
              </p>
            </div>
          ) : null}

          <form onSubmit={onSave} noValidate>
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
                    optionalNote="if parked"
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
                  <EfInput
                    label="Driver name"
                    error={errors.driverName}
                    {...register('driverName')}
                  />
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
                  <EfTextarea
                    className="ef-span"
                    label="Remarks"
                    optionalNote="optional"
                    error={errors.remarks}
                    {...register('remarks')}
                  />
                </div>
              </div>
            </fieldset>

            <div className="dp-foot">
              {canEdit ? (
                <>
                  <span className="status">
                    <i className={`dot dot--${isDirty ? 'warn' : 'good'}`} />
                    {isDirty
                      ? 'Unsaved changes'
                      : missing
                        ? `Still needed: ${missing}`
                        : 'Saved and ready to submit'}
                  </span>
                  <div className="dp-foot-actions">
                    <Button type="submit" variant="ghost" disabled={!isDirty || save.isPending}>
                      {save.isPending ? 'Saving…' : 'Save draft'}
                    </Button>
                    <Button
                      type="button"
                      disabled={isDirty || !departure.clearanceComplete || submit.isPending}
                      title={
                        isDirty
                          ? 'Save your changes before submitting'
                          : missing
                            ? `Still needed: ${missing}`
                            : undefined
                      }
                      onClick={() => submit.mutate()}
                    >
                      {submit.isPending ? 'Submitting…' : 'Submit for approval'}
                    </Button>
                  </div>
                </>
              ) : (
                <span className="dp-foot-note">
                  {openForEditing
                    ? 'View only. Operations staff below the Operations Manager transcribe this section.'
                    : 'View only. This section is with the Operations Manager.'}
                </span>
              )}
            </div>
          </form>

          <ReviewBar departure={departure} />
        </>
      )}
    </section>
  );
}

/** Who submitted or reviewed, in the panel header. */
function ClearanceStatus({ departure }: { departure: Departure }) {
  if (departure.clearanceApprovedAt) {
    return (
      <p className="dp-recorded">
        Approved by <b>{departure.clearanceApprovedBy?.fullName ?? 'the Operations Manager'}</b> on{' '}
        {formatDate(departure.clearanceApprovedAt)}
      </p>
    );
  }

  if (departure.clearanceSubmittedAt) {
    return (
      <p className="dp-recorded">
        Submitted by <b>{departure.clearanceSubmittedBy?.fullName ?? 'unknown user'}</b> on{' '}
        {formatDate(departure.clearanceSubmittedAt)}
      </p>
    );
  }

  return null;
}

/**
 * The Operations Manager's decision — the form's Reporting Manager row. Shown
 * only once a submission is waiting, and never to the person who submitted it.
 */
function ReviewBar({ departure }: { departure: Departure }) {
  const { user } = useSession();
  const canReview = useCanAccess(ACCESS.departureClearanceReview);
  const approve = useApproveClearance(departure.id);
  const reject = useRejectClearance(departure.id);
  const [note, setNote] = useState('');
  const [rejecting, setRejecting] = useState(false);

  if (departure.stage !== 'CLEARANCE_SUBMITTED') return null;

  const isSubmitter = !!user && departure.clearanceSubmittedBy?.id === user.id;

  if (!canReview || isSubmitter) {
    return (
      <div className="dp-review">
        <p className="dp-foot-note">
          {isSubmitter
            ? 'You submitted this section, so someone else signs it off.'
            : 'Waiting for the Operations Manager to approve this section.'}
        </p>
      </div>
    );
  }

  const busy = approve.isPending || reject.isPending;

  return (
    <div className="dp-review">
      <div className="dp-review-head">
        <h3>Operations Manager sign-off</h3>
        <p>
          The form&rsquo;s Reporting Manager row. Approving passes the record to the HR Manager and
          the Managing Director.
        </p>
      </div>

      {rejecting ? (
        <div className="dp-review-reject">
          <label htmlFor="dp-reject-note">What needs correcting?</label>
          <textarea
            id="dp-reject-note"
            value={note}
            rows={3}
            placeholder="Security check time does not match the signed form."
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="dp-foot-actions">
            <Button variant="ghost" disabled={busy} onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button
              disabled={!note.trim() || busy}
              onClick={() =>
                reject.mutate(note.trim(), {
                  onSuccess: () => {
                    setNote('');
                    setRejecting(false);
                  },
                })
              }
            >
              {reject.isPending ? 'Sending back…' : 'Send back'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="dp-foot-actions">
          <Button variant="ghost" disabled={busy} onClick={() => setRejecting(true)}>
            Send back
          </Button>
          <Button disabled={busy} onClick={() => approve.mutate()}>
            <CheckIcon size={15} />
            {approve.isPending ? 'Approving…' : 'Approve clearance'}
          </Button>
        </div>
      )}
    </div>
  );
}
