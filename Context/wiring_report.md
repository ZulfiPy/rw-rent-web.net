# Frontend Wiring Implementation Report

> App `rw-rent-web`, worktree `/Users/zulf/rw-rent-api/rw-rent-web-wiring`, branch
> `feature/backend-wiring`. Implements `Context/wiring_spec.md` in the order of
> `Context/wiring_plan.md`, against the backend's own `feature/backend-wiring` worktree, which was
> read and run but never changed. Written 2026-09-15. One report file; a later run rewrites it.

## 1. Summary

The app no longer has a fake backend. It talks to the real API at `http://localhost:5001` with
cookies and the antiforgery header, it has a front door and an account area it never had, and every
screen is served by the request it already made — no screen fans out per row any more. The mock,
the PROTOTYPE panel with its persona switch and failure simulator, the copy of the business rules
and the mode switch are deleted.

Commits `2a2cece` (Wiring 1) … the `Wiring 7` commit, on top of `850eb1f`. Test count went from 88
(56 of them the mock's own) to 60, all of them about the app: the transport, the session signal, the
account failure mapper, the token reader, the audit vocabulary, the failure envelope, the formatting
and the permission gate. `npm run typecheck`, `npx vitest run` and `npm run build` are green.

Verified live against the seeded database: signed in as the seeded administrator, opened every route
with no console error and no failed request, registered a new person and took them through
confirmation, activation and sign-in, reset a password, changed a phone, a password and an email
address, revoked a session and signed the others out, and watched a revoked session turn into the
sign-in page with its message and a return to the page it left.

## 2. Implemented

**A. The switch (spec §6).** `bootstrapApi()` installs the http transport and nothing else;
`.env.development` is committed with `VITE_API_BASE_URL=http://localhost:5001` and `.env.example`
mirrors it. A missing base URL is named in the console at start.

`AccessProvider` reports four states: `loading`, `signed-in`, `signed-out` (the `me` probe answered
401) and `unreachable` (it did not answer at all, which is neither). A protected route while signed
out redirects to `/sign-in` with the same-origin path it came from, and sign-in returns there.

A 401 from any request that does not own its own 401 — the `me` probe, the sign-in form, sign-out —
ends the session once, from the query client's `QueryCache` and `MutationCache` handlers.
`src/app/session.ts` raises one signal; `App` consumes it, resets the queries and opens `/sign-in`
with "Your session has ended. Sign in again to continue." A 401 arriving after the sign-in page is
already open raises nothing, so the first signal's return path is the one that survives.

Sign out calls the API, resets the queries and navigates, with no page reload, so the theme and rail
preferences stay. The shell's user block is the way to `/profile`.

**B. Contract adoption, screen by screen (spec §7).** §5 of this report lists what each screen now
calls. In short: the Overview's counts come from one summary request; Needs attention reads the
company-wide interruptions and the assignment list's own coverage count; the assignments list reads
coverage, model, customer type and the interruption count from the row; the assignment record reads
parties, VIN, the customer's driver link and every authorization's driver identity from the record,
and its Corrections history from the assignment's own audit scope; the vehicles list and record read
the server's availability with the customer holding the vehicle and the one it is reserved for; the
drivers list shows the real identifiers and the record's history is one request; Registrations is
one request with `Statuses=1,4,5` and server-side paging; the audit entry page reads the entry by id;
the transfers table reads the target's identity and the server's status, so Expired is visible at
last.

The vocabulary in `src/format/labels.ts` was reconciled with the strings the backend writes, read out
of its source: every event type has a label, `RentalAssignment.Cancelled` included, and the entity
names it stores — `ApplicationUserSession`, `ApplicationUserRoleAssignment`,
`AssignmentDriverAuthorization`, `AssignmentInterruption` and the rest — are named. A test asserts
both lists, so a new backend event type that the app has not been taught fails there.

**C. The account area (spec §8–§10).** Seven screens in the app's own vocabulary, on the centred card
of `App.module.css` with the Field, Button and alert components the dialogs use:

- `/sign-in` renders the API's own message for a refused sign-in, offers "Resend the confirmation
  email" on the unconfirmed-account code, and has its own copy for rate limiting.
- `/register` states the API's real password policy under the field and answers with a neutral
  "check your email" that never says whether an address is known, with a resend form on it.
- `/confirm-registration-email`, `/reset-password`, `/confirm-email-change` and
  `/accept-administrator-transfer` read their token from the fragment, URL-decoded, and take it out
  of the address bar with `history.replaceState`. Each handles success, field errors, an expired or
  invalid link with a way to get a new one, and rate limiting.
- `/profile` inside the shell: Account (names and email read-only, phone editable), Password,
  Email, and Sessions in the user record's vocabulary with the current session marked from the API's
  `isCurrent` flag and never offered for revocation.

Access pending gained Sign out and a link to the profile, and an account in that state can open
`/profile` while the rest of the app stays behind the card.

**D. Mock retirement (spec §11).** §6 of this report.

### The owner's per-screen check

Re-seed before a session — the sample instants are relative to the seeding moment — then work down
this list on each device. Sign in with the password given to `seed-development-data`.

| Screen | Compare with the mock's rendering | Try |
|---|---|---|
| Sign in | new screen | wrong password; an unknown address; then the right one |
| Overview | metric cards, Needs attention, assignment mix, activity card | the counts: 4 active of 12, 2 planned, 2 vehicles available of 8 active, 3 registrations |
| Needs attention | the same five rows in the same order | open each row; the two interruptions and the planned handover without a driver |
| Rental assignments | coverage column, Interrupted chip, model and type sub-lines | filter by status; open 552 KLM (collective coverage, one open interruption) |
| Assignment record | Parties, Lifecycle, Notes, the two tabs, Corrections | cancel a Planned assignment with a note; then read Notes and Corrections |
| Assignment record, Active | the mistaken-activation cancel | cancel without a note: the message appears under the note field, not above the form |
| Vehicles | availability chips and their sub-lines | in use 482 TKL, 770 HDV, 552 KLM, 204 JLM; reserved 444 WKS and 335 SNB; retired 881 GRT, 660 BYH |
| Vehicle record | the same chip as the list, rental history | open 444 WKS from the list |
| Drivers | personal identifier, licence, address columns | search; open Janis Krumins |
| Driver record | the authorization history table | vehicle, customer and status come from the row; the audit panel shows the creation |
| Customers, Customer record | unchanged | open a business and a private customer |
| User directory, User record | Registered column, roles, sessions | open Dita Smite (four role rows) and Imants Gailis (the rejection reason) |
| Registrations | All lifecycle states in one page | the five people; then each single-status filter; activate Gatis Lapsa with a role |
| Security audit | list filters, entity chips | filter by event type and by entity type; open any row |
| Audit entry | the payload diff | open the Registration · Activated entry: the role grant reads "Viewer — no expiry" |
| System Administrator | transfers table | the one open transfer to Liga Brice, Awaiting acceptance; Resend asks for your password |
| Your profile | new screen | change the phone; change the password; ask for an email change; revoke a session |
| Register and the email links | new screens | register a throwaway address, confirm it from Mailpit, activate it, sign in |
| Session ended | new behaviour | sign in on a second browser, sign out the other sessions from the profile there, then click anything in the first |

### The seeded accounts

Every seeded person shares the password given to `seed-development-data`.

| Role | Email | Name | What they see |
|---|---|---|---|
| System Administrator | `sysadmin@rwrent.example` | Arturs Veidenbaums | everything, including Corrections and the System Administrator page |
| Company Principal | `signe.priede@rwrent.example` | Signe Priede | the company's records, role administration, the company's audit history |
| Fleet Manager | `karlis.zvaigzne@rwrent.example` | Karlis Zvaigzne | fleet and rental work, registrations to review |
| Viewer | `toms.rudzitis@rwrent.example` | Toms Rudzitis | read-only across the fleet |
| Viewer + Fleet Manager | `dita.smite@rwrent.example` | Dita Smite | four role rows in her record, one of them expiring |
| Suspended | `raivis.dumins@rwrent.example` | Raivis Dumins | cannot sign in; the API says why |

## 3. Not implemented or partial

1. **The Overview's "Vehicles available" count is not in the summary.** `GET /api/overview/summary`
   carries `activeVehicles`, which the card shows as its denominator ("of 8 active"), but not the
   number that are actually free. The page therefore still reads one page of vehicles and counts the
   rows whose availability is Available. Side that would have to change: backend. Proposed option:
   add `availableVehicles` to the summary, and the Overview stops reading the vehicles list. Until
   then the extra read is one list request, not a fan-out.
2. **Tasks and Insurance cases stay sample data**, as the specification puts them out of scope. Their
   cards on the Overview and their two placeholder pages are unchanged.

## 4. Decisions needed

1. Completing a password reset needs the email address as well as the token: the API's
   `CompletePasswordResetRequest` requires `email`, `token` and `newPassword`. The screen therefore
   asks for the address again on the form behind the link, which the specification did not foresee.
   Should it stay that way, or should the backend accept the token alone and take the address from it
   (yes to keeping the field / no, ask the backend to drop it)?
2. The Overview's "Recent security activity" card shows the five newest audit entries. On a database
   that has been signed in and out of a few times, all five are `Authentication · Session created`,
   where the reviewed card showed a mix of events. Should the card exclude routine sign-in and
   sign-out events, or keep showing the newest five whatever they are?

## 5. Contract usage

| Screen | What it calls |
|---|---|
| Sign in | `POST /api/auth/login`, `POST /api/registrations/email-confirmation/resend`, `GET /api/me` |
| Sign out | `POST /api/auth/logout` |
| Shell (every page) | `GET /api/me`, `GET /api/companies`, and the open-work queue below |
| Open-work queue | `GET /api/users?Status=1`, `GET /api/rental-assignments?Status=4`, `GET /api/interruptions?IsOpen=true` |
| Overview | `GET /api/overview/summary`, `GET /api/rental-assignments`, `GET /api/vehicles`, `GET /api/security-audit?PageSize=5` |
| Needs attention | the open-work queue only |
| Rental assignments | `GET /api/rental-assignments` (+ `GET /api/customers`, `GET /api/vehicles` for the filter menus) |
| Assignment record | `GET /api/rental-assignments/{id}`, `GET /api/security-audit?RentalAssignmentId={id}`, `GET /api/users` for the actor names |
| Assignment writes | activate, end, `POST …/cancel` with `cancellationNote`, the authorization and interruption endpoints, the four correction endpoints |
| Vehicles, Vehicle record | `GET /api/vehicles`, `GET /api/vehicles/{id}`, `GET /api/rental-assignments?VehicleId={id}` for the history |
| Customers, Customer record | `GET /api/customers`, `GET /api/customers/{id}` |
| Drivers | `GET /api/drivers` |
| Driver record | `GET /api/drivers/{id}`, `GET /api/drivers/{id}/authorizations`, `GET /api/security-audit?EntityType=Driver&EntityId={id}`, `GET /api/customers` for the customer link |
| User directory, User record | `GET /api/users`, `GET /api/users/{id}`, roles and sessions endpoints |
| Registrations | `GET /api/users?Statuses=1,4,5` or `?Status=n`, then activate / reject / reopen |
| Security audit | `GET /api/security-audit` with its filters |
| Audit entry | `GET /api/security-audit/{id}` |
| Company profile | `GET /api/companies`, create / update / delete |
| System Administrator | `GET /api/system-administrator/transfers`, initiate / resend / cancel |
| Register | `POST /api/registrations`, `POST /api/registrations/email-confirmation/resend` |
| Confirm registration email | `POST /api/registrations/email-confirmation/complete` |
| Reset password | `POST /api/auth/password-reset/request`, `POST /api/auth/password-reset/complete` |
| Confirm email change | `POST /api/me/email-change/confirm` |
| Accept administrator transfer | `POST /api/system-administrator/transfers/accept` |
| Profile | `GET /api/me`, `PUT /api/me/phone`, `POST /api/me/password`, `POST /api/me/email-change`, `GET /api/me/sessions?IncludeEnded=true`, `DELETE /api/me/sessions/{id}`, `POST /api/me/sessions/revoke-others` |

## 6. Removed

- `src/mock/**` — the in-memory store, the route table, the seed and the fleet seed, the personas,
  the failure simulator, the validators and the four mock test files.
- `src/dev/**` — the PROTOTYPE pill and panel, the persona switch, the `rwrent.dev` key.
- `contract/business_rules.md` and the `contract` folder; the rules live in the backend repository.
- `VITE_API_MODE` everywhere, and the mode branch in `src/app/bootstrap.ts`.
- The mock-only read models and the `// FOLLOW-UP` comments in `src/api/dto.ts`, and the four
  `PageSize=1` probes plus the mock-only activity feed in `src/api/overview.ts`.
- Every per-row fan-out: the assignments list's authorizations and interruptions, the assignment
  record's customer, vehicle and driver reads, the vehicles list's active-assignments read, the
  driver record's per-assignment authorization reads, the Registrations three-status fan-out and its
  client-side merge, and the audit entry page's 100-row lookup.
- README sections "The swap point", "Not in swagger", "Asks for the backend", "Backend follow-ups",
  "Seed", "State of the port" and "Known gaps against the prototype".

## 7. How to run

The API and its seeded database come first, from the backend's folders:

```sh
cd /Users/zulf/rw-rent-api/RWRentApi && docker compose up -d postgres mailpit

set -a; source /Users/zulf/rw-rent-api/RWRentApi/.env; set +a
export ConnectionStrings__DefaultConnection="Host=localhost;Port=5433;Database=rwrent_v1;Username=rwrent;Password=${RWRENT_POSTGRES_PASSWORD}"
export EmailDelivery__FromAddress="dev@rwrent.local"

cd /Users/zulf/rw-rent-api/RWRentApi-wiring
dotnet ef database update --project src/RWRentApi.Infrastructure --startup-project src/RWRentApi.Api
dotnet run --project src/RWRentApi.Api -- seed-development-data --password '<your seed password>' --replace true
dotnet run --project src/RWRentApi.Api --launch-profile http
```

Then the app, in `/Users/zulf/rw-rent-api/rw-rent-web-wiring`:

```sh
npm install
npm run dev -- --port 5173 --strictPort
```

Port 5173 is not optional: it is the only origin the API trusts for credentialed requests in
Development. Mailpit catches every development email at `http://localhost:8025`. Sign in as
`sysadmin@rwrent.example` with the seed password. Re-seed with `--replace true` before a review
session, because the sample instants are relative to the seeding moment.

## 8. Verification results

| Check | Outcome |
|---|---|
| App starts against the seeded API; `/` opens `/sign-in` | pass |
| Sign in as the administrator → Overview with the seeded counts | pass: 4 active of 12, 2 planned, 2 available of 8 active, 3 registrations |
| Every route opened, no console error, no failed request | pass: the only console error in a fresh tab is the `me` probe's 401 before signing in, which is how the app learns it is signed out |
| Sign out → `/sign-in`, without a reload | pass |
| Protected route while signed out → `/sign-in`, then back to it after signing in | pass, checked with `/drivers`, `/vehicles` and `/customers` |
| Session ended: a 401 switches to the sign-in page with the message and returns afterwards | pass, by revoking the browser's session from a second session |
| One list request per page, no per-row requests | pass on the assignments list, the assignment record, the vehicles list, the driver record, Needs attention and Registrations |
| Register → confirm through the emailed link → activate → sign in as the new person | pass; the new Viewer's navigation held exactly a Viewer's items |
| Password reset requested and completed through the emailed link | pass; an invalid link falls back to the request form with its message |
| Phone change | pass |
| Password change, with the note that other sessions were signed out | pass |
| Email change requested and confirmed through the emailed link | pass |
| Session revoked, and other sessions signed out | pass; the current session is marked and never offered |
| The token leaves the address bar | pass on all four link pages |
| The seeded transfer was not accepted | respected; it still reads Awaiting acceptance to Liga Brice |
| Database re-seeded after the checks | pass |
| New screens at 1512, 834 and 402, both themes | pass; no horizontal overflow, no cut text |

## 9. Test and build results

```
$ npm run typecheck
> tsc -b --noEmit
(no output)

$ npx vitest run
 ✓ src/api/problem.test.ts (12 tests)
 ✓ src/format/datetime.test.ts (11 tests)
 ✓ src/format/labels.test.ts (7 tests)
 ✓ src/api/http.test.ts (6 tests)
 ✓ src/pages/account/failure.test.ts (6 tests)
 ✓ src/pages/account/token.test.ts (4 tests)
 ✓ src/app/session.test.ts (5 tests)
 ✓ src/permissions/can.test.ts (9 tests)

 Test Files  8 passed (8)
      Tests  60 passed (60)

$ npm run build
dist/assets/index-D532sMTX.css   69.88 kB │ gzip:  12.83 kB
dist/assets/index-DlJtTJRx.js   549.18 kB │ gzip: 153.88 kB
✓ built in 613ms
```

The build warns that the single chunk is over 500 kB, as it did before this phase. No code splitting
was added: that is a build decision, not part of the wiring.

## 10. Deviations from the specification

1. **The reset form asks for the email address.** Spec §10.3 describes the form behind the link as
   "new password and confirmation". The live API requires `email`, `token` and `newPassword`, so the
   form asks for the address as well. The live document wins (§4, question 1).
2. **The account screens do not use the Button's `block` variant.** Spec §8 asks for the app's own
   Button vocabulary; `block` is the sheet tier's neutral frame, and with the primary tone it put
   pale text on a pale surface in the light theme. The screens use an ordinary primary button that
   fills the card instead, which is the same vocabulary without the clash.
3. **The driver record's audit trail is filtered on the server.** Spec §7.7 only asks for the
   authorization history. The trail used to fetch 100 audit rows and filter them in the page; it now
   uses the new `EntityType` and `EntityId` filters, which is what §7.10 asks of the audit screens.
4. **The driver picker's licence hint reads the list, not a record.** The dialogs used to read one
   driver record per selection for the licence number. The list projection now carries it, so the
   hint comes from the list the picker already has.
5. **The driver history keeps the reviewed order.** The endpoint's order is fixed (newest first), but
   the reviewed screen shows open periods first and then the most recent boundary. The page sorts the
   one returned page to keep that; it is ordering, not a second request.
6. **Needs attention no longer reads the active assignments.** Its queue is registrations, open
   interruptions and planned handovers; the active list only fed counters that the summary now
   serves, so the query is gone.
7. **`AccessProvider` has a fourth state.** Spec §6.2 names three. An API that does not answer at all
   is neither signed in nor signed out, so it has its own state and its own card, rather than being
   reported to the owner as "signed out" when the backend is simply not running.

## 11. Open risks

1. **The Overview still reads a page of vehicles** to count the available ones (§3, item 1). On a
   large fleet that read grows; the summary count would remove it.
2. **The shell's open-work queue runs on every page.** Three list requests follow the user around,
   as they did before this phase. They are cheap against the seeded data and cached for the default
   stale time, but they are the next thing to look at if a page feels slow.
3. **`GET /api/me` is fetched once per full page load and cached for a minute.** A permission granted
   or revoked while someone is signed in reaches them at the next reload or after that minute, not
   immediately.
4. **The build is a single 549 kB chunk.** It was already over the warning threshold before this
   phase; the account screens added to it. Code splitting is a decision for whoever hosts the app.
5. **The audit list's "Recent security activity" card is dominated by sign-in events** on a database
   that has been used (§4, question 2).
6. **The seeded transfer can now be accepted for real.** Accepting it makes Liga Brice the System
   Administrator and demotes the seeded one, which changes every screen. Re-seed with
   `--replace true` after trying it.
