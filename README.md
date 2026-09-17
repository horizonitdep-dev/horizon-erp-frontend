# HIRS ERP — Frontend

Internal ERP for Horizon International Recruitment Services. Next.js App Router,
built to `documentation/DESIGN.md` and `documentation/HIRS_Frontend_Sprint_Guide.md`.

```bash
npm run dev        # http://localhost:3002
npm run build
npm run typecheck
npm run lint
```

Backend is expected at `http://localhost:3003/api/v1` (`NEXT_PUBLIC_API_URL`).
Copy `.env.example` to `.env.local` to change it.

---

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind (layout utilities only) ·
TanStack Query v5 · TanStack Table v8 · React Hook Form · Zod 4 · Zustand ·
Axios · Sonner · Sora / Inter / JetBrains Mono via `next/font/google`.

No MUI, Chakra, Ant, Mantine, DaisyUI or Bootstrap. shadcn/ui is permitted for
overlay primitives only, restyled with our tokens.

---

## Layout

```
src/
  app/            routes; (auth) and (app) groups
  core/           api client, auth, config — never imports from features/
  features/       one folder per module; never imports another feature
  components/     ui/ primitives and shell/ chrome
  lib/            fonts, theme, formatting, cn
  styles/         tokens.css, base.css, components.css, screens.css
  proxy.ts        route guard (Next 16's name for middleware.ts)
```

Layer rules, from the guide §3: components never call axios; features never
import from other features; `core/` never imports from `features/`; server state
is TanStack Query and client state is Zustand, with no overlap; every response
unwraps through `core/api/unwrap.ts`.

Adding a department is one entry in `core/config/modules.ts` plus its own
`features/` and `app/(app)/` folders. Nothing existing changes.

### Styles

`tokens.css` and `components.css` are verbatim ports of DESIGN.md §4 and §7 —
edit those only to correct a transcription error. `screens.css` holds the §6 and
§11 measurements those two sections don't cover, plus a clearly marked
`PRIMITIVE GAPS` block for behaviour the static mockups could not show (checked
and disabled states, hit areas). Everything in it uses existing tokens.

No raw hex in components. No inline font sizes. Dark mode is a token swap —
never a `[data-theme='dark']` override inside a component.

---

## Auth

Built to guide §5, which exists because the previous project logged users out
repeatedly. The four failure modes and their fixes:

| Failure | Fix | Where |
|---|---|---|
| No refresh on 401 | 401 → refresh → replay once | `core/api/client.ts` |
| Refresh stampede | One module-level promise every caller awaits | `core/auth/refresh.ts` |
| Stale token read on reload | Boot-time refresh before the shell renders | `features/auth/components/auth-provider.tsx` |
| Short-lived refresh token | Not an issue: the API issues a 30-day refresh token | — |

Access token lives in memory only. The refresh token lives under
`hirs-refresh-token` in `localStorage` or `sessionStorage` depending on "Keep me
signed in". This API does not rotate, but a new refresh token is still persisted
the moment one arrives, so a future change to rotation needs no frontend work.

Only a refused `/auth/refresh` or an explicit sign-out ends a session; network
errors and 5xx never do.

Verified against the live API: a hard reload of `/hr/employees` fires exactly
one `/auth/refresh`, then `/auth/me`, then the page's own queries — and a 404
from a missing endpoint triggers neither a refresh storm nor a logout.

`proxy.ts` reads a `hirs-session` cookie. That cookie is a presence marker, not
a credential — it holds no token and grants nothing. Its only job is to avoid
flashing the shell at a signed-out visitor. The API remains the only thing that
decides whether a request is authorised.

---

## Backend contract

Verified against the running API (`HIRS API 1.0`, Swagger at
`http://localhost:3003/api/docs`, spec at `/api/docs-json`).

**Note the port: the backend is on `3003`, not the `3000` in the guide.**
Port 3000 is the Horizon Property Manager frontend and 3001 is a different
service — pointing at either produces confusing 404s.

### Confirmed

| # | Question | Answer |
|---|---|---|
| 1 | Role enum | `CHAIRMAN \| MD \| HR \| BUSINESS \| OPERATIONS \| FINANCE \| IT` — matches `core/config/roles.ts` exactly |
| 2 | Access token | JWT, **15 minutes** |
| 2 | Refresh token | Opaque (not a JWT), **30 days** — comfortably over the 7-day minimum |
| 3 | Rotation | **No.** `/auth/refresh` returns the same token and the old one stays valid |
| 6 | Visa thresholds | Still a guess (30/90). Config only, so one env value changes them |
| 10 | CORS | Allows `http://localhost:3002` with credentials |

Other findings worth knowing:

- **The user is `fullName`**, not `firstName`/`lastName`. Initials and the
  greeting are derived by splitting it; nothing invents a split field.
- **`forbidNonWhitelisted` is on.** Any extra property is a 400 — sending
  `rememberMe` to `/auth/login` fails. "Keep me signed in" is therefore purely
  client-side: it chooses `localStorage` (survives the browser closing) over
  `sessionStorage` (dies with the tab).
- **Validation errors are structured**: `{ errors: [{ field, message }] }`
  alongside the envelope `message`. `core/api/unwrap.ts` surfaces the per-field
  detail, and the employee form maps it onto the offending input.
- **`/auth/login` is rate-limited.** Repeated attempts return a throttle error,
  which surfaces through the envelope like any other message.
- **Pagination** is `{ items, meta: { total, page, limit, totalPages,
  hasNextPage, hasPrevPage } }`, confirmed against `GET /users`.
- Seeded accounts exist for all seven roles: `chairman@`, `md@`, `hr@`,
  `business@`, `operations@`, `finance@`, `it@` `horizon.ae`.

### Not yet built on the backend

The API currently exposes **auth and users only**. These endpoints do not exist:

```
GET  /hr/employees            GET  /hr/employees/:id
POST /hr/employees            PATCH/DELETE /hr/employees/:id
GET  /hr/employees/stats      GET  /dashboard/summary
```

The screens that need them are complete and wired to the paths in guide §4.
Until the endpoints land they render their error states, every figure shows
`—`, and the dashboard's range control renders disabled rather than inert.
Nothing fabricates a number. When the endpoints ship, check these first:

1. **`Employee` fields** — `features/employees/types.ts` mirrors the HR mockup,
   not a Prisma model. Confirm before trusting it.
2. **Trade and nationality** — enum or free text? They are free-text inputs and
   the filter options are derived from the loaded page, which is why they are
   only ever a subset. A lookup endpoint would fix both.
3. **`deploymentStatus`** — the split model is implemented: the backend stores
   `DEPLOYED | ON_BENCH | ON_LEAVE`, the frontend derives `Renewal due` /
   `Expiring` from `visaExpiry`, and the visa state wins in the table when the
   document is inside its window.
4. **`/dashboard/summary` range param** — the control is built for it.
5. **Hub headline count** — "Six things need you today" needs a real
   `actionCount`. Without it the headline stops short rather than inventing one.
6. **Sign-in panel stats** — `412 / 23 / 3` are the mockup's static values,
   pending a public endpoint.

---

## Sprint scope

Built: sign in, navigation hub, dashboard, current employees, employee add/edit.
Sign-in is wired end to end against the live API; the rest await their endpoints.

Business, Operations, Finance and IT render as visible-but-inactive module tabs
and hub cards. The HR sub-nav items other than Current employees render with
their count pill and do not navigate. Employee detail is out of scope, so a row
click is a no-op rather than a broken link.
"# horizon-erp-frontend" 
