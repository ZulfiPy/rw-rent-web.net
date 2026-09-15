# Frontend Wiring Implementation Plan

> **Status: READY FOR IMPLEMENTATION.** Derived from `Context/wiring_spec.md` (owner-confirmed
> 2026-09-15). The implementation agent follows this plan phase by phase and ends with the report
> of §9 and a plain-language chat overview.
>
> Created 2026-09-15.

## 1. Objective and sources of truth

Implement the frontend wiring specification on branch `feature/backend-wiring` in the worktree
`/Users/zulf/rw-rent-api/rw-rent-web-wiring`: retire the mock, switch the app to the real API,
adopt the wiring-support contract screen by screen, build the account area, verify against the
seeded database, report.

Documents, in order of authority: `Context/wiring_spec.md`; the running backend's OpenAPI document
and the backend worktree's code (read-only); the backend's `Context/business_rules.md`; this plan;
the app's README (rewritten by this phase).

**Working folders.** This app: `/Users/zulf/rw-rent-api/rw-rent-web-wiring`. The backend:
`/Users/zulf/rw-rent-api/RWRentApi-wiring`, read-only — run it, read it, never change it. The main
checkouts `rw-rent-web` and `RWRentApi` are not touched.

**Blocked-item rule.** When something cannot be implemented as specified — the API lacks something,
a rule contradicts the screen, a design question has no answer in the vocabulary — do not stop and
do not invent a different behaviour. Implement everything that does not depend on it, record the
item in the report (§9, section 3) with the reason, the side that has to change (backend, frontend,
owner) and a proposed option, and continue. When the spec and the live API disagree, the live API
wins and the disagreement goes into the report.

## 2. Implementation scope

| Deliverable | Spec | Phase |
|---|---|---|
| A. The switch: transport, environment, session state, 401, sign-out | §6 | 1 |
| C1. Sign-in page, access pending, shell actions | §8, §9 | 1 |
| D. Mock retirement, tests, README skeleton | §11 | 2 |
| B1. Types and endpoint functions | §7.1 | 3 |
| B2. Screens: Overview, Needs attention, assignments, vehicles, drivers, users, audit, transfers, vocabulary | §7.2–7.12 | 4 |
| C2. Registration, email-link pages, reset, transfer acceptance | §8, §10.1–10.5 | 5 |
| C3. Profile with sessions | §10.6 | 6 |
| E. Verification, README final, report | §12–§14 | 7 |

## 3. Current implementation baseline (2026-09-15)

- Branch `feature/backend-wiring` at the tip of `main` (`db8a9b5`: checklist and swagger copy
  removed) plus this plan and the spec. Stack: React, Vite, TypeScript strict, `@tanstack/react-query`,
  `react-router-dom`; scripts `dev`, `build` (`tsc -b && vite build`), `typecheck`, `test` (vitest).
- Tests: 7 files — `src/api/problem.test.ts`, `src/format/datetime.test.ts`,
  `src/permissions/can.test.ts` (imports the mock's persona table), `src/mock/{admin,audit,fleet,transport}.test.ts`.
- The mock: `src/mock/**` (store, seed, handlers, failures, personas), `src/dev/**` (DevPanel,
  devState); `src/app/bootstrap.ts` chooses by `VITE_API_MODE`; `App.tsx` renders `DevPanel` in dev.
- Transport: `src/api/http.ts` (credentials, antiforgery fetch and one retry, `ApiError` on
  non-2xx, 204 → undefined) — written for this phase, never run against the real API.
- Session: `src/permissions/usePermissions.tsx` loads `GET /api/me` once; no signed-out state; the
  shell's Sign out calls logout and reloads the page.
- Routes: `src/App.tsx` (all under `AppShell`; `*` → `/overview`); Access pending screen inline.
- Vocabulary: `src/format/labels.ts` (`AUDIT_EVENTS`, `ENTITY_LABEL`, status and enum labels).
- The backend to run alongside (from the backend worktree, with the environment described in its
  README §"Local prerequisites" and the `.env` of `/Users/zulf/rw-rent-api/RWRentApi`):

  ```sh
  cd /Users/zulf/rw-rent-api/RWRentApi && docker compose up -d postgres mailpit
  set -a; source /Users/zulf/rw-rent-api/RWRentApi/.env; set +a
  export ConnectionStrings__DefaultConnection="Host=localhost;Port=5433;Database=rwrent_v1;Username=rwrent;Password=${RWRENT_POSTGRES_PASSWORD}"
  export EmailDelivery__FromAddress="dev@rwrent.local"
  cd /Users/zulf/rw-rent-api/RWRentApi-wiring
  dotnet run --project src/RWRentApi.Api -- seed-development-data --password '<the owner's seed password>' --replace true   # only when re-seeding
  dotnet run --project src/RWRentApi.Api --launch-profile http                                                             # API on http://localhost:5001
  ```

  Mailpit UI: `http://localhost:8025`. The app: `npm run dev -- --port 5173 --strictPort`.
  The seed password is the owner's; ask for it if it is not in the environment.

## 4. Guardrails

- Layering and one transport as spec §5; pages import from `@/api` only.
- Never edit the backend worktree or the main checkouts; never run docker compose from anywhere
  but `/Users/zulf/rw-rent-api/RWRentApi`.
- Commits: one per phase, message prefix `Wiring N:`; push after each phase; no force pushes.
- At every checkpoint: `npm run typecheck` 0 errors, `npx vitest run` green, `npm run build` green.
- Reviewed screens keep their markup and CSS; changes are limited to data sources and to the fields
  spec §7 names. New screens use only the existing tokens, components and patterns.
- New screens are checked at 1512, 834 and 402 in dark and light before their phase closes
  (headless Chrome or devtools): no horizontal overflow, no cut text, focus visible.
- Accessibility as the dialogs: labels, `invalidProps`, focus management.
- No new runtime dependency.
- Tests: keep `problem.test.ts`, `datetime.test.ts`; rewrite `can.test.ts`; add unit tests for the
  http transport (fetch mocked: credentials, antiforgery header and retry, 401 mapping), the
  session-state reducer/handler, the token reader, the availability and transfer-status labels, the
  event-label reconciliation (every backend event string has a label).

## 5. Target surface

### 5.1 Routes added

`/sign-in`, `/register`, `/confirm-registration-email`, `/reset-password`, `/confirm-email-change`,
`/accept-administrator-transfer` (public, outside the shell); `/profile` (inside the shell).

### 5.2 API functions added or changed

`auth.login/logout` (used), `me.*` (used), `registrations.*` (used), `securityAudit.getEntry`,
`drivers.listAuthorizations`, `interruptions.listCompanyWide`, `overview.getSummary` (replaces the
probes and the mock-only feed), `systemAdministrator.listTransfers` (repointed), `users.listUsers`
with `Statuses`, `assignments.cancelAssignment` with `cancellationNote`.

### 5.3 Removed

`src/mock/**`, `src/dev/**`, `contract/**`, `VITE_API_MODE`, the DevPanel render, the mock-only
read models in `dto.ts`, the README sections listed in spec §11.

## 6. Ordered implementation phases

Each phase ends with its checkpoint green, one commit, one push. A blocked item follows §1's rule.

### Phase 0 — baseline and the backend running

1. `git status` clean; `npm ci`; `npm run typecheck`; `npx vitest run` (record 88 or the current
   count); `npm run build`.
2. Start the backend per §3; `curl http://localhost:5001/health` → healthy; confirm the database is
   seeded (`GET /api/users` needs a session — check through the seed's count lines or ask the owner
   to run the seed); open `http://localhost:5001/openapi/v1.json` and keep it as the contract.

Checkpoint: app builds, API healthy, seeded. Commit `Wiring 0: …` (only if anything changed).

### Phase 1 — the switch and the front door (spec §6, §8, §9)

1. `src/app/bootstrap.ts`: http transport only; `.env.development`, `.env.example`.
2. `src/permissions/usePermissions.tsx`: the three-state session; `src/app/session.ts` (or similar):
   the 401 handler wired into the query client in `main.tsx`; the return path.
3. `src/pages/account/SignIn.tsx` (+ module CSS on the `App.module.css` centre/card base):
   spec §9.1 including the 403 outcomes and the resend action; `src/App.tsx`: public routes outside
   the shell, protected routes redirecting when signed out.
4. Access pending gains Sign out and Profile link; the shell's user block gains Profile and Sign out
   (§6.5 without reload).
5. Tests: transport, session handler.

Checkpoint: sign in as the seeded administrator → Overview with real counts (the four probes still
in place at this point are fine); every existing route opens; sign out → `/sign-in`; a revoked
session → the session-ended message. Commit `Wiring 1: …`.

### Phase 2 — mock retirement (spec §11)

1. Delete `src/mock`, `src/dev`, `contract`; rewrite `can.test.ts`; `App.tsx` without DevPanel;
   remove `VITE_API_MODE` mentions; README skeleton (title, how to run, accounts) — the full
   rewrite lands in Phase 7.

Checkpoint: typecheck, tests, build green; the app runs exactly as after Phase 1. Commit
`Wiring 2: …`.

### Phase 3 — types and endpoint functions (spec §7.1)

1. `dto.ts` from the live OpenAPI document (Appendix A as the checklist); endpoint functions; query
   keys for the new reads; the cancel rename at the type level.

Checkpoint: typecheck green (call sites may still use old shapes only where Phase 4 changes them —
prefer adapting call sites in Phase 4, keep Phase 3 compiling). Commit `Wiring 3: …`.

### Phase 4 — screens (spec §7.2–§7.12)

Work screen by screen, each verified in the browser against the seeded data before the next:
Overview → Needs attention → Rental assignments list → Assignment record (Parties, authorizations,
Notes, Cancel dialog, Corrections history) → Vehicles list and record → Drivers list and record →
User directory, user record, Registrations → Security audit list and entry → System Administrator
transfers → `labels.ts` reconciliation.

Checkpoint: for each screen, the network tab shows one list request per page and no per-row
requests; the rendering matches the reviewed screen with the seeded data; typecheck, tests, build
green. Commit `Wiring 4: …` (one commit for the phase; intermediate commits allowed with the same
prefix).

### Phase 5 — registration, email links, reset, transfer acceptance (spec §10.1–§10.5)

1. `src/pages/account/{Register,ConfirmRegistrationEmail,ResetPassword,ConfirmEmailChange,AcceptAdministratorTransfer}.tsx`
   on the shared account layout; the token reader; the neutral / error / expired / rate-limit
   outcomes.
2. Driven once through Mailpit (spec §12.1).

Checkpoint: the flows pass; the screens hold at 1512, 834 and 402 in both themes. Commit
`Wiring 5: …`.

### Phase 6 — profile and sessions (spec §10.6)

1. `src/pages/account/Profile.tsx` with the four panels; the shared Dialog for confirmations; the
   Sessions panel in the user record's vocabulary.

Checkpoint: phone change, password change (with the "other sessions signed out" note), email change
request, session revoke and revoke-others work against the API; tiers and themes hold. Commit
`Wiring 6: …`.

### Phase 7 — verification, README, report (spec §12–§14)

1. The checks of spec §12.1, all of them, with outcomes noted.
2. README rewritten per spec §11; `github.md` reviewed.
3. `Context/wiring_report.md` in the format of §9 below, including the owner's per-screen table and
   the seeded accounts.

Checkpoint: spec §13 holds; branch pushed; working tree clean. Commit `Wiring 7: …`.

## 7. Concrete file-impact map

- `src/app/bootstrap.ts`, `src/app/AppShell.tsx` (+ module CSS), new `src/app/session.ts`;
  `src/main.tsx` (query client error handlers).
- `src/permissions/usePermissions.tsx`, `src/permissions/can.test.ts`.
- `src/api/dto.ts`, `src/api/{overview,securityAudit,drivers,interruptions,users,systemAdministrator,rentalAssignments}.ts`,
  `src/api/queryKeys.ts`, `src/api/http.ts` (only if the 401 hook lives there), new
  `src/api/http.test.ts`.
- `src/App.tsx` (routes, public layout), `src/App.module.css` (shared account card base).
- New `src/pages/account/**` (SignIn, Register, ConfirmRegistrationEmail, ResetPassword,
  ConfirmEmailChange, AcceptAdministratorTransfer, Profile, a shared `AccountLayout`).
- `src/pages/overview/{Overview,NeedsAttention,useOpenWork}.tsx`,
  `src/pages/fleet/{Assignments,AssignmentRecord,AssignmentDialogs,Vehicles,VehicleRecord,Drivers,DriverRecord}.tsx`,
  `src/pages/users/{UserDirectory,UserRecord}.tsx`, `src/pages/registrations/Registrations.tsx`,
  `src/pages/audit/{SecurityAudit,AuditEntry}.tsx`, `src/pages/admin/SystemAdministrator.tsx`.
- `src/format/labels.ts` (+ a test).
- Deleted: `src/mock/**`, `src/dev/**`, `contract/**`.
- `README.md`, `github.md`, `.env.example`, new `.env.development`.
- New `Context/wiring_report.md`.

## 8. Implementation traceability

| Spec | Phase | Proof |
|---|---|---|
| §6 | 1 | transport and session tests; sign-in / sign-out / session-ended checks |
| §9 | 1 | sign-in outcomes (401, 403 kinds, 429) checked against the API |
| §11 | 2, 7 | no mock files; README |
| §7.1 | 3 | typecheck against the live document |
| §7.2–7.12 | 4 | per-screen network and rendering checks; labels test |
| §10.1–10.5 | 5 | Mailpit-driven flows |
| §10.6 | 6 | profile flows |
| §12–§14 | 7 | the report |

## 9. Completion criteria and the report

Done means spec §14 holds. The report `Context/wiring_report.md` has these eleven sections, in
this order: 1 Summary; 2 Implemented (with the owner's per-screen verification table and the seeded
accounts with their roles); 3 Not implemented or partial; 4 Decisions needed (one decision per
question, plain-language context first); 5 Contract usage per screen; 6 Removed; 7 How to run;
8 Verification results (spec §12.1 items with outcomes); 9 Test and build results (commands and
summary lines); 10 Deviations from the specification; 11 Open risks.

The agent's final chat message is a plain-language overview for the owner — what was done, what
was not and why, what the owner should check first — without the technical report, which stays in
the file. There is only ever one report file; a later run rewrites it completely and never adds a
second one.
