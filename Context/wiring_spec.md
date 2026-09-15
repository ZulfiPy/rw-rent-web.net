# Frontend Wiring Specification

> **Status: OWNER-CONFIRMED — IMPLEMENTATION AUTHORIZED.** The decisions in §2 were taken by the
> owner in the brainstorm of 2026-09-15. The implementation order is `Context/wiring_plan.md`; the
> current report, once it exists, is `Context/wiring_report.md` (one file, rewritten after every
> run); decisions taken after a report go into `Context/wiring_followups.md`, created by the
> reviewer when first needed.
>
> The prototype (design source) is `Context/prototype/RW-Rent.dc.html`.
>
> Working folders of the wiring phase: `/Users/zulf/rw-rent-api/rw-rent-web-wiring` (this app,
> branch `feature/backend-wiring`) and `/Users/zulf/rw-rent-api/RWRentApi-wiring` (the backend,
> branch `feature/backend-wiring`, **read-only** for the frontend agent). The main checkouts
> `rw-rent-web` and `RWRentApi` stay on `main` and untouched.
>
> Created 2026-09-15.

## 1. Objective

Switch the React app from its in-app mock to the real API, adopt the backend's wiring-support
contract so every screen is served in one request per page, and build the account screens the app
never had — all in the app's existing design vocabulary — so the owner can run the wired app against
the seeded database and check every screen and flow on their devices before both branches merge.

The result must:

- keep every reviewed screen exactly as reviewed (layout, vocabulary, behaviour at every tier), with
  real data behind it;
- talk to the API through one transport with cookies and the antiforgery header, and handle a session
  that ends;
- give the app a front door (sign-in) and the account pages the backend already supports;
- leave no mock, no persona switcher and no failure simulator behind.

## 2. Confirmed decisions (owner, 2026-09-15)

1. The mock is retired at the start of the phase: the in-app fake backend (`src/mock`), the
   PROTOTYPE panel with its persona switch and failure simulator (`src/dev`), the mock's own tests
   and the `VITE_API_MODE` switch are removed. The real API with the seeded database is the app's
   only backend, in development and later in production.
2. The sign-in and account screens have no prototype; they follow the app's existing design
   vocabulary and the owner reviews them on their devices after they are built.
3. Development topology: the app at `http://localhost:5173`, the API at `http://localhost:5001`,
   cross-origin with credentials (the backend's CORS is configured for exactly that origin).
4. Nothing merges until the wired app and the wired backend have run together and passed the
   owner's manual check; then both `feature/backend-wiring` branches merge into their `main`.
5. The agent's chat response at the end contains a plain-language overview only. The technical
   report is a file, `Context/wiring_report.md`.
6. Verification of the wired app is functional, per screen, against the seeded dataset (§12), with
   the seed password the owner set when seeding.

## 3. Scope

### 3.1 In scope

- A. The switch: one transport, environment, bootstrap, signed-out state, 401 handling, sign-out — §6.
- B. Contract adoption per screen: the new fields replace every fan-out and mock-only read; the
  cancel field rename; the new vocabulary — §7.
- C. The account area: sign-in, session-ended return, self-registration, the four email-link pages,
  own profile with sessions, access-pending with sign-out — §8–§10.
- D. Mock retirement and its consequences: tests, README, contract folder, dev panel — §11.
- E. Verification and the report — §12–§14.

### 3.2 Preserved behaviour

- Every reviewed screen's layout, vocabulary and behaviour at every tier (desktop 1280/1512/2560,
  iPad 834 portrait and 1194 landscape in both rail states, phone 402).
- The failure model (`src/api/problem.ts`: field, field-code, form, stale, conflict, forbidden,
  unauthorized, unknown) and how dialogs render it.
- Permission gating from `GET /api/me` through `can()`; the Access pending state for an Active user
  without permissions.
- The design tokens and components in `src/ui` and `src/styles`; Europe/Tallinn formatting and the
  UTC panels; row navigation; the shared Dialog (focus, sheets on the phone, the alert block).
- The theme and rail preferences (`rwrent.theme`, `rwrent.nav`).

### 3.3 Out of scope

- Any backend change: the backend worktree is read-only; anything the app needs and the API does
  not offer is reported, never worked around with invented behaviour.
- Production hosting, TLS, cookie domains and the production base URL.
- Tasks and Insurance cases (the placeholders stay as they are).
- New features beyond the listed screens; any visual redesign; MFA.

## 4. Sources of truth

1. This document.
2. The running backend's OpenAPI document, `GET http://localhost:5001/openapi/v1.json` in
   Development, and the backend worktree's code for exact names (read-only). Appendix A carries the
   backend phase's contract deltas verbatim; when the appendix and the live document disagree, the
   live document wins and the disagreement goes into the report.
3. The backend's `Context/business_rules.md` — the rules whose consequences the dialogs describe.
4. The app's own code as the description of the reviewed screens.

## 5. Architectural constraints

- Keep the layering: `src/api` (dto, endpoint functions, transport, problem mapping, query keys),
  `src/permissions`, `src/format`, `src/ui`, `src/pages`, `src/app`. Pages and components import
  from `@/api` only, never from `src/api/http` directly.
- One transport: `createHttpTransport(baseUrl)` from `src/api/http.ts`, installed unconditionally by
  `src/app/bootstrap.ts`. `VITE_API_BASE_URL` is the only environment variable; `.env.development`
  is committed with `http://localhost:5001`; `.env.example` mirrors it; production values are left
  to the hosting decision.
- Every request sends credentials; unsafe requests carry the antiforgery header obtained from
  `GET /api/auth/antiforgery`, refreshed once on the `antiforgery.invalid` code (already implemented
  in `http.ts`; keep it).
- The failure model stays; one global rule is added: a 401 from any request except the sign-in
  request itself puts the app into the signed-out state (§6.4). Implemented once, not per page.
- React Query stays, `qk` stays. After sign-in the cache is cleared and `me` fetched; after sign-out
  the cache is cleared.
- `npm run typecheck` 0 errors, `npx vitest run` green, `npm run build` green at every checkpoint.
- No new runtime dependency; no UI library. TypeScript strict as configured.
- Design: only the existing tokens, components and patterns; standalone screens use the centred
  card of `App.module.css` (`centre`, `card`) as their base; dark and light themes; every tier;
  accessibility as the dialogs have it (labels, `invalidProps` on erroring controls, focus into the
  first field, Escape and focus return where a dialog is used).
- No visual change to a reviewed screen except where a real value replaces a placeholder or a
  derived value.

## 6. The switch (A)

### 6.1 Bootstrap and environment

`bootstrapApi()` installs the http transport and nothing else; the dynamic import of `@/mock` is
gone. `.env.development` (committed) sets `VITE_API_BASE_URL=http://localhost:5001`; `.env.example`
says the same and no longer mentions `VITE_API_MODE`. A missing base URL fails fast at start with a
clear console error.

### 6.2 Session state

`AccessProvider` exposes three states: `loading` (the `me` request in flight), `signed-in` (`me`
loaded), `signed-out` (the `me` request answered 401). `App` renders the public routes (§8) in every
state; a protected route while signed-out redirects to `/sign-in` and remembers the intended path
(router state; same-origin paths only, never a full URL). After sign-in the app returns to that
path or to `/overview`.

### 6.3 Sign-in request

`POST /api/auth/login` with `LoginRequest`; on success the cache is cleared, `me` is fetched and the
navigation of §6.2 happens. The transport's antiforgery handling covers this request like any
unsafe one.

### 6.4 A session that ends

Any query or mutation rejected with status 401 — except the sign-in request — switches the app to
signed-out: the query cache is cleared, the current location is remembered, and the sign-in page
opens with the message "Your session has ended. Sign in again to continue." (the copy the dialog's
unauthorized banner already uses). Implement once in the query client (`QueryCache` /
`MutationCache` error handlers) or in a transport wrapper; the dialog banner for `unauthorized`
stays as a fallback but should no longer be reached.

### 6.5 Sign-out

The shell's Sign out calls `POST /api/auth/logout` (204 even for a stale cookie), clears the cache
and navigates to `/sign-in` without a full page reload.

### 6.6 Removed

The PROTOTYPE pill and panel, the persona switch, the failure simulator, the `rwrent.dev`
localStorage key, `VITE_API_MODE`. Theme and rail preferences stay.

## 7. Contract adoption per screen (B)

Use the JSON names of Appendix A. For every item: what the app does today → what it does after.

### 7.1 Types and endpoint functions

`src/api/dto.ts`: add every member and type of Appendix A (`VehicleAvailability`,
`SystemAdministratorTransferStatus`, `AuthorizedDriverSummary`,
`DriverAuthorizationHistoryItemResponse`, `InterruptionListItemResponse`,
`OverviewSummaryResponse`, the query types), make the formerly optional `FOLLOW-UP` fields
non-optional where the contract says non-null, rename the cancel request member, drop the
mock-only read models and comments. `src/api/*.ts`: `getAuditEntry(id)`,
`listDriverAuthorizations(driverId, query)`, `listInterruptions(query)` (company-wide),
`getOverviewSummary()` (replaces the four probes), `listTransfers(query)` repointed to
`GET /api/system-administrator/transfers`, `listUsers` accepting `Statuses`. The query serializer
passes `Statuses` as the plain string it already produces.

### 7.2 Overview

Counts from `GET /api/overview/summary`; a null count leaves its card out, as today. Recent security
activity from `listSecurityAudit({ PageSize: 5 })`; the mock-only endpoint goes.

### 7.3 Needs attention

Pending registrations as today (`Status=1`, `createdAtUtc` now real). Open interruptions from
`GET /api/interruptions?IsOpen=true` (served oldest first; drop the per-assignment fan-out). Planned
handovers without a driver from the assignments list's `openAuthorizationCount === 0` (drop the
per-assignment authorization fan-out). Same rows, same order, same links as the reviewed queue.

### 7.4 Rental assignments list

Coverage from `openNamedDrivers` (surnames joined), `hasOpenCollectiveAuthorization` →
"Company-authorized drivers", count 0 → "None authorized"; model from `vehicleMake` and
`vehicleModel`; type from `customerType`; the Interrupted chip from `openInterruptionCount`. Drop
the three directory reads and the two per-row fan-outs. Phone cards unchanged.

### 7.5 Assignment record

Parties from `customerType`, `vehicleMake`, `vehicleModel`, `vehicleVinCode` (drop the customer and
vehicle reads); names and licences on authorizations from `driverFirstName`, `driverLastName`,
`driverLicenseNumber` (drop the driver reads); "The customer will drive" from `customerDriverId`.
Notes panel: two facts, "Assignment note" (`note`) and "Cancellation note" (`cancellationNote`),
"—" when null. Cancel dialog: sends `cancellationNote`; field-error key `cancellationNote`; labels
unchanged. Corrections tab: history from `listSecurityAudit({ RentalAssignmentId: id, PageSize: 100 })`
(drop the client-side filter); it now includes `RentalAssignment.Cancelled` entries, labelled per
§7.11.

### 7.6 Vehicles list and record

Availability from `availability` with `currentCustomerDisplayName`, `upcomingCustomerDisplayName`
and `upcomingPlannedStartAtUtc` (drop the active-assignments read). Labels and tones as reviewed:
Retired (mute), In use (info) with the customer, Reserved (warn) with the customer and the planned
start, Available (ok). The "In the fleet" fallback disappears (the value is always present). The
record shows the same facts.

### 7.7 Drivers list and record

`personalId`, `driverLicenseNumber`, `address` are real values ("—" only for a null `personalId`).
The driver record's history from `GET /api/drivers/{id}/authorizations` (drop the per-assignment
fan-out); the table and the phone cards read vehicle, customer and status from the item itself.

### 7.8 Customers and Company profile

Unchanged; verify against the seeded data.

### 7.9 User directory, user record, Registrations

`createdAtUtc` is real everywhere. `registrationDecisionReason` is shown where the mock showed it.
Registrations "All lifecycle states" is one request, `Statuses=1,4,5`, with server-side paging
(drop the per-status fan-out and the client-side merge); the single-status filter is unchanged.

### 7.10 Security audit

List filters unchanged. The entry page reads `GET /api/security-audit/{id}` (drop the 100-row
fetch); a 404 renders the existing "That entry is not available" state. The payload diff keeps its
PascalCase rule but parses the JSON and never depends on key order or exact text.

### 7.11 Vocabulary

`AUDIT_EVENTS` and `ENTITY_LABEL` in `src/format/labels.ts` are reconciled with the strings the
backend actually writes (enumerate them from the backend worktree, read-only): every event type
(`Authentication.*`, `Registration.*`, `RoleAssignment.*`, `Session.*`, `SystemAdministrator.*`,
`ApplicationUser.*`, `Company.*`, `RentalAssignment.*` including `RentalAssignment.Cancelled`,
`DriverAuthorization.Corrected`, `Interruption.Corrected`) gets a label in the existing
"Entity · Action" style; entity labels include `ApplicationUserSession` → "Session",
`ApplicationUserRoleAssignment` → "Role assignment", `AssignmentDriverAuthorization` → "Driver
authorization", `AssignmentInterruption` → "Interruption" beside the existing ones. An unknown
string renders as itself, never blank. The event filter of the audit list offers the reconciled
list.

### 7.12 System Administrator page

Transfers from `GET /api/system-administrator/transfers` (paged, newest first) with `targetEmail`,
`targetFirstName`, `targetLastName` (drop the directory lookup) and `status` (drop the client-side
derivation): 1 Awaiting acceptance (warn), 2 Accepted (ok), 3 Cancelled (mute), 4 Expired (mute,
new visible state). Initiate, resend and cancel unchanged.

## 8. Account area — shared design (C)

> **Correction (2026-09-15, Follow-up 1 in `Context/wiring_followups.md`).** This section and
> §9–§10 were written on the wrong premise that the prototype had no account screens. It has them:
> an authentication family of sixteen states, "Your account" with three tabs and "Access
> pending", in `Context/prototype/RW-Rent.dc.html`. The layout and copy guidance below is
> superseded by the prototype — port, don't recreate. The routes, API calls, outcomes and flows
> described in §8–§10 remain valid.

- Standalone screens outside the shell: the centred card of `App.module.css` on the page background,
  a maximum width around 420px, the app's Field / Button / note vocabulary, the title in the display
  face, one primary action, secondary actions as text links; dark and light themes; on the phone a
  full-width card with the app's 16px gutters; no illustrations.
- Copy: plain sentences, no exclamation marks; field errors under their fields through
  `invalidProps`; form-level messages in the same alert block the dialogs use.
- Every public page handles: success; field errors from the validator; the neutral "check your
  email" outcome (registration, resend and reset requests answer 202 whatever the account state —
  the API never reveals whether an email exists); an invalid or expired link (a coded 400) with a way
  to request a new one; rate limiting (429 → "Too many attempts. Try again in a minute.").
- Routes, exactly as the backend's emails link to them: `/sign-in`, `/register`,
  `/confirm-registration-email`, `/reset-password`, `/confirm-email-change`,
  `/accept-administrator-transfer`. The token is `location.hash` without the `#`, URL-decoded, read
  once and removed from the address bar with `history.replaceState` so it does not stay in history.
  `/profile` lives inside the shell.

## 9. Sign-in and session (C)

### 9.1 `/sign-in`

Email and password; Sign in → `POST /api/auth/login`. Success → §6.3. Failures: 401 (unknown email,
wrong password, lockout — all the same coded answer) → the API's `detail` as the form message; 403
coded outcomes after correct password proof (unconfirmed, confirmed-pending, rejected, expired,
suspended) → the API's `detail` as the form message, and for the unconfirmed case an extra action
"Resend the confirmation email" that calls `POST /api/registrations/email-confirmation/resend` with
the typed email and password; 429 → the rate-limit message. Links: "Forgot your password" →
`/reset-password`; "Create an account" → `/register`. When reached because a session ended, the
page shows that message above the form.

### 9.2 Access pending

The existing screen for an Active user without permissions stays; it gains Sign out and a link to
`/profile` (self-service is allowed for such a user).

### 9.3 Shell

The user block in the shell gains two actions: Profile (`/profile`) and Sign out (§6.5).

## 10. Registration, email links, profile (C)

### 10.1 `/register`

First name, last name, phone, email, password with the policy stated under the field (at least 12
characters with an uppercase letter, a digit and a symbol; spaces allowed) and a confirmation field
checked client-side. Submit → `POST /api/registrations` → 202 → a "Check your email" screen with a
resend form (email and password). Validator field errors per field.

### 10.2 `/confirm-registration-email`

Reads the token and calls `POST /api/registrations/email-confirmation/complete`. Success: "Your
email is confirmed. An administrator will activate your account." with a link to sign-in. Expired or
invalid: the message and the resend form.

### 10.3 `/reset-password`

Without a token: the request form (email) → `POST /api/auth/password-reset/request` → "If the
address is known, an email with a link is on its way." With a token: new password and confirmation
→ `POST /api/auth/password-reset/complete` → "Your password is changed. Sign in again." → link to
`/sign-in`. Expired or invalid token: the message and the request form.

### 10.4 `/confirm-email-change`

Requires a signed-in session (the endpoint is under `/api/me`); when signed out the page sends to
sign-in with itself as the return path and keeps the token in memory. Calls
`POST /api/me/email-change/confirm`; success: "Your email is changed." and the profile reloads;
expired or invalid: the message and a link to the profile.

### 10.5 `/accept-administrator-transfer`

Token plus the target's own password → `POST /api/system-administrator/transfers/accept`. Success:
"You are now the System Administrator. Sign in to continue." → `/sign-in`. Failure: the API's
`detail`.

### 10.6 `/profile`

Inside the shell, available to every signed-in user including access-pending ones. Panels in the
record vocabulary:

- Account: first and last name read-only with the note "Names are corrected by an administrator";
  email read-only; phone editable → `PUT /api/me/phone` (field errors inline).
- Password: current, new, confirmation → `POST /api/me/password`; success note that other sessions
  were signed out.
- Email: new email and current password → `POST /api/me/email-change`; success: "Confirm the change
  through the link we sent to the new address."
- Sessions: own sessions from `GET /api/me/sessions?IncludeEnded=true` in the user record's Sessions
  vocabulary (Started, Last seen, device, revoked reason, a "This session" marker), Revoke per row
  (`DELETE /api/me/sessions/{id}`, not offered for the current one), and "Sign out other sessions"
  (`POST /api/me/sessions/revoke-others`), each behind the shared confirmation Dialog.

## 11. Mock retirement (D)

Delete `src/mock/**` and `src/dev/**` including their tests; rewrite `src/permissions/can.test.ts`
without the mock's persona table (an inline permission list); remove `contract/business_rules.md`
and the `contract` folder (the rules live in the backend; the README links there); `App.tsx` drops
the DevPanel; `main.tsx` unchanged. README rewritten: title "RW-Rent web"; how to run (the backend
first — compose from the backend's main folder, migrations, the seed command, the API with the
`http` profile — then `npm run dev` on port 5173); the seeded sign-in accounts and where the seed
password comes from; the layout section kept; "Rules the code enforces" reduced to what the app
still does (failures, time, permissions, audit payload reading); the sections "The swap point",
"Not in swagger", "Asks for the backend", "Backend follow-ups", "Seed", "State of the port" and
"Known gaps against the prototype" removed; the sheet-tier section kept. The `dto.ts` header names
the live OpenAPI document. `github.md` reviewed for mock mentions.

## 12. Verification (E)

### 12.1 The agent's own checks before the report

`npm run typecheck`, `npx vitest run`, `npm run build`; the app started against the seeded API;
every route opened as the seeded administrator with no console errors and no failed request; the
flows driven once end to end through Mailpit (`http://localhost:8025`): register a new person →
confirm through the email link → activate them on the Registrations page → sign in as them; request
and complete a password reset; change the phone; change the password; revoke a session; sign out
and sign in again; a session-ended simulation (revoke the current session from another browser or
let the backend's rules do it) → the sign-in page with the message and the return to the page. The
seeded transfer is not accepted by the agent (it changes the dataset); re-seed with `--replace true`
if anything was changed by the checks. The new screens are checked at 1512, 834 and 402 in both
themes (headless or devtools) for overflow and cut text.

### 12.2 The owner's per-screen list

The report carries a table the owner works through on their devices: screen → what to compare with
the mock's rendering → actions to try, for three seeded accounts (the administrator, a Company
Principal, a Viewer; the agent lists their emails from the backend's `DevelopmentSampleData`,
read-only). Re-seed before a session, because the seeded dates drift.

## 13. Acceptance criteria

- Start: with the API running and seeded, `npm run dev` opens `/sign-in`; signing in as the
  administrator shows the Overview with the seeded counts; every route of the app renders without
  console errors; signing out returns to `/sign-in`; opening a protected route while signed out
  redirects to `/sign-in` and, after signing in, lands on that route.
- Session ended: a 401 on any request switches to the sign-in page with the message and returns
  afterwards.
- Screens: each item of §7 is observable — the assignments list and record, the vehicles list, the
  driver record, Needs attention, the Overview, Registrations "All lifecycle states", the audit entry
  page, the transfers table — with the network tab showing one list request per page and no
  per-row requests.
- Cancel: cancelling sends `cancellationNote`; an Active cancellation without a note shows the error
  under that field; the record shows both notes.
- Vocabulary: no event or entity type from the seeded audit renders blank or as a raw string the
  app already knows.
- Account area: every flow of §12.1 passes; every public page handles the neutral, error, expired
  and rate-limit outcomes; the profile's four panels work; the screens hold at 1512, 834 and 402 in
  both themes.
- Retirement: no file under `src/mock` or `src/dev`; no `VITE_API_MODE`; the README describes the
  wired app; typecheck, tests and build green.

## 14. Report and definition of done

`Context/wiring_report.md`, one file, in eleven sections: 1 Summary (commit range, what runs);
2 Implemented (per §6–§11, with the owner's per-screen verification table of §12.2 and the seeded
accounts); 3 Not implemented or partial (what, why, the side that has to change — backend, frontend,
owner — and a proposed option; "None" if empty); 4 Decisions needed (one decision per question,
plain-language context first; "None" if empty); 5 Contract usage (which endpoint each screen now
uses); 6 Removed (files, sections, variables); 7 How to run (exact steps for the owner);
8 Verification results (the checks of §12.1 with their outcome); 9 Test and build results
(commands and summary lines); 10 Deviations from this specification; 11 Open risks.

The agent's final chat message is a plain-language overview of what was done and what was not,
for the owner, without the technical report.

Done means: §13 holds; the report exists; the branch is pushed; the working tree is clean; the
owner has the per-screen list to start their manual check.

## Appendix A — Contract deltas of the backend phase (verbatim from the backend's report §5)

Additions after that table, from the backend follow-ups: every cancellation writes a
`RentalAssignment.Cancelled` audit entry (reason = the cancellation note; payload keys `Status`,
`ClosedAtUtc`, `CancellationNote`); privileged-correction and cancellation entries carry the
operating Company; audit payload keys are PascalCase at every nesting level.


| Endpoint or type | Member | JSON name | Type | Nullability | Permission | Spec |
|---|---|---|---|---|---|---|
| `GET /api/security-audit/{id}` (new) | — | — | `SecurityAuditResponse`; 404 `security_audit.not_found` | — | `SecurityAudit.ReadCompany` (ReadAll sees all) | §9.1 |
| `GET /api/drivers/{id}/authorizations` (new) | — | `IsOpen`, paging | `PagedResponse<DriverAuthorizationHistoryItemResponse>`; 404 `drivers.not_found`; 400 on `Search` | — | `DriverAuthorizations.Read` | §8.2 |
| `GET /api/interruptions` (new) | — | `IsOpen`, `RentalAssignmentId`, `AssignmentStatus`, paging | `PagedResponse<InterruptionListItemResponse>`; 400 on `Search` | — | `Interruptions.Read` | §12 |
| `GET /api/overview/summary` (new) | — | — | `OverviewSummaryResponse` | — | authenticated | §13 |
| `GET /api/system-administrator/transfers` (new) | — | paging | `PagedResponse<SystemAdministratorTransferResponse>`; 400 on `Search` | — | `SystemAdministration.Transfer` | §14 |
| `ApplicationUserListItemResponse` | `CreatedAtUtc` | `createdAtUtc` | `DateTimeOffset` | no | `Users.ReadDirectory` | §7.1 |
| `ApplicationUserResponse` | `RegistrationDecisionReason` | `registrationDecisionReason` | `string` | yes (never decided) | `Users.ReadDirectory` | §7.2 |
| `ApplicationUserQuery` | `Statuses` | `Statuses` (query) | `string`, comma-separated numeric statuses, ≤ 5 | optional | `Users.ReadDirectory` | §7.3 |
| `DriverListItemResponse` | `PersonalId` | `personalId` | `string` | yes | `Drivers.Read` | §8.1 |
| `DriverListItemResponse` | `DriverLicenseNumber` | `driverLicenseNumber` | `string` | no | `Drivers.Read` | §8.1 |
| `DriverListItemResponse` | `Address` | `address` | `string` | no | `Drivers.Read` | §8.1 |
| `DriverAuthorizationHistoryItemResponse` (new, derives from `AssignmentDriverAuthorizationResponse`) | `AssignmentStatus`, `VehicleId`, `VehiclePlateNumber`, `VehicleMake`, `VehicleModel`, `CustomerId`, `CustomerDisplayName`, `CustomerType` | camelCase of the same | `AssignmentStatus`, `Guid`, `string`, `string`, `string`, `Guid`, `string`, `CustomerType` | no | `DriverAuthorizations.Read` | §8.2 |
| `DriverAuthorizationsQuery` (new) | `IsOpen` | `IsOpen` (query) | `bool` | optional | — | §8.2 |
| `SecurityAuditQuery` | `EntityType` | `EntityType` (query) | `string`, exact, ≤ 150 | optional | — | §9.2 |
| `SecurityAuditQuery` | `EntityId` | `EntityId` (query) | `Guid` | optional | — | §9.2 |
| `SecurityAuditQuery` | `RentalAssignmentId` | `RentalAssignmentId` (query) | `Guid` (assignment + its authorizations and interruptions) | optional | — | §9.2 |
| Audit event type (new) | `RentalAssignment.Cancelled` | `eventType` value | `string`; entity type `RentalAssignment`, entity id the assignment, Company the operating Company, reason the cancellation note, payload keys `Status` / `ClosedAtUtc` / `CancellationNote` | — | read with `SecurityAudit.ReadCompany` | follow-up 1 F1 |
| Audit payloads (all event types) | `BeforeJson`, `AfterJson` | `beforeJson`, `afterJson` | JSON text with PascalCase property names at **every** nesting level (was camelCase below the top level) | unchanged | unchanged | follow-up 1 F2 |
| Audit entries of the four `…Corrected` correction event types | `CompanyId` | `companyId` | `Guid`, now the operating Company (was null) | no (was always null) | visible to `SecurityAudit.ReadCompany` | follow-up 2 F6 |
| `RentalAssignmentListItemResponse` | `CustomerType` | `customerType` | `CustomerType` | no | `RentalAssignments.Read` | §10.1 |
| `RentalAssignmentListItemResponse` | `VehicleMake`, `VehicleModel` | `vehicleMake`, `vehicleModel` | `string` | no | `RentalAssignments.Read` | §10.1 |
| `RentalAssignmentListItemResponse` | `OpenAuthorizationCount` | `openAuthorizationCount` | `int` | no | `RentalAssignments.Read` | §10.1 |
| `RentalAssignmentListItemResponse` | `OpenNamedDrivers` | `openNamedDrivers` | `AuthorizedDriverSummary[]` (`driverId`, `firstName`, `lastName`) | no (empty array) | `RentalAssignments.Read` | §10.1 |
| `RentalAssignmentListItemResponse` | `HasOpenCollectiveAuthorization` | `hasOpenCollectiveAuthorization` | `bool` | no | `RentalAssignments.Read` | §10.1 |
| `RentalAssignmentListItemResponse` | `OpenInterruptionCount` | `openInterruptionCount` | `int` | no | `RentalAssignments.Read` | §10.1 |
| `RentalAssignmentResponse` | `CustomerType` | `customerType` | `CustomerType` | no | `RentalAssignments.Read` | §10.2 |
| `RentalAssignmentResponse` | `VehicleMake`, `VehicleModel`, `VehicleVinCode` | `vehicleMake`, `vehicleModel`, `vehicleVinCode` | `string` | no | `RentalAssignments.Read` | §10.2 |
| `RentalAssignmentResponse` | `CustomerDriverId` | `customerDriverId` | `Guid` | yes (business or unlinked private customer) | `RentalAssignments.Read` | §10.2 |
| `RentalAssignmentResponse` | `CancellationNote` | `cancellationNote` | `string` | yes (not cancelled) | `RentalAssignments.Read` | §10.4 |
| `AssignmentDriverAuthorizationResponse` (now unsealed) | `DriverFirstName`, `DriverLastName`, `DriverLicenseNumber` | `driverFirstName`, `driverLastName`, `driverLicenseNumber` | `string` | yes (collective) | `DriverAuthorizations.Read` / `RentalAssignments.Read` | §10.3 |
| `CancelRentalAssignmentRequest` (rename) | `Note` → `CancellationNote` | `note` → `cancellationNote` | `string` | optional when Planned, required when Active (400 on `CancellationNote`) | `RentalAssignments.Manage` | §10.4 |
| `VehicleListItemResponse`, `VehicleResponse` | `Availability` | `availability` | `VehicleAvailability` (1 Available, 2 InUse, 3 Reserved, 4 Retired) | no | `Vehicles.Read` | §11 |
| `VehicleListItemResponse`, `VehicleResponse` | `CurrentAssignmentId`, `CurrentCustomerDisplayName` | `currentAssignmentId`, `currentCustomerDisplayName` | `Guid`, `string` | yes (no Active assignment) | `Vehicles.Read` | §11 |
| `VehicleListItemResponse`, `VehicleResponse` | `UpcomingAssignmentId`, `UpcomingCustomerDisplayName`, `UpcomingPlannedStartAtUtc` | `upcomingAssignmentId`, `upcomingCustomerDisplayName`, `upcomingPlannedStartAtUtc` | `Guid`, `string`, `DateTimeOffset` | yes (no Planned assignment) | `Vehicles.Read` | §11 |
| `InterruptionListItemResponse` (new, derives from `AssignmentInterruptionResponse`) | `AssignmentStatus`, `VehicleId`, `VehiclePlateNumber`, `VehicleMake`, `VehicleModel`, `CustomerId`, `CustomerDisplayName` | camelCase of the same | `AssignmentStatus`, `Guid`, `string` × 3, `Guid`, `string` | no | `Interruptions.Read` | §12 |
| `InterruptionsQuery` (new) | `IsOpen`, `RentalAssignmentId`, `AssignmentStatus` | same (query) | `bool`, `Guid`, `AssignmentStatus` | optional | — | §12 |
| `OverviewSummaryResponse` (new) | `ActiveAssignments`, `PlannedAssignments`, `ActiveVehicles`, `PendingRegistrations` | camelCase of the same | `int` | yes (permission missing) | authenticated | §13 |
| `SystemAdministratorTransferResponse` | `TargetEmail`, `TargetFirstName`, `TargetLastName` | `targetEmail`, `targetFirstName`, `targetLastName` | `string` | no | `SystemAdministration.Transfer` | §14 |
| `SystemAdministratorTransferResponse` | `Status` | `status` | `SystemAdministratorTransferStatus` (1 AwaitingAcceptance, 2 Accepted, 3 Cancelled, 4 Expired) | no | `SystemAdministration.Transfer` | §14 |
| `SystemAdministratorTransferQuery` (new) | — | paging | `PageQuery` without extra members | — | — | §14 |
| Configuration | `ApiSecurity:FrontendOrigin`, `EmailDelivery:FrontendBaseUrl` | — | `http://localhost:5173` (Development only) | — | — | §15 |
| Command | `seed-development-data --password <v> [--replace true]` | — | exit 0 with count lines, 2 when refused | — | Development host only | §16 |
| Schema | `rental_assignments.cancellation_note` | — | `text` | yes | — | §17 |

Enums stay numeric with `x-enumNames`; every new endpoint carries a summary, a description, typed
responses and `x-required-permissions` where a policy applies; `Search` on the three fixed-order
endpoints answers 400 on `Search` when non-empty and `SortBy` is documented as ignored. The three
follow-up rows are data, not schema: the runtime OpenAPI document is unchanged by both follow-ups,
because an audit event type and the value of an existing `companyId` field are content, and the
payload columns are opaque JSON text in the contract.

