'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { routes } from '@/core/config/routes';
import { apiMessage, fieldErrors, statusOf } from '@/core/api/unwrap';
import {
  CampIcon,
  CheckIcon,
  ChevronDownIcon,
  InfoIcon,
  InternalIcon,
  MarkupIcon,
  SiteIcon,
} from '@/components/ui/icons';
import { EfInput, EfTextarea } from '@/features/employees/components/employee-form-fields';
import { useCreateProject, useUpdateProject } from '../hooks/use-operations';
import { formatCount } from '@/lib/format';
import { projectSchema, type ProjectFormValues } from '../schemas/project.schema';
import {
  ACCOMMODATIONS,
  PROJECT_TYPES,
  type Accommodation,
  type ManagedBy,
  type Project,
  type ProjectPayload,
  type ProjectType,
} from '../types';

/**
 * Add / edit project — design/hirs-ops-add-project.html.
 *
 * Four numbered parts, a sticky rail with a live preview, and a fixed action
 * bar. The type is picked first because it decides what else is asked: only a
 * client site is managed by a department, and a markup company houses its own
 * people. Those fields grey out with a reason rather than vanishing, so the
 * form does not jump about as the type changes.
 */

const TYPE_CARDS: Record<ProjectType, { label: string; note: string; Icon: typeof SiteIcon }> = {
  SITE: {
    label: 'Client site',
    note: 'A live project. Counted under Ongoing projects and shown on the daily report.',
    Icon: SiteIcon,
  },
  MARKUP: {
    label: 'Markup',
    note: 'A company paying us for the visa or permit only. Counted separately.',
    Icon: MarkupIcon,
  },
  INTERNAL: {
    label: 'Internal',
    note: 'Office, camp staff or real estate. Counted under Staff.',
    Icon: InternalIcon,
  },
};

/** The order the design shows them in, which is not the enum's. */
const MANAGED_ORDER: readonly ManagedBy[] = ['BUSINESS', 'OPERATIONS', 'JOINT'];
const MANAGED_LABELS: Record<ManagedBy, string> = {
  BUSINESS: 'B.D',
  OPERATIONS: 'Operations',
  JOINT: 'Both',
};

const ACCOMMODATION_CHOICES: Record<Accommodation, { label: string; Icon: typeof SiteIcon }> = {
  CLIENT: { label: 'Client provided', Icon: SiteIcon },
  HORIZON: { label: 'Horizon camp', Icon: CampIcon },
};

const TYPE_BADGES: Record<ProjectType, string> = { SITE: 'Site', MARKUP: 'Markup', INTERNAL: 'Internal' };

export function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter();
  const isEdit = !!project;

  const create = useCreateProject();
  const update = useUpdateProject(project?.id ?? '');
  const mutation = isEdit ? update : create;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    setFocus,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: toFormValues(project),
  });

  const type = useWatch({ control, name: 'type' });
  const accommodation = useWatch({ control, name: 'accommodation' });
  const inDailyReport = useWatch({ control, name: 'inDailyReport' });
  const name = useWatch({ control, name: 'name' });
  const location = useWatch({ control, name: 'location' });

  const isSite = type === 'SITE';
  const isMarkup = type === 'MARKUP';

  // A duplicate name comes back as a 409; it belongs under the name field, not
  // only in a toast. Other per-field errors land on their own inputs.
  useEffect(() => {
    if (!mutation.error) return;
    if (statusOf(mutation.error) === 409) {
      setError('name', {
        message: apiMessage(
          mutation.error,
          'A project with that name already exists. Open it, or use a different name.',
        ),
      });
      return;
    }
    for (const item of fieldErrors(mutation.error)) {
      if (item.field && FORM_FIELDS.includes(item.field)) {
        setError(item.field as keyof ProjectFormValues, { message: item.message });
      }
    }
  }, [mutation.error, setError]);

  const save = (addAnother: boolean) =>
    handleSubmit((values) => {
      const payload = toPayload(values);
      if (project) {
        update.mutate(payload, { onSuccess: () => router.push(routes.operations.project(project.id)) });
        return;
      }
      create.mutate(payload, {
        onSuccess: (created) => {
          if (!addAnother) {
            router.push(routes.operations.project(created.id));
            return;
          }
          // Same type and defaults as the last one — a batch of sites is the
          // usual reason to add another — but a fresh name.
          reset({ ...values, name: '', location: '', remark: '' });
          setFocus('name');
        },
      });
    });

  const onCancel = () => {
    if (isDirty && !window.confirm('Discard your changes?')) return;
    router.push(project ? routes.operations.project(project.id) : routes.operations.projects);
  };

  const typeField = register('type', {
    // Markup and internal rows are normally left off the daily report, so a new
    // one of those turns the flag off rather than making somebody remember to.
    // An existing project keeps whatever it was set to.
    onChange: (event) => {
      if (!isEdit) setValue('inDailyReport', event.target.value === 'SITE');
    },
  });

  return (
    <form onSubmit={save(false)} noValidate>
      <nav className="ef-crumb an" aria-label="Breadcrumb">
        <Link href={routes.operations.master}>Operations</Link>
        <ChevronDownIcon size={13} className="crumb-chevron" />
        <Link href={routes.operations.projects}>Projects</Link>
        <ChevronDownIcon size={13} className="crumb-chevron" />
        {project ? (
          <>
            <Link href={routes.operations.project(project.id)}>{project.name}</Link>
            <ChevronDownIcon size={13} className="crumb-chevron" />
            <span>Edit</span>
          </>
        ) : (
          <span>Add project</span>
        )}
      </nav>

      <div className="hirs-head an">
        <div>
          <h1 className="t-h1">{project ? `Edit ${project.name}` : 'Add project'}</h1>
          <p className="lede">
            Somewhere workers can be placed — a client site, a markup company, or an internal
            location.
          </p>
        </div>
      </div>

      <div className="ef-cols op-pf-cols">
        <div className="ef-stack">
          {/* ── 1 · Type ── */}
          <section className="panel an">
            <header className="ef-phead">
              <span className="ef-pnum">1</span>
              <div>
                <h2>Type</h2>
                <p className="note">Decides how this project is counted and what else you&apos;ll be asked</p>
              </div>
            </header>
            <div className="ef-pbody">
              <fieldset className="op-types">
                <legend className="sr-only">Project type</legend>
                {PROJECT_TYPES.map((option) => {
                  const card = TYPE_CARDS[option];
                  return (
                    <label key={option} className="op-type">
                      <input type="radio" value={option} {...typeField} />
                      <span className="op-type-ic">
                        <card.Icon />
                      </span>
                      <b>{card.label}</b>
                      <span className="op-type-note">{card.note}</span>
                    </label>
                  );
                })}
              </fieldset>
            </div>
          </section>

          {/* ── 2 · Details ── */}
          <section className="panel an">
            <header className="ef-phead">
              <span className="ef-pnum">2</span>
              <div>
                <h2>Details</h2>
                <p className="note">Name and location are kept apart so reports can group by either</p>
              </div>
            </header>
            <div className="ef-pbody">
              <div className="ef-grid">
                <EfInput
                  className="ef-span"
                  label="Project name"
                  required
                  placeholder="CPECC Qushwera Div 7"
                  error={errors.name}
                  hint={
                    <>
                      Name only — leave the location out. The daily report prints it as{' '}
                      <b>
                        {name?.trim() || 'CPECC Qushwera Div 7'}
                        {location?.trim() ? ` / ${location.trim()}` : ''}
                      </b>
                      .
                    </>
                  }
                  {...register('name')}
                />
                <EfInput
                  label="Location"
                  optionalNote="optional"
                  placeholder="Qushwera"
                  error={errors.location}
                  {...register('location')}
                />

                <fieldset className={`ef-field${isSite ? '' : ' op-dis'}`} disabled={!isSite}>
                  <legend>
                    Managed by
                    {isSite ? (
                      <span className="ef-req" aria-hidden="true">
                        *
                      </span>
                    ) : null}
                  </legend>
                  <div className="ef-seg">
                    {MANAGED_ORDER.map((option) => (
                      <label key={option}>
                        <input type="radio" value={option} {...register('managedBy')} />
                        {MANAGED_LABELS[option]}
                      </label>
                    ))}
                  </div>
                  {errors.managedBy?.message && isSite ? (
                    <p className="field-error" role="alert">
                      {errors.managedBy.message}
                    </p>
                  ) : null}
                </fieldset>
                {isSite ? null : (
                  <p className="op-disnote op-disnote--grid">
                    <InfoIcon size={14} />
                    Only client sites are managed by a department.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ── 3 · Defaults ── */}
          <section className="panel an">
            <header className="ef-phead">
              <span className="ef-pnum">3</span>
              <div>
                <h2>Defaults</h2>
                <p className="note">Applied when someone is placed here — overridable per worker</p>
              </div>
            </header>
            <div className="ef-pbody">
              <fieldset
                className={`ef-field op-pf-acc${isMarkup ? ' op-dis' : ''}`}
                disabled={isMarkup}
              >
                <legend>
                  Accommodation <span className="ef-opt">optional</span>
                </legend>
                <div className="ef-seg">
                  {ACCOMMODATIONS.map((option) => {
                    const choice = ACCOMMODATION_CHOICES[option];
                    return (
                      <label key={option}>
                        <input type="radio" value={option} {...register('accommodation')} />
                        <choice.Icon />
                        {choice.label}
                      </label>
                    );
                  })}
                  {accommodation && !isMarkup ? (
                    <button
                      type="button"
                      className="op-pf-clear"
                      onClick={() =>
                        setValue('accommodation', null, { shouldDirty: true })
                      }
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <p className="ef-hint">
                  The sheet&apos;s <b>OUT SITE</b> means client provided.
                </p>
              </fieldset>
              {isMarkup ? (
                <p className="op-disnote op-pf-accnote">
                  <InfoIcon size={14} />
                  A markup company houses its own people.
                </p>
              ) : null}

              <div className="op-switchrow">
                <div className="op-switchrow-txt">
                  <b id="op-pf-dr-label">Show on the daily report</b>
                  <span id="op-pf-dr-note">
                    Gets its own row in the headcount matrix. Markup companies are normally left
                    off.
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  className="op-switch"
                  aria-checked={inDailyReport}
                  aria-labelledby="op-pf-dr-label"
                  aria-describedby="op-pf-dr-note"
                  onClick={() => setValue('inDailyReport', !inDailyReport, { shouldDirty: true })}
                />
              </div>
            </div>
          </section>

          {/* ── 4 · Notes ── */}
          <section className="panel an">
            <header className="ef-phead">
              <span className="ef-pnum">4</span>
              <div>
                <h2>Notes</h2>
                <p className="note">Optional</p>
              </div>
            </header>
            <div className="ef-pbody">
              <EfTextarea
                label="Remark"
                placeholder="Scope, contact on site, anything the team should know."
                error={errors.remark}
                {...register('remark')}
              />
            </div>
          </section>
        </div>

        <Rail control={control} project={project} />
      </div>

      <div className="actionbar">
        <div className="inner">
          <ReadyStatus control={control} />
          <div className="right">
            <button type="button" className="btn-ghost" onClick={onCancel}>
              Cancel
            </button>
            {isEdit ? null : (
              <button
                type="button"
                className="btn-ghost"
                onClick={save(true)}
                disabled={mutation.isPending}
              >
                Save and add another
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              <CheckIcon size={16} />
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create project'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

/* ══════════ RAIL ══════════ */

function Rail({ control, project }: { control: Control<ProjectFormValues>; project?: Project }) {
  const values = useWatch({ control });
  const type = values.type ?? 'SITE';
  const TypeIcon = TYPE_CARDS[type].Icon;

  const rows: { k: string; v: React.ReactNode; muted?: boolean }[] = [
    { k: 'Type', v: <span className="op-pf-badge">{TYPE_BADGES[type]}</span> },
    {
      k: 'Managed by',
      v: type === 'SITE' && values.managedBy ? MANAGED_LABELS[values.managedBy] : '—',
    },
    {
      k: 'Accommodation',
      v:
        type !== 'MARKUP' && values.accommodation
          ? ACCOMMODATION_CHOICES[values.accommodation].label
          : 'Not set',
      muted: type === 'MARKUP' || !values.accommodation,
    },
    { k: 'Daily report', v: values.inDailyReport ? 'Yes' : 'No' },
    project
      ? { k: 'Headcount', v: `${formatCount(project.headcount)} on site now` }
      : { k: 'Headcount', v: '0 — nobody placed yet', muted: true },
  ];

  return (
    <aside className="ef-rail">
      <section className="panel">
        <h3>Preview</h3>
        <div className="op-pf-prev">
          <span className="op-pf-prev-ic">
            <TypeIcon size={19} />
          </span>
          <div>
            <b>{values.name?.trim() || 'Untitled project'}</b>
            <span>{values.location?.trim() || '—'}</span>
          </div>
        </div>
        {rows.map((row) => (
          <div className="ef-prow" key={row.k}>
            <span className="k">{row.k}</span>
            <span className={`v${row.muted ? ' mut' : ''}`}>{row.v}</span>
          </div>
        ))}
      </section>

      {project ? (
        <section className="panel">
          <h3>Saving changes</h3>
          <p className="ef-railnote">
            Nobody moves when you save. A new type or <b>Managed by</b> changes how this project
            is counted from now on; defaults apply to the next person placed here.
          </p>
        </section>
      ) : (
        <section className="panel">
          <h3>What happens next</h3>
          <p className="ef-railnote">
            Creating a project doesn&apos;t move anybody. It appears in <b>Projects</b> straight
            away, and in the <b>Move</b> dialog as a destination. Place workers from the master
            list.
          </p>
        </section>
      )}

      <section className="panel">
        <h3>Finishing a project</h3>
        <p className="ef-railnote">
          When it ends, use <b>Finish project</b> rather than deleting. Everyone still on it moves
          to <b>Site finished</b> on the date you give, and the history stays intact.
        </p>
      </section>
    </aside>
  );
}

function ReadyStatus({ control }: { control: Control<ProjectFormValues> }) {
  const values = useWatch({ control });

  const missing: string[] = [];
  if ((values.name?.trim().length ?? 0) < 2) missing.push('a name');
  if (values.type === 'SITE' && !values.managedBy) missing.push('who manages it');

  return (
    <span className="status">
      <i className={`dot ${missing.length ? 'dot--warn' : 'dot--good'}`} />
      {missing.length ? `Still needs ${missing.join(' and ')}` : 'Ready to save'}
    </span>
  );
}

/* ══════════ MAPPING ══════════ */

const FORM_FIELDS: readonly string[] = [
  'type',
  'name',
  'location',
  'managedBy',
  'accommodation',
  'inDailyReport',
  'remark',
];

function toFormValues(project: Project | undefined): ProjectFormValues {
  return {
    type: project?.type ?? 'SITE',
    name: project?.name ?? '',
    location: project?.location ?? '',
    // Operations is the usual owner of a new site; a markup or internal row
    // has none, and gets Operations back only if someone switches it to SITE.
    managedBy: project?.managedBy ?? 'OPERATIONS',
    accommodation: project?.accommodation ?? null,
    inDailyReport: project?.inDailyReport ?? true,
    remark: project?.remark ?? '',
  };
}

/**
 * Only what the chosen type actually has. Blank optional text is dropped rather
 * than sent as "" — the API stores an empty string as a value.
 */
function toPayload(values: ProjectFormValues): ProjectPayload {
  return {
    name: values.name.trim(),
    type: values.type,
    location: values.location?.trim() || undefined,
    managedBy: values.type === 'SITE' ? (values.managedBy ?? undefined) : undefined,
    accommodation: values.type === 'MARKUP' ? undefined : (values.accommodation ?? undefined),
    inDailyReport: values.inDailyReport,
    remark: values.remark?.trim() || undefined,
  };
}
