'use client';

import { useState } from 'react';
import {
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { apiMessage } from '@/core/api/unwrap';
import { Button } from '@/components/ui/button';
import { AlertIcon, PlusIcon } from '@/components/ui/icons';
import { EM_DASH, formatDate } from '@/lib/format';
import { useAddDocument } from '../hooks/use-employee-mutations';
import { documentLabel, historyOfKind, isEmployedVisa, visaLabel } from '../lib/documents';
import {
  HR_DOCUMENT_KINDS,
  VISA_TYPES,
  type DocumentKind,
  type Employee,
  type VisaType,
} from '../types';
// Inferred from the zod schema, so it lives with the schema — importing it
// from types.ts would make types and schema import each other.
import type { EmployeeFormValues } from '../schemas/employee.schema';
import { EfInput, EfSelect } from './employee-form-fields';

/**
 * Visa, Emirates ID and passport — dated documents rather than fourteen columns,
 * because an employment visa is renewed every two years and the flat columns
 * meant a renewal overwrote the one it replaced.
 *
 * Two modes, deliberately different:
 *   NEW      → a field array, so HR enters what they have
 *   EXISTING → read-only, with renewals as their own action
 *
 * Editing a document in place would rewrite history. Renewing adds a row and
 * closes the one before it, which is what actually happened.
 */

/** A new record starts with the two the paper form asks for. */
export const BLANK_DOCUMENTS: EmployeeFormValues['documents'] = [
  { kind: 'VISA', visaType: 'EMPLOYMENT', number: '', issuedAt: '', expiresAt: '' },
  { kind: 'PASSPORT', number: '', issuingCountry: '', issuedAt: '', expiresAt: '' },
];

export function DocumentsFieldArray({
  control,
  register,
  errors,
}: {
  control: Control<EmployeeFormValues>;
  register: UseFormRegister<EmployeeFormValues>;
  errors: FieldErrors<EmployeeFormValues>;
}) {
  const documents = useFieldArray({ control, name: 'documents' });
  const values = useWatch({ control, name: 'documents' });

  /**
   * An employment or transferable visa means he is an employee, and an employee
   * must have an Emirates ID. A visit-visa candidate has none for weeks, which
   * is the whole reason HR can enter him at all — so this warns rather than blocks.
   */
  const visa = values?.find((d) => d?.kind === 'VISA');
  const needsEmiratesId =
    isEmployedVisa(visa?.visaType) && !values?.some((d) => d?.kind === 'EMIRATES_ID');

  return (
    <>
      <div className="ef-docs">
        {documents.fields.map((field, index) => {
          const kind = values?.[index]?.kind ?? 'VISA';
          const rowErrors = errors.documents?.[index];

          return (
            <fieldset key={field.id} className="ef-doc">
              <legend>{documentLabel(kind)}</legend>

              <div className="ef-grid">
                <EfSelect
                  label="Document"
                  required
                  error={rowErrors?.kind}
                  {...register(`documents.${index}.kind`)}
                >
                  {HR_DOCUMENT_KINDS.map((option) => (
                    <option key={option} value={option}>
                      {documentLabel(option)}
                    </option>
                  ))}
                </EfSelect>

                {kind === 'VISA' ? (
                  <EfSelect
                    label="Type of visa"
                    required
                    error={rowErrors?.visaType}
                    {...register(`documents.${index}.visaType`)}
                  >
                    {VISA_TYPES.map((option) => (
                      <option key={option} value={option}>
                        {visaLabel(option)}
                      </option>
                    ))}
                  </EfSelect>
                ) : (
                  <EfInput
                    label={kind === 'EMIRATES_ID' ? 'Emirates I.D. number' : 'Passport number'}
                    required
                    className="mono-field"
                    error={rowErrors?.number}
                    {...register(`documents.${index}.number`)}
                  />
                )}

                {values?.[index]?.visaType === 'OTHER' ? (
                  <EfInput
                    label="Describe the visa"
                    required
                    error={rowErrors?.visaTypeOther}
                    {...register(`documents.${index}.visaTypeOther`)}
                  />
                ) : null}

                {kind === 'PASSPORT' ? (
                  <EfInput
                    label="Issuing country"
                    required
                    error={rowErrors?.issuingCountry}
                    {...register(`documents.${index}.issuingCountry`)}
                  />
                ) : null}

                <EfInput
                  label="Issued on"
                  required
                  type="date"
                  error={rowErrors?.issuedAt}
                  {...register(`documents.${index}.issuedAt`)}
                />
                <EfInput
                  label="Expires on"
                  required
                  type="date"
                  error={rowErrors?.expiresAt}
                  {...register(`documents.${index}.expiresAt`)}
                />
              </div>

              {documents.fields.length > 1 ? (
                <button
                  type="button"
                  className="ef-doc-remove"
                  onClick={() => documents.remove(index)}
                >
                  Remove
                </button>
              ) : null}
            </fieldset>
          );
        })}
      </div>

      {needsEmiratesId ? (
        <p className="ef-doc-warn" role="status">
          <AlertIcon size={15} />
          <span>
            An employment visa normally comes with an Emirates ID. Add one now, or record it when
            it arrives.
          </span>
        </p>
      ) : null}

      <div className="ef-doc-actions">
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            documents.append({
              kind: 'EMIRATES_ID',
              number: '',
              issuedAt: '',
              expiresAt: '',
            })
          }
        >
          <PlusIcon size={14} />
          Add a document
        </Button>
      </div>
    </>
  );
}

/**
 * An existing record: what he holds, and what it replaced.
 *
 * Nothing is editable. A visa is not corrected in place — it is renewed, which
 * is `POST /hr/employees/:id/documents` and adds a row.
 */
export function DocumentsPanel({ employee }: { employee: Employee }) {
  const [renewing, setRenewing] = useState<{ kind: DocumentKind; first: boolean } | null>(null);

  const groups =
    employee.documentGroups ??
    HR_DOCUMENT_KINDS.map((kind) => ({
      kind,
      label: documentLabel(kind),
      current: employee.documents?.find((d) => d.kind === kind && !d.supersededAt) ?? null,
      history: historyOfKind(employee.documents, kind),
    })).filter((group) => group.current || group.history.length > 0);

  // A kind he has never held — typically the Emirates ID a visit-visa candidate
  // is entered without — is recorded from here once it arrives.
  const missing = HR_DOCUMENT_KINDS.filter((kind) => !groups.some((g) => g.kind === kind));

  return (
    <>
      <dl className="ef-doc-list">
        {groups.map((group) => (
          <div key={group.kind} className="ef-doc-row">
            <dt>{group.label}</dt>
            <dd>
              {group.current ? (
                <>
                  <b>
                    {group.current.number ??
                      (group.current.visaType ? visaLabel(group.current.visaType) : EM_DASH)}
                  </b>
                  <span className="ef-doc-dates">
                    {formatDate(group.current.issuedAt)} — {formatDate(group.current.expiresAt)}
                  </span>
                </>
              ) : (
                <span className="cell-muted">Nothing current — the last one has lapsed</span>
              )}

              {group.history.length > 0 ? (
                <details className="ef-doc-history">
                  <summary>
                    {group.history.length === 1
                      ? '1 earlier issue'
                      : `${group.history.length} earlier issues`}
                  </summary>
                  <ul>
                    {group.history.map((document) => (
                      <li key={document.id}>
                        <span className="mono">{document.number ?? EM_DASH}</span>
                        <span>
                          {formatDate(document.issuedAt)} — {formatDate(document.expiresAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}

              <button
                type="button"
                className="ef-doc-renew"
                onClick={() => setRenewing({ kind: group.kind, first: false })}
              >
                Record a renewal
              </button>
            </dd>
          </div>
        ))}
        {missing.map((kind) => (
          <div key={kind} className="ef-doc-row">
            <dt>{documentLabel(kind)}</dt>
            <dd>
              <span className="cell-muted">None on file</span>
              <button
                type="button"
                className="ef-doc-renew"
                onClick={() => setRenewing({ kind, first: true })}
              >
                Record one
              </button>
            </dd>
          </div>
        ))}
      </dl>

      <p className="ef-doc-note">
        Documents are not edited here. A renewal adds a new one and closes the one before it, so
        the history stays intact.
      </p>

      {renewing ? (
        <RenewalDialog
          employeeId={employee.id}
          kind={renewing.kind}
          first={renewing.first}
          onClose={() => setRenewing(null)}
        />
      ) : null}
    </>
  );
}

/** Mounted only while open, so every field starts blank rather than stale. */
function RenewalDialog({
  employeeId,
  kind,
  first,
  onClose,
}: {
  employeeId: string;
  kind: DocumentKind;
  /** Nothing of this kind on file yet, so there is nothing to renew. */
  first: boolean;
  onClose: () => void;
}) {
  const add = useAddDocument(employeeId);

  const [number, setNumber] = useState('');
  const [visaType, setVisaType] = useState<VisaType>('EMPLOYMENT');
  const [visaTypeOther, setVisaTypeOther] = useState('');
  const [issuingCountry, setIssuingCountry] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const needsNumber = kind !== 'VISA';
  const needsOther = kind === 'VISA' && visaType === 'OTHER';
  // Same rules the server enforces, so the button stays off rather than 400ing.
  const datesOrdered = !issuedAt || !expiresAt || expiresAt > issuedAt;
  const ready =
    issuedAt &&
    expiresAt &&
    datesOrdered &&
    (!needsNumber || number.trim()) &&
    (!needsOther || visaTypeOther.trim()) &&
    (kind !== 'PASSPORT' || issuingCountry.trim());

  return (
    <div className="op-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="op-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ef-renew-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="op-dialog-head">
          <h2 id="ef-renew-title">
            {first ? 'Record' : 'Renew'} the {documentLabel(kind).toLowerCase()}
          </h2>
          {first ? null : (
            <p className="note">
              The one on file is kept as history. Nothing is overwritten.
              {kind === 'EMIRATES_ID'
                ? ' An Emirates ID keeps its number across renewals — only the expiry moves.'
                : ''}
            </p>
          )}
        </header>

        <div className="op-dialog-body">
          {kind === 'VISA' ? (
            <label className="op-field" htmlFor="ef-renew-visa">
              <span className="op-label">Type of visa</span>
              <select
                id="ef-renew-visa"
                value={visaType}
                onChange={(event) => setVisaType(event.target.value as VisaType)}
              >
                {VISA_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {visaLabel(option)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="op-field" htmlFor="ef-renew-number">
              <span className="op-label">
                {kind === 'EMIRATES_ID' ? 'Emirates I.D. number' : 'Passport number'}
              </span>
              <input
                id="ef-renew-number"
                value={number}
                onChange={(event) => setNumber(event.target.value)}
              />
            </label>
          )}

          {needsOther ? (
            <label className="op-field" htmlFor="ef-renew-visa-other">
              <span className="op-label">Describe the visa</span>
              <input
                id="ef-renew-visa-other"
                value={visaTypeOther}
                onChange={(event) => setVisaTypeOther(event.target.value)}
              />
            </label>
          ) : null}

          {kind === 'PASSPORT' ? (
            <label className="op-field" htmlFor="ef-renew-country">
              <span className="op-label">Issuing country</span>
              <input
                id="ef-renew-country"
                value={issuingCountry}
                onChange={(event) => setIssuingCountry(event.target.value)}
              />
            </label>
          ) : null}

          <div className="op-field-row">
            <label className="op-field" htmlFor="ef-renew-issued">
              <span className="op-label">Issued on</span>
              <input
                id="ef-renew-issued"
                type="date"
                value={issuedAt}
                onChange={(event) => setIssuedAt(event.target.value)}
              />
            </label>

            <label className="op-field" htmlFor="ef-renew-expires">
              <span className="op-label">Expires on</span>
              <input
                id="ef-renew-expires"
                type="date"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
              />
            </label>
          </div>

          {!datesOrdered ? (
            <p className="op-error" role="alert">
              <AlertIcon size={15} />
              <span>Expiry must be after the issue date.</span>
            </p>
          ) : null}

          {add.isError ? (
            <p className="op-error" role="alert">
              <AlertIcon size={15} />
              <span>{apiMessage(add.error, 'That renewal could not be recorded.')}</span>
            </p>
          ) : null}
        </div>

        <footer className="op-dialog-foot">
          <div className="right">
            <Button variant="ghost" onClick={onClose} disabled={add.isPending}>
              Cancel
            </Button>
            <Button
              disabled={!ready || add.isPending}
              onClick={() =>
                add.mutate(
                  {
                    kind,
                    number: needsNumber ? number.trim() : undefined,
                    visaType: kind === 'VISA' ? visaType : undefined,
                    visaTypeOther: needsOther ? visaTypeOther.trim() : undefined,
                    issuingCountry: kind === 'PASSPORT' ? issuingCountry.trim() : undefined,
                    issuedAt,
                    expiresAt,
                  },
                  { onSuccess: onClose },
                )
              }
            >
              {add.isPending ? 'Recording…' : first ? 'Record' : 'Record renewal'}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
