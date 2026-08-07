# IGI Portal — web

Frontend for the IGI / IHMS **Claims & Pre-Authorization portal**: a two-role
(CUSTOMER / OFFICER) workflow app over a single `Request` resource, with an
immutable audit trail as the centrepiece.

Customers submit claims and HMO pre-authorizations, track them, answer requests
for more information, and withdraw. Officers work a filterable queue, assign
requests to themselves, move them through the state machine, and approve or
deny. Every meaningful action writes an audit entry, and both portals render
that trail.

- **Frontend repo:** https://github.com/raymannie/igi-assessment-web
- **API base URL:** `https://igi-assessment-api-production.up.railway.app/api/v1`

> [SPEC.md](SPEC.md) is the shared contract with the backend repo — an identical
> copy lives there. It owns the state machine, enums, data model, API surface,
> error codes, and seed data. Nothing in this repo may change an enum value,
> status name, or DTO field name without the same change landing there.

---

## Setup

**Prerequisites:** Node 20.9+ (Next 16 requirement) and npm. The backend must be
running and reachable — there are no route handlers and no server-side data
access in this repo, so every byte of domain data comes from the API.

```bash
npm install
cp .env.example .env.local   # then point it at your backend
npm run dev                  # http://localhost:3000
```

### Environment

One variable, in `.env.local`:

```bash
# Deployed API
NEXT_PUBLIC_API_URL=https://igi-assessment-api-production.up.railway.app/api/v1

# Local backend
# NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

It is `NEXT_PUBLIC_` because the browser calls the API directly — there is no
proxy layer. If it is unset, every request resolves against the current origin
and fails; the app logs a warning in development rather than failing silently.

**CORS matters here.** The refresh token is an httpOnly cookie and every request
is sent with `credentials: 'include'`, so the API must answer with
`Access-Control-Allow-Credentials: true` and an explicit
`Access-Control-Allow-Origin` for this app's origin — a wildcard will not work.

### Scripts

```bash
npm run dev        # Turbopack dev server on :3000
npm run build      # production build (Turbopack); also typechecks
npm start          # serve the production build
npm run lint       # eslint (bare CLI — `next lint` was removed in Next 16)
npx tsc --noEmit   # typecheck on its own
npx next typegen   # regenerate route-typed globals after adding/renaming routes
```

There is no test runner configured — see [Known gaps](#known-gaps).

---

## Test credentials

Seeded by the backend (SPEC §9). Officers are seeded only; the public
registration form creates customers.

| Email | Password | Role | Name |
|---|---|---|---|
| `officer@igi.test` | `Officer123` | OFFICER | Adaeze Okonkwo |
| `officer2@igi.test` | `Officer123` | OFFICER | Tunde Bakare |
| `customer@igi.test` | `Customer123` | CUSTOMER | Chidi Nwosu (policy `IGI-POL-0001`) |
| `customer2@igi.test` | `Customer123` | CUSTOMER | Fatima Bello (policy `IGI-POL-0002`) |

Two officers exist so the assignee-only rule is demonstrable: sign in as
`officer2`, open a request `officer` has assigned to themselves, and the
decision controls are absent rather than present-and-failing.

---

## Stack

| Choice | Why |
|---|---|
| **Next.js 16.3 / React 19.2, App Router** | Route groups give the two portals separate layouts and navigation without a route-level `if`. Turbopack is the default for both `dev` and `build` in 16 — there is no `--turbopack` flag. |
| **Redux Toolkit + RTK Query** | The app is a cache-coherence problem more than a state problem: one status change has to refresh the request, its audit timeline, the list, and the officer stats. Tag invalidation expresses that in one line per mutation. |
| **Base UI + shadcn (`base-lyra`)** | shadcn's current registry is built on `@base-ui/react`, not Radix. Components are vendored into [src/components/ui/](src/components/ui/) so they can be edited rather than fought. |
| **Tailwind v4, CSS-first** | No `tailwind.config.*`. Theme tokens, the `dark` variant, and the base layer live in [src/app/globals.css](src/app/globals.css) via `@theme inline` / `@custom-variant`. |
| **Zod + react-hook-form** | One schema per DTO drives both the form and the API boundary, so client validation cannot drift from what the server accepts. |
| **Phosphor icons** | Set as `iconLibrary` in `components.json`, so the `ui/` primitives already import from it. (`lucide-react` is also installed as a transitive default; prefer Phosphor.) |
| **date-fns, sonner, next-themes** | Timestamp formatting, toasts, and the theme class on `<html>`. |

Version-sensitive details were verified against `node_modules/next/dist/docs/`
rather than from memory — Next 16 moved enough that older recipes mislead.

---

## Architecture decisions

### One `createApi`, and the envelope dies at the API layer

[store/api/baseApi.ts](src/store/api/baseApi.ts) owns `fetchBaseQuery`, the
reauth wrapper, and the entire `tagTypes` list. Feature APIs extend it with
`injectEndpoints` — a second `createApi` would mean a second cache and a second
middleware, and invalidation would silently do nothing across the boundary.

`transformResponse` strips `{ success, data, meta }` so no component ever sees
the envelope. `transformErrorResponse` collapses every failure mode — API error
envelope, bare HTTP status, network failure, timeout, unparseable body — into
one `{ code, message, details, status }` shape, so components render
`error.message` without narrowing.

### Auth: token in memory, session restored by a call

The access token lives in Redux and nowhere else — no localStorage, no
sessionStorage, no redux-persist. The refresh token is an httpOnly cookie the
client cannot read.

A page reload therefore starts with no token. [providers.tsx](src/app/providers.tsx)
fires `GET /auth/me` once; it 401s; the reauth wrapper exchanges the refresh
cookie for a new access token and retries. That retry *is* the session restore.

Two failure modes shaped this code:

- **Parallel 401s.** The backend rotates the refresh token on every use, so N
  concurrent 401s firing N refreshes means all but one consume a dead token and
  the session dies. A module-level promise serialises them into one refresh that
  every caller awaits.
- **Strict Mode remounts.** [store/index.ts](src/store/index.ts) memoises the
  browser store, because a per-mount store would drop the token on React's
  development remount and fire a second, racing refresh. The server branch still
  builds a fresh store per render, so concurrent SSR requests stay isolated.

### `proxy.ts` gates on a hint cookie, not the refresh cookie

Next 16 renamed `middleware.ts` to **`proxy.ts`** (Node runtime only). The
obvious implementation — read the refresh cookie, redirect if absent — cannot
work here: the API sets `refreshToken` with `Path=/api/v1/auth; HttpOnly` on
**its own domain**, and cookies are domain-scoped. The Next server is a
different origin and can never see it. Gating on it bounces every signed-in user
to `/login`.

So [lib/session-hint.ts](src/lib/session-hint.ts) writes a non-sensitive,
JS-visible `igi_session` cookie on login and on every successful refresh, and
clears it on logout or a server-rejected session. `proxy.ts` reads that.

It carries no token, no identity, and no claims, and it is trivially forgeable —
which is fine, because forging it buys you a page that immediately calls
`/auth/me`, fails, and redirects. **Authorisation lives on the API.** Role
separation lives in [RequireRole](src/components/common/require-role.tsx), which
runs inside each route group layout against the user resolved by `getMe`, and
renders a waiting state rather than a flash of the wrong portal.

### Status logic is data, not JSX conditionals

[lib/constants/statuses.ts](src/lib/constants/statuses.ts) holds SPEC §3 as
tables — `STATUS_META`, `TRANSITIONS`, and helpers `customerActions(status)` /
`officerActions(status, isAssignee)`. Components ask what they may render; they
never re-derive it inline.

The distinction worth naming: the transition table is split **per role**, not
shared. `NEEDS_ADDITIONAL_INFO → UNDER_REVIEW` belongs to the customer and
happens only through `POST /respond` — SPEC says it is never set directly.
Deriving officer actions from a combined table would offer an officer a "Start
review" button on a request that is waiting on the customer, and clicking it
would PATCH a transition the backend refuses.

All of this is UX. The backend enforces the same table and is the authority.

### Every request mutation invalidates four things

`Request` (that id), `AuditLog` (that id), `RequestList`, and `Stats`. The audit
tag is not optional: a status change that leaves the timeline stale reads as a
bug, and the timeline is the centrepiece of the app. List queries provide
per-item tags alongside the list tag, so updating one request does not force
every cached list to refetch.

### URL search params are the source of truth for filters

[use-officer-filters.ts](src/hooks/use-officer-filters.ts) and
[use-request-filters.ts](src/hooks/use-request-filters.ts) parse the query
string into a filter object and derive the RTK Query argument from it. A refresh
keeps the view, and an officer can paste a filtered queue link to a colleague.

Two details: selected statuses are **sorted** before serialising so the cache key
is stable regardless of click order, and any filter change other than paging
resets to page 1, since page 4 of a narrower result set is usually empty.

`GET /requests` accepts repeated `status` values, so the query string is built by
hand with `URLSearchParams.append` — handing `fetchBaseQuery` an object would
comma-join the array instead.

### Uploads

`FormData` goes straight in as the mutation body and `Content-Type` is never set
by hand — the browser has to add the multipart boundary itself.
[document-uploader.tsx](src/components/requests/document-uploader.tsx) mirrors
the server rules (PDF/JPEG/PNG, 5 MB, 5 files) so the user finds out
immediately, and the server validates again regardless.

Upload progress is deliberately **indeterminate**. `fetch` exposes no upload
progress event, so a percentage would be a fabrication; a real one needs a
custom `queryFn` around `XMLHttpRequest`, which was not worth a second HTTP
client.

### Comment-required and destructive actions go through a dialog

`NEEDS_ADDITIONAL_INFO` and `DENIED` are rejected by the backend without a
comment (`COMMENT_REQUIRED`), so those actions open a dialog with a required
textarea rather than firing on click. Withdrawal confirms for the same reason —
it is terminal.

### Server Components by default

`"use client"` only where interactivity or hooks require it. In practice the
domain screens are client components (they read the store and the URL), while
the route files stay server-side and own `metadata`, wrapping the views in
`Suspense` because `useSearchParams` requires it.

---

## Assumptions

From SPEC §11, and true of this frontend:

1. **Officers are seeded by an administrator.** The registration form creates
   customers only, and does not offer a role selector.
2. **One assignee per request.** No reassignment or hand-off UI — an officer
   assigns to themselves, and only the assignee sees decision controls.
3. **Policy numbers are free text.** Validated for length only; nothing is
   checked against an external policy system.
4. **Amounts are NGN**, entered and sent as a plain number. Production would use
   minor units or `Decimal128`; the form accepts at most 2 decimal places.
5. **Audit entries are append-only.** The timeline is read-only everywhere and
   offers no edit or delete affordance.
6. **Documents are public Cloudinary URLs**, rendered as plain links. Production
   would use signed, time-limited delivery.
7. **No multi-tenancy or branch scoping.**
8. **`WITHDRAWN` is reachable only from `NEEDS_ADDITIONAL_INFO`**, per the
   brief's wording — so the withdraw control appears only in that state, not on
   any request a customer happens to own.

Frontend-specific assumptions worth stating:

9. **The API is a separate origin**, reached over CORS with credentials. There is
   no Next.js route handler, no server-side fetching, and no BFF layer.
10. **Client-side validation and the visible action set are UX, not security.**
    Both mirror the backend rules and both assume the backend re-checks. A user
    who forges a request gets a 4xx, and the normalised error surfaces as a
    toast or a field error.
11. **The audit entry is denormalised** (`actorName`, `actorRole` on the entry),
    so the timeline renders identically for both roles without extra lookups.
12. **Mongo references arrive either populated or as a bare id string**,
    depending on the endpoint. [lib/refs.ts](src/lib/refs.ts) absorbs that branch
    rather than each component testing `typeof`.
13. **The UI is pinned to light mode.** `forcedTheme="light"` in
    [providers.tsx](src/app/providers.tsx) — the dark tokens and `dark:` variants
    are all still in place but inert, so removing that one prop re-enables the
    dark theme. This was a scope call, not a technical limit: native date pickers
    and the toast layer needed a matching `color-scheme` and only light was
    verified.
14. **`VALIDATION_ERROR` detail shape is not fixed by SPEC.** 
    [lib/form-errors.ts](src/lib/form-errors.ts) tolerates the common NestJS
    shapes and maps what it recognises onto form fields; anything it cannot read
    stays a toast rather than being dropped.

---

## What's included

Beyond the core flows, from the SPEC §10 bonus list:

- **Pagination** — server-driven, page state in the URL.
- **Search** — the `search` query param, alongside status / type / category /
  date-range / assigned-to-me filters.
- **Dashboard metrics** — `/officer/stats`, tagged `Stats` and invalidated by
  every request mutation, so figures follow an assignment or a decision without
  extra wiring.
- **JWT refresh tokens** — the silent-refresh path described above.

Also: responsive shell (sidebar on `md+`, sheet below), skeleton and empty
states on every async surface, and route-level `error.tsx` /
`global-error.tsx` / `not-found.tsx`.

## Known gaps

- **No test runner.** SPEC §10 bonus #5 asks for unit tests on the state
  machine, and the pure helpers in `lib/constants/statuses.ts` were written to be
  directly testable — but no runner is configured and no tests exist. Adding
  Vitest and testing `officerActions` / `customerActions` against the SPEC §3
  table is the highest-value next step.
- **No Docker, CI/CD, or email notification** (bonus items 6–8).
- **Upload progress is indeterminate**, as described above.
- **The frontend deployment URL is not recorded here** — add it above once the
  app is deployed, since SPEC §10 requires a publicly reachable URL.

---

## Repo conventions

- Import via the `@/*` alias (→ `src/*`); compose classes with `cn()` from
  [lib/utils.ts](src/lib/utils.ts).
- Add primitives with `npx shadcn@latest add <component>` so `components.json`
  stays authoritative; don't hand-write files into `ui/`.
- Route-typed prop globals (`PageProps<'/requests/[id]'>`, `LayoutProps<'/'>`)
  come from `next typegen` — run it after adding or renaming a route. `params`,
  `searchParams`, `cookies()` and `headers()` are **async only** in Next 16.
- [CLAUDE.md](CLAUDE.md) carries the working notes for this repo, including the
  version-reality checklist.
