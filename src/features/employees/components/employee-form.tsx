'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { routes } from '@/core/config/routes';
import { fieldErrors } from '@/core/api/unwrap';
import { CheckIcon, ChevronDownIcon, PlusIcon } from '@/components/ui/icons';
import { EM_DASH, formatDate } from '@/lib/format';
import { useCreateEmployee, useUpdateEmployee } from '../hooks/use-employee-mutations';
import { useEmployeeOptions } from '../hooks/use-employees';
import {
  createEmployeeSchema,
  employeeSchema,
  type EmployeeFormValues,
} from '../schemas/employee.schema';
import {
  DRIVING_LICENSE,
  FAMILY_ROLE_LABELS,
  FAMILY_ROLES,
  GENDERS,
  MARITAL_STATUSES,
  VISA_TYPE_LABELS,
  VISA_TYPES,
  type Employee,
  type EmployeePayload,
} from '../types';
import { CancelEmployment } from './cancel-employment';
import { EfChoice, EfInput, EfSelect, EfTextarea } from './employee-form-fields';

/**
 * Add / edit employee — design/hirs-add-employee.html.
 *
 * Four numbered parts mirroring the paper form HIRS-IMS-RM-F26.5 Rev V2, a
 * sticky rail (photo, live record preview, completeness checklist), and a fixed
 * action bar. One component for both routes.
 */

const GENDER_LABELS = { MALE: 'Male', FEMALE: 'Female' } as const;
const MARITAL_LABELS = { SINGLE: 'Single', MARRIED: 'Married', OTHER: 'Other' } as const;
const LICENSE_LABELS = { YES: 'Yes', NO: 'No', OTHER: 'Other' } as const;

export function EmployeeForm({ employee }: { employee?: Employee }) {
  const router = useRouter();
  const isEdit = !!employee;
  const options = useEmployeeOptions();

  const create = useCreateEmployee();
  const update = useUpdateEmployee(employee?.id ?? '');
  const mutation = isEdit ? update : create;

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(isEdit ? employeeSchema : createEmployeeSchema),
    defaultValues: toFormValues(employee),
  });

  const family = useFieldArray({ control, name: 'familyContacts' });
  const emergency = useFieldArray({ control, name: 'emergencyContacts' });

  const visaType = useWatch({ control, name: 'visaType' });
  const maritalStatus = useWatch({ control, name: 'maritalStatus' });
  const drivingLicense = useWatch({ control, name: 'drivingLicense' });

  // Map the server's per-field validation errors onto the inputs that caused
  // them, so a rejected save points at the problem instead of just toasting.
  useEffect(() => {
    for (const item of fieldErrors(mutation.error)) {
      if (item.field && isFormField(item.field)) {
        setError(item.field, { message: item.message });
      }
    }
  }, [mutation.error, setError]);

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(toPayload(values));
  });

  const onCancel = () => {
    if (isDirty && !window.confirm('Discard your changes?')) return;
    router.push(routes.hr.employees);
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <nav className="ef-crumb an" aria-label="Breadcrumb">
        <Link href={routes.hr.employees}>HR</Link>
        <ChevronDownIcon size={13} className="crumb-chevron" />
        <Link href={routes.hr.employees}>Current employees</Link>
        <ChevronDownIcon size={13} className="crumb-chevron" />
        <span>{isEdit ? 'Edit employee' : 'Add employee'}</span>
      </nav>

      <div className="hirs-head an">
        <div>
          <h1 className="t-h1">{isEdit ? employee.name : 'Add employee'}</h1>
          <p className="lede">
            Employee personal information. Fields marked <span className="ef-req">*</span> are
            required.
          </p>
          <p className="ef-docref">
            Mirrors HIRS-IMS-RM-F26.5 · Rev V2 · same section order as the paper form
          </p>
        </div>
        {/* Every control inside is type="button", so nothing here submits the form. */}
        {isEdit ? (
          <div className="head-actions">
            <CancelEmployment employee={employee} />
          </div>
        ) : null}
      </div>

      <div className="ef-cols">
        <div className="ef-stack">
          {/* ── Part 1 ── */}
          <section className="panel an">
            <header className="ef-phead">
              <span className="ef-pnum">Part 1</span>
              <div>
                <h2>Job information</h2>
              </div>
            </header>

            <div className="ef-pbody">
              <div className="ef-grid">
                <EfInput
                  className="ef-span"
                  label="Employee name"
                  required
                  placeholder="As printed on the passport"
                  error={errors.name}
                  {...register('name')}
                />
                <EfInput
                  label="Employee I.D."
                  required
                  className="mono-field"
                  placeholder="HIRS-04213"
                  error={errors.employeeCode}
                  {...register('employeeCode')}
                />
                <EfSelect
                  label="Designation"
                  required
                  placeholder="Select designation"
                  error={errors.designation}
                  {...register('designation')}
                >
                  {options.data?.designations.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </EfSelect>
                <EfSelect
                  label="Department"
                  required
                  placeholder="Select department"
                  error={errors.department}
                  {...register('department')}
                >
                  {options.data?.departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </EfSelect>
                {/* The API takes a free-text manager name; there is no manager
                    lookup endpoint, so this is an input rather than a select. */}
                <EfInput
                  label="Reporting manager"
                  required
                  placeholder="Site Foreman"
                  error={errors.reportingManager}
                  {...register('reportingManager')}
                />
                <EfInput
                  label="Date of joining"
                  required
                  type="date"
                  error={errors.joiningDate}
                  {...register('joiningDate')}
                />
                <EfInput
                  label="Contract start"
                  required
                  type="date"
                  error={errors.contractStart}
                  {...register('contractStart')}
                />
                <EfInput
                  label="Contract end"
                  required
                  type="date"
                  error={errors.contractEnd}
                  {...register('contractEnd')}
                />
              </div>
            </div>

            <div className="ef-pbody">
              <p className="ef-grp">Visa</p>
              <div className="ef-grid">
                <EfChoice
                  className="ef-span"
                  label="Type of visa"
                  required
                  options={VISA_TYPES}
                  labels={VISA_TYPE_LABELS}
                  error={errors.visaType}
                  {...register('visaType')}
                >
                  {visaType === 'OTHER' ? (
                    <input
                      className="ef-other"
                      placeholder="Specify"
                      aria-label="Specify visa type"
                      {...register('visaTypeOther')}
                    />
                  ) : null}
                </EfChoice>
                {errors.visaTypeOther?.message ? (
                  <p className="field-error ef-span" role="alert">
                    {errors.visaTypeOther.message}
                  </p>
                ) : null}
                <EfInput
                  label="Issue date"
                  required
                  type="date"
                  error={errors.visaIssueDate}
                  {...register('visaIssueDate')}
                />
                <EfInput
                  label="Expiry date"
                  required
                  type="date"
                  error={errors.visaExpiryDate}
                  {...register('visaExpiryDate')}
                />
              </div>
            </div>

            <div className="ef-pbody">
              <p className="ef-grp">
                Visit visa <span className="tag">if applicable</span>
              </p>
              <div className="ef-grid-3">
                <EfInput
                  label="Visit visa number"
                  placeholder={EM_DASH}
                  error={errors.visitVisaNumber}
                  {...register('visitVisaNumber')}
                />
                <EfInput
                  label="Issue date"
                  type="date"
                  error={errors.visitVisaIssueDate}
                  {...register('visitVisaIssueDate')}
                />
                <EfInput
                  label="Expiry date"
                  type="date"
                  error={errors.visitVisaExpiryDate}
                  {...register('visitVisaExpiryDate')}
                />
              </div>
            </div>

            <div className="ef-pbody">
              <p className="ef-grp">Emirates I.D.</p>
              <div className="ef-grid-3">
                <EfInput
                  label="Emirates I.D. number"
                  required
                  placeholder="784-0000-0000000-0"
                  error={errors.emiratesIdNumber}
                  {...register('emiratesIdNumber')}
                />
                <EfInput
                  label="Issue date"
                  required
                  type="date"
                  error={errors.emiratesIdIssueDate}
                  {...register('emiratesIdIssueDate')}
                />
                <EfInput
                  label="Expiry date"
                  required
                  type="date"
                  error={errors.emiratesIdExpiryDate}
                  {...register('emiratesIdExpiryDate')}
                />
              </div>
            </div>

            <div className="ef-pbody">
              <p className="ef-grp">Passport</p>
              <div className="ef-grid">
                <EfInput
                  label="Passport number"
                  required
                  placeholder="P1234567"
                  error={errors.passportNumber}
                  {...register('passportNumber')}
                />
                <EfSelect
                  label="Issuing country"
                  required
                  placeholder="Select country"
                  error={errors.passportCountry}
                  {...register('passportCountry')}
                >
                  {options.data?.countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </EfSelect>
                <EfInput
                  label="Issue date"
                  required
                  type="date"
                  error={errors.passportIssueDate}
                  {...register('passportIssueDate')}
                />
                <EfInput
                  label="Valid until"
                  required
                  type="date"
                  error={errors.passportValidUntil}
                  {...register('passportValidUntil')}
                />
              </div>
            </div>
          </section>

          {/* ── Part 2 ── */}
          <section className="panel an">
            <header className="ef-phead">
              <span className="ef-pnum">Part 2</span>
              <div>
                <h2>Personal data</h2>
              </div>
            </header>

            <div className="ef-pbody">
              <div className="ef-grid">
                <EfInput
                  label="Date of birth"
                  required
                  type="date"
                  error={errors.dateOfBirth}
                  {...register('dateOfBirth')}
                />
                <EfSelect
                  label="Nationality"
                  required
                  placeholder="Select nationality"
                  error={errors.nationality}
                  {...register('nationality')}
                >
                  {options.data?.nationalities.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </EfSelect>
                <EfSelect
                  label="Religion"
                  required
                  placeholder="Select religion"
                  error={errors.religion}
                  {...register('religion')}
                >
                  {options.data?.religions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </EfSelect>
                <EfInput
                  label="Email"
                  required
                  type="email"
                  placeholder="name@example.com"
                  error={errors.email}
                  {...register('email')}
                />
                <EfInput
                  label="Tel no."
                  required
                  placeholder="+971 2 000 0000"
                  error={errors.telNo}
                  {...register('telNo')}
                />
                <EfInput
                  label="Mobile no."
                  required
                  placeholder="+971 50 000 0000"
                  error={errors.mobileNo}
                  {...register('mobileNo')}
                />
                <EfTextarea
                  label="Present address"
                  required
                  placeholder="Address in the UAE"
                  error={errors.presentAddress}
                  {...register('presentAddress')}
                />
                <EfTextarea
                  label="Permanent address"
                  required
                  placeholder="Address in the home country"
                  error={errors.permanentAddress}
                  {...register('permanentAddress')}
                />

                <EfChoice
                  label="Gender"
                  required
                  options={GENDERS}
                  labels={GENDER_LABELS}
                  error={errors.gender}
                  {...register('gender')}
                />
                <EfInput
                  label="No. of children"
                  type="number"
                  min={0}
                  placeholder="0"
                  error={errors.numberOfChildren}
                  {...register('numberOfChildren')}
                />

                <EfChoice
                  className="ef-span"
                  label="Marital status"
                  required
                  options={MARITAL_STATUSES}
                  labels={MARITAL_LABELS}
                  error={errors.maritalStatus}
                  {...register('maritalStatus')}
                >
                  {maritalStatus === 'OTHER' ? (
                    <input
                      className="ef-other"
                      placeholder="Specify"
                      aria-label="Specify marital status"
                      {...register('maritalStatusOther')}
                    />
                  ) : null}
                </EfChoice>

                <EfChoice
                  label="UAE driving license"
                  required
                  options={DRIVING_LICENSE}
                  labels={LICENSE_LABELS}
                  error={errors.drivingLicense}
                  {...register('drivingLicense')}
                >
                  {drivingLicense === 'OTHER' ? (
                    <input
                      className="ef-other"
                      placeholder="Specify"
                      aria-label="Specify licence"
                      {...register('drivingLicenseOther')}
                    />
                  ) : null}
                </EfChoice>
                <EfInput
                  label="License valid until"
                  type="date"
                  error={errors.drivingLicenseValidUntil}
                  {...register('drivingLicenseValidUntil')}
                />
              </div>
            </div>
          </section>

          {/* ── Part 3 ── */}
          <section className="panel an">
            <header className="ef-phead">
              <span className="ef-pnum">Part 3</span>
              <div>
                <h2>Family contact information</h2>
                <p className="note">Leave a row blank if it does not apply.</p>
              </div>
            </header>
            <div className="ef-pbody">
              <div className="ef-tbl ef-fam">
                <div className="ef-trow hdr">
                  <div>Relation</div>
                  <div>Name</div>
                  <div>Location</div>
                  <div>Contact no.</div>
                </div>
                {family.fields.map((field, index) => (
                  <div className="ef-trow" key={field.id}>
                    <div className="ef-rl">
                      {FAMILY_ROLE_LABELS[FAMILY_ROLES[index] ?? 'SPOUSE']}
                      {FAMILY_ROLES[index] === 'HOME_FAMILY' ? (
                        <small>from home country</small>
                      ) : null}
                    </div>
                    <div>
                      <input
                        placeholder="Full name"
                        aria-label={`${FAMILY_ROLE_LABELS[FAMILY_ROLES[index] ?? 'SPOUSE']} name`}
                        {...register(`familyContacts.${index}.name`)}
                      />
                    </div>
                    <div>
                      <input
                        placeholder={FAMILY_ROLES[index] === 'UAE_RELATIVE' ? 'Emirate' : 'City, country'}
                        aria-label="Location"
                        {...register(`familyContacts.${index}.location`)}
                      />
                    </div>
                    <div>
                      <input
                        placeholder={
                          FAMILY_ROLES[index] === 'UAE_RELATIVE'
                            ? '+971 00 000 0000'
                            : '+00 000 000 0000'
                        }
                        aria-label="Contact number"
                        {...register(`familyContacts.${index}.contactNo`)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Part 4 ── */}
          <section className="panel an">
            <header className="ef-phead">
              <span className="ef-pnum">Part 4</span>
              <div>
                <h2>Contact person in case of emergency</h2>
                <p className="note">At least one is required.</p>
              </div>
            </header>
            <div className="ef-pbody">
              <div className="ef-tbl ef-emg">
                <div className="ef-trow hdr">
                  <div>Name</div>
                  <div>Address</div>
                  <div>Relation</div>
                  <div>Contact no.</div>
                  <div />
                </div>
                {emergency.fields.map((field, index) => (
                  <div className="ef-trow" key={field.id}>
                    <div>
                      <input
                        placeholder="Full name"
                        aria-label="Emergency contact name"
                        {...register(`emergencyContacts.${index}.name`)}
                      />
                    </div>
                    <div>
                      <input
                        placeholder="Address"
                        aria-label="Emergency contact address"
                        {...register(`emergencyContacts.${index}.address`)}
                      />
                    </div>
                    <div>
                      <input
                        placeholder="Brother"
                        aria-label="Relation"
                        {...register(`emergencyContacts.${index}.relation`)}
                      />
                    </div>
                    <div>
                      <input
                        placeholder="+00 000 000 0000"
                        aria-label="Emergency contact number"
                        {...register(`emergencyContacts.${index}.contactNo`)}
                      />
                    </div>
                    <button
                      type="button"
                      className="ef-del"
                      onClick={() => emergency.remove(index)}
                      disabled={emergency.fields.length <= 1}
                      aria-label={`Remove emergency contact ${index + 1}`}
                      title={
                        emergency.fields.length <= 1
                          ? 'At least one emergency contact is required'
                          : 'Remove'
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {errors.emergencyContacts?.message ? (
                <p className="field-error" role="alert">
                  {errors.emergencyContacts.message}
                </p>
              ) : null}
              <button
                type="button"
                className="ef-addrow"
                onClick={() =>
                  emergency.append({ name: '', address: '', relation: '', contactNo: '' })
                }
              >
                <PlusIcon size={15} />
                Add another contact
              </button>
            </div>
          </section>
        </div>

        <Rail control={control} />
      </div>

      <div className="ef-actions">
        <div className="inner">
          <RequiredCount control={control} />
          <div className="right">
            <button type="button" className="btn-ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Save employee'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

/* ══════════ RAIL ══════════ */

function Rail({ control }: { control: Control<EmployeeFormValues> }) {
  const values = useWatch({ control });

  const preview: { k: string; v: string | undefined }[] = [
    { k: 'Employee I.D.', v: values.employeeCode },
    { k: 'Designation', v: values.designation },
    { k: 'Department', v: values.department },
    { k: 'Visa expiry', v: values.visaExpiryDate ? formatDate(values.visaExpiryDate) : undefined },
    {
      k: 'Passport valid until',
      v: values.passportValidUntil ? formatDate(values.passportValidUntil) : undefined,
    },
  ];

  const checks = [
    {
      label: 'Part 1 — job information',
      done: !!(
        values.name &&
        values.employeeCode &&
        values.designation &&
        values.department &&
        values.reportingManager &&
        values.joiningDate &&
        values.contractStart &&
        values.contractEnd &&
        values.visaType &&
        values.visaIssueDate &&
        values.visaExpiryDate &&
        values.emiratesIdNumber &&
        values.passportNumber
      ),
    },
    {
      label: 'Part 2 — personal data',
      done: !!(
        values.dateOfBirth &&
        values.nationality &&
        values.religion &&
        values.email &&
        values.telNo &&
        values.mobileNo &&
        values.presentAddress &&
        values.permanentAddress &&
        values.gender &&
        values.maritalStatus &&
        values.drivingLicense
      ),
    },
    {
      label: 'Part 3 — family contacts',
      done: (values.familyContacts ?? []).some((c) => !!c?.name?.trim()),
    },
    {
      label: 'Part 4 — emergency contact',
      done: (values.emergencyContacts ?? []).some(
        (c) => !!c?.name?.trim() && !!c?.contactNo?.trim(),
      ),
    },
  ];

  return (
    <aside className="ef-rail">
      <section className="panel">
        <h3>Photo</h3>
        {/* Upload needs a storage endpoint the API does not expose yet, so this
            is deliberately inert rather than a control that silently fails. */}
        <div className="ef-photo" aria-disabled="true" title="Photo upload is not available yet">
          <div>
            <svg viewBox="0 0 24 24" className="s" aria-hidden="true">
              <path d="M12 16V4M8 8l4-4 4 4" />
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            <b>Upload photo</b>
            <span>JPG or PNG · passport size</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>Record preview</h3>
        {preview.map((row) => (
          <div className="ef-prow" key={row.k}>
            <span className="k">{row.k}</span>
            <span className={`v${row.v ? '' : ' mut'}`}>{row.v || 'Not set'}</span>
          </div>
        ))}
      </section>

      <section className="panel">
        <h3>Before saving</h3>
        {checks.map((check) => (
          <div className={`ef-check ${check.done ? 'done' : 'todo'}`} key={check.label}>
            <CheckIcon size={15} />
            {check.label}
          </div>
        ))}
      </section>

      <section className="panel">
        <h3>Deployment</h3>
        <p className="ef-railnote">
          Camp, client and site are set in the Operations module once this record is saved.
        </p>
      </section>
    </aside>
  );
}

function RequiredCount({ control }: { control: Control<EmployeeFormValues> }) {
  const values = useWatch({ control });
  const left = REQUIRED_FIELDS.filter((key) => {
    const value = values[key];
    return value === undefined || value === null || value === '';
  }).length;

  const emergencyMissing = !(values.emergencyContacts ?? []).some(
    (c) => !!c?.name?.trim() && !!c?.contactNo?.trim(),
  );
  const total = left + (emergencyMissing ? 1 : 0);

  if (total === 0) {
    return (
      <span className="status">
        <i className="dot dot--good" />
        Ready to save
      </span>
    );
  }

  return (
    <span className="status">
      <i className="dot dot--warn" />
      {total} required {total === 1 ? 'field' : 'fields'} left
    </span>
  );
}

/* ══════════ MAPPING ══════════ */

const REQUIRED_FIELDS = [
  'employeeCode',
  'name',
  'designation',
  'department',
  'reportingManager',
  'joiningDate',
  'contractStart',
  'contractEnd',
  'visaType',
  'visaIssueDate',
  'visaExpiryDate',
  'emiratesIdNumber',
  'emiratesIdIssueDate',
  'emiratesIdExpiryDate',
  'passportNumber',
  'passportCountry',
  'passportIssueDate',
  'passportValidUntil',
  'dateOfBirth',
  'nationality',
  'religion',
  'email',
  'telNo',
  'mobileNo',
  'presentAddress',
  'permanentAddress',
  'gender',
  'maritalStatus',
  'drivingLicense',
] as const satisfies readonly (keyof EmployeeFormValues)[];

const FORM_FIELDS: readonly string[] = [
  ...REQUIRED_FIELDS,
  'visaTypeOther',
  'visitVisaNumber',
  'visitVisaIssueDate',
  'visitVisaExpiryDate',
  'maritalStatusOther',
  'numberOfChildren',
  'drivingLicenseOther',
  'drivingLicenseValidUntil',
  'familyContacts',
  'emergencyContacts',
];

function isFormField(field: string): field is keyof EmployeeFormValues {
  return FORM_FIELDS.includes(field);
}

/** The four family rows are fixed and positional — one per role, in role order. */
function toFormValues(employee: Employee | undefined): EmployeeFormValues {
  const familyContacts = FAMILY_ROLES.map((role) => {
    const existing = employee?.familyContacts?.find((c) => c.role === role);
    return {
      role,
      name: existing?.name ?? '',
      location: existing?.location ?? '',
      contactNo: existing?.contactNo ?? '',
    };
  });

  const emergencyContacts =
    employee?.emergencyContacts?.length
      ? employee.emergencyContacts.map((c) => ({
          name: c.name,
          address: c.address,
          relation: c.relation,
          contactNo: c.contactNo,
        }))
      : [{ name: '', address: '', relation: '', contactNo: '' }];

  return {
    employeeCode: employee?.employeeCode ?? '',
    name: employee?.name ?? '',
    designation: employee?.designation ?? '',
    department: employee?.department ?? '',
    reportingManager: employee?.reportingManager ?? '',
    joiningDate: day(employee?.joiningDate),
    contractStart: day(employee?.contractStart),
    contractEnd: day(employee?.contractEnd),
    visaType: employee?.visaType ?? 'EMPLOYMENT',
    visaTypeOther: employee?.visaTypeOther ?? '',
    visaIssueDate: day(employee?.visaIssueDate),
    visaExpiryDate: day(employee?.visaExpiryDate),
    visitVisaNumber: employee?.visitVisaNumber ?? '',
    visitVisaIssueDate: day(employee?.visitVisaIssueDate),
    visitVisaExpiryDate: day(employee?.visitVisaExpiryDate),
    emiratesIdNumber: employee?.emiratesIdNumber ?? '',
    emiratesIdIssueDate: day(employee?.emiratesIdIssueDate),
    emiratesIdExpiryDate: day(employee?.emiratesIdExpiryDate),
    passportNumber: employee?.passportNumber ?? '',
    passportCountry: employee?.passportCountry ?? '',
    passportIssueDate: day(employee?.passportIssueDate),
    passportValidUntil: day(employee?.passportValidUntil),
    dateOfBirth: day(employee?.dateOfBirth),
    nationality: employee?.nationality ?? '',
    religion: employee?.religion ?? '',
    email: employee?.email ?? '',
    telNo: employee?.telNo ?? '',
    mobileNo: employee?.mobileNo ?? '',
    presentAddress: employee?.presentAddress ?? '',
    permanentAddress: employee?.permanentAddress ?? '',
    gender: employee?.gender ?? 'MALE',
    maritalStatus: employee?.maritalStatus ?? 'SINGLE',
    maritalStatusOther: employee?.maritalStatusOther ?? '',
    numberOfChildren:
      employee?.numberOfChildren === null || employee?.numberOfChildren === undefined
        ? ''
        : String(employee.numberOfChildren),
    drivingLicense: employee?.drivingLicense ?? 'NO',
    drivingLicenseOther: employee?.drivingLicenseOther ?? '',
    drivingLicenseValidUntil: day(employee?.drivingLicenseValidUntil),
    familyContacts,
    emergencyContacts,
  };
}

/**
 * Drop empty optional strings rather than sending "" — the API treats an empty
 * string as a value, and a blank family row should not become a contact.
 */
function toPayload(values: EmployeeFormValues): EmployeePayload {
  const familyContacts = values.familyContacts.filter(
    (c) => c.name?.trim() || c.location?.trim() || c.contactNo?.trim(),
  );

  // numberOfChildren is re-added below as a number, so it is dropped here.
  const { numberOfChildren: _omit, ...rest } = values;
  void _omit;
  const payload: EmployeePayload = {
    ...rest,
    familyContacts,
    ...blank('visaTypeOther', values.visaTypeOther),
    ...blank('visitVisaNumber', values.visitVisaNumber),
    ...blank('visitVisaIssueDate', values.visitVisaIssueDate),
    ...blank('visitVisaExpiryDate', values.visitVisaExpiryDate),
    ...blank('maritalStatusOther', values.maritalStatusOther),
    ...blank('drivingLicenseOther', values.drivingLicenseOther),
    ...blank('drivingLicenseValidUntil', values.drivingLicenseValidUntil),
  };

  // The form holds this as text; the API wants a number or nothing at all.
  if (values.numberOfChildren?.trim()) {
    payload.numberOfChildren = Number(values.numberOfChildren);
  } else {
    delete payload.numberOfChildren;
  }
  return payload;
}

function blank<K extends string>(key: K, value: string | undefined) {
  return value?.trim() ? { [key]: value.trim() } : ({} as Record<K, never>);
}

/** The API returns ISO datetimes; date inputs need a bare yyyy-mm-dd. */
function day(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}
