# Frontend Wiring Implementation Report

> App `rw-rent-web`, worktree `/Users/zulf/rw-rent-api/rw-rent-web-wiring`, branch
> `feature/backend-wiring`. What remains of the phase lives in `Context/wiring_followups.md`; the
> prototype `Context/prototype/RW-Rent.dc.html` is the design source for the account screens. The
> backend's worktree `/Users/zulf/rw-rent-api/RWRentApi-wiring` was run and read, never changed
> from here. Covers all three runs. Rewritten 2026-09-16; one report file, rewritten completely by
> each run.

## 1. Summary

**Run 1 — the wiring (Wiring 1–7, 2026-09-15).** The app lost its fake backend. It talks to the
real API at `http://localhost:5001` with cookies and the antiforgery header, it gained a front door
and an account area, and every screen is served by the one request it already made — no screen fans
out per row. The mock, the PROTOTYPE panel with its persona switch and failure simulator, the copy
of the business rules and the mode switch are gone.

**Run 2 — the port (Wiring 8, 2026-09-15).** The specification had said the account screens had no
prototype. They did. Every screen the first run designed was replaced by a transcription of the
prototype's authentication family, its "Your account" and its "Access pending", keeping the API
behaviour the first run built.

**Run 3 — follow-up 2 and the joint check (Wiring 9–10, 2026-09-16).** The owner's four decisions
are in: the Overview's activity card hides routine sign-ins and sign-outs, the password checklist
asks for the four rules the API actually enforces, the reset note appears only where something is
being reset, and the three values the app used to compute or leave blank now come from the
backend's round 2 — `availableVehicles` on the summary, `passwordChangedAtUtc` and `pendingEmail`
on `GET /api/me`. Driving the app against the round-2 API then turned up a defect of its own: every
lifecycle dialog sent its instant with the zone's offset, which the API cannot store, so cancelling
an assignment answered 500. Fixed in Wiring 10 (§8, §10 deviation 9).

Commits `2a2cece` (Wiring 1) … `f338131` (Wiring 7), `0e49285` (Wiring 8), `12b11c3` (Wiring 9) and
`238c8bb` (Wiring 10), with the follow-up documents in `5bcd87d`, `aca9647` and `b4373d8`, on top of
`850eb1f`. Tests went from 88 before the phase (56 of them the mock's own) to 89, every one of them
about the app. `npm run typecheck`, `npx vitest run` and `npm run build` are green.

## 2. Implemented

**A. The switch.** `bootstrapApi()` installs the http transport and nothing else; `.env.development`
is committed with `VITE_API_BASE_URL=http://localhost:5001` and `.env.example` mirrors it.

`AccessProvider` reports four states: `loading`, `signed-in`, `signed-out` (the `me` probe answered
401) and `unreachable` (it did not answer at all, which is neither). A protected route while signed
out redirects to `/sign-in` with the path it came from, and signing in returns there.

A 401 from any request that does not own its own 401 ends the session once, from the query client's
`QueryCache` and `MutationCache` handlers; `src/app/session.ts` raises one signal and `App` consumes
it, resets the queries and opens the prototype's Session expired screen. A deliberate sign-out
raises nothing (§10, deviation 8).

**B. Contract adoption, screen by screen.** §5 lists what each screen calls. The Overview's counts
come from one summary request; Needs attention reads the company-wide interruptions and the planned
list's own coverage count; the assignments list reads coverage, model, customer type and the
interruption count from the row; the assignment record reads parties, VIN, the customer's driver
link and every authorization's driver identity from the record, and its Corrections history from the
assignment's own audit scope; the vehicles list and record read the server's availability; the
drivers list shows the real identifiers and the record's history is one request; Registrations is
one request with `Statuses=1,4,5`; the audit entry page reads the entry by id; the transfers table
reads the target's identity and the server's status.

`src/format/labels.ts` was reconciled with the strings the backend writes, read out of its source,
and a test asserts both lists, so a new backend event type the app has not been taught fails there.

**C. The account area, ported from the prototype.** `AuthLayout` is the split page: the form column
on the rail surface under the prototype's 64px grid, the wordmark and the theme toggle above it, the
platform line below, and the monogram art panel at 46 % width from 1024 up — the prototype's
`!isNarrow() && w >= 900`. `Auth.module.css` carries its inline styles as classes on the app's
tokens, which are its tokens. `outcomes.ts` is its `messageModel()` as data, and `signInOutcome()`
maps the API's coded refusals onto the screens it defines. The theme is one store applied before the
first paint, so a cold load of a public page is already in the theme the person chose.

**D. "Your account" and "Access pending".** `/profile` is the prototype's three tabs with the record
vocabulary's panels and fact grids and a dialog behind every action. The session this browser uses
carries the accent chip and "This device" and is never offered for revocation. Access pending is the
prototype's `noaccess` page inside the shell, whose navigation is empty for an account with no
permissions.

**E. The owner's decisions of 2026-09-16 (follow-up 2).**

- The Overview's Recent security activity card asks for 25 audit rows and shows the first five that
  are neither `Authentication.SessionCreated` nor `Authentication.Logout`. `activity.ts` holds the
  filter as a pure function; the audit page still shows everything.
- The password checklist lost its lowercase line. Identity does not require one, so the form used to
  refuse passwords the server accepts. Four rules remain in the prototype's wording, and the panel
  description that stated the policy follows them (§10, deviation 7).
- "The reset must be completed with the address the link was sent to" renders only on the
  forgotten-password and set-a-new-password screens.
- The Overview's vehicles card reads `availableVehicles` from the summary and no longer fetches a
  page of vehicles; Sign-in & security shows "Last changed" from `passwordChangedAtUtc` and
  "Pending change" from `pendingEmail`, and the two "the API does not report this yet" notes are
  gone.

**F. Mock retirement.** §6.

### 2.1 The owner's check — account screens (prototype screen → app route → what to compare)

| Prototype screen | App route | What to compare |
|---|---|---|
| `signin` | `/sign-in` | title, the two fields, "Forgot password?" on the password's label row, the black Sign in with its arrow, "No account yet? Create one", the footer line, the art panel |
| `register` | `/register` | the two names on one row, the phone placeholder, the checklist filling in as you type — four rules now, not the prototype's five (owner decision 3) |
| `register-submitted` | `/register` after Create account | the mail glyph, both facts, the two actions |
| `confirm-checking` · `confirm-done` · `confirm-bad` | `/confirm-registration-email` | the glyph and its colour, the fact list, the mono `code:` line |
| `resend` | `/confirm-registration-email?resend=1` | title and body; the app adds the password field the API requires, and the reset note is absent (owner decisions 4 and 6) |
| `pending` | `/sign-in` as a confirmed but unactivated account | five facts, the warn hourglass |
| `rejected` · `expired` · `suspended` | `/sign-in` as each account | glyph, colour, actions |
| `session-expired` | `/sign-in` after a session is revoked elsewhere | the warn clock, "Sign in again", and that it returns to the page you were on |
| `rate-limited` | `/sign-in` after repeated attempts | the `HTTP 429` mono line |
| `forgot` · `forgot-sent` | `/reset-password` | the email field with its note, "Send reset link", then the outgoing-mail screen |
| `reset` · `reset-bad` | `/reset-password` from the emailed link | the token note with its key glyph, the checklist, then the unusable screen with the API's code |
| `transfer-accept` | `/accept-administrator-transfer` | title, body, the existing-password field and its note; no email or new-password field (owner decision 5) |
| `profile` · Profile | `/profile` | the two panels, "Update phone", "Show permissions" |
| `profile` · Sign-in & security | `/profile?tab=security` | both panels, their notes, the dialogs behind Change password and Change email, and the two facts that are real now |
| `profile` · Your sessions | `/profile?tab=sessions` | the six columns, the Current chip and "This device", "Revoke other sessions" |
| `noaccess` | any route as an account with no permissions | the info banner, both panels, the empty navigation |

### 2.2 The owner's check — every other screen

| Screen | Compare with the mock's rendering | Try |
|---|---|---|
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

### 2.3 Seeded accounts (same password for all, set by the owner when seeding)

| Role | Email | Name | What they see |
|---|---|---|---|
| System Administrator | `sysadmin@rwrent.example` | Arturs Veidenbaums | everything, including Corrections and the System Administrator page |
| Company Principal | `signe.priede@rwrent.example` | Signe Priede | the company's records, role administration, the company's audit history |
| Fleet Manager | `karlis.zvaigzne@rwrent.example` | Karlis Zvaigzne | fleet and rental work, registrations to review |
| Viewer | `toms.rudzitis@rwrent.example` | Toms Rudzitis | read-only across the fleet |
| Viewer + Fleet Manager | `dita.smite@rwrent.example` | Dita Smite | four role rows in her record, one of them expiring |
| Suspended | `raivis.dumins@rwrent.example` | Raivis Dumins | cannot sign in; the Account suspended screen says why |

There is no seeded Active account without permissions, so Access pending has no seeded way in: to
see it, revoke a Viewer's only role from their user record, sign in as them, and re-seed afterwards.

## 3. Not implemented or partial

1. **Tasks and Insurance cases are still sample data**, as the specification put them out of scope.
   Their two cards on the Overview and their placeholder pages are unchanged. Side that has to
   change: backend, when those areas exist.
2. **The prototype file is out of date in two places** (owner decisions 5 and 6): its
   transfer-acceptance screen shows an email and a new-password field the API does not take, and
   its resend screen lacks the password field the API requires. The app is right and the prototype
   stays the reference for looks only. Side that has to change: the prototype, if it is ever edited
   again.
3. **The backend answers 500, not 400, for an instant whose offset it cannot store** (§8, and §10
   deviation 9). The app no longer sends one, so nothing malfunctions today, but any other client
   that sends a legitimate `+03:00` instant gets an unexpected-error page instead of a validation
   message. Side that has to change: backend. Proposed option: normalise an incoming
   `DateTimeOffset` to UTC before persisting, or refuse a non-zero offset in the validators with
   the usual coded 400.

## 4. Decisions needed

None. The three questions the earlier runs raised were answered by the owner on 2026-09-16 and are
implemented here (§2 E); they are recorded in `Context/wiring_followups.md` §1.

## 5. Contract usage

| Screen | What it calls |
|---|---|
| Sign in | `POST /api/auth/login`, `POST /api/registrations/email-confirmation/resend`, `GET /api/me` |
| Sign out | `POST /api/auth/logout` |
| Shell (every page) | `GET /api/me`, `GET /api/companies`, and the open-work queue below |
| Open-work queue | `GET /api/users?Status=1`, `GET /api/rental-assignments?Status=4`, `GET /api/interruptions?IsOpen=true` |
| Overview | `GET /api/overview/summary`, `GET /api/rental-assignments`, `GET /api/security-audit?PageSize=25` |
| Needs attention | the open-work queue only |
| Rental assignments | `GET /api/rental-assignments` (+ `GET /api/customers`, `GET /api/vehicles` for the filter menus) |
| Assignment record | `GET /api/rental-assignments/{id}`, `GET /api/security-audit?RentalAssignmentId={id}`, `GET /api/users` for the actor names |
| Assignment writes | activate, end, `POST …/cancel` with `cancellationNote`, the authorization and interruption endpoints, the four correction endpoints |
| Vehicles, Vehicle record | `GET /api/vehicles`, `GET /api/vehicles/{id}`, `GET /api/rental-assignments?VehicleId={id}` for the history |
| Customers, Customer record | `GET /api/customers`, `GET /api/customers/{id}` |
| Drivers | `GET /api/drivers` |
| Driver record | `GET /api/drivers/{id}`, `GET /api/drivers/{id}/authorizations`, `GET /api/security-audit?EntityType=Driver&EntityId={id}`, `GET /api/customers` |
| User directory, User record | `GET /api/users`, `GET /api/users/{id}`, roles and sessions endpoints |
| Registrations | `GET /api/users?Statuses=1,4,5` or `?Status=n`, then activate / reject / reopen |
| Security audit | `GET /api/security-audit` with its filters |
| Audit entry | `GET /api/security-audit/{id}` |
| Company profile | `GET /api/companies`, create / update / delete |
| System Administrator | `GET /api/system-administrator/transfers`, initiate / resend / cancel |
| Create account | `POST /api/registrations` |
| Confirm registration email, and its resend screen | `POST /api/registrations/email-confirmation/complete`, `POST /api/registrations/email-confirmation/resend` |
| Reset password | `POST /api/auth/password-reset/request`, `POST /api/auth/password-reset/complete` |
| Confirm email change | `POST /api/me/email-change/confirm` |
| Accept administrator transfer | `POST /api/system-administrator/transfers/accept` |
| Your account | `GET /api/me`, `PUT /api/me/phone`, `POST /api/me/password`, `POST /api/me/email-change`, `GET /api/me/sessions?IncludeEnded=true`, `DELETE /api/me/sessions/{id}`, `POST /api/me/sessions/revoke-others` |
| Access pending | `GET /api/me` only |

The Overview no longer calls `GET /api/vehicles`: both numbers on its vehicles card come from the
summary.

## 6. Removed

From run 1: `src/mock/**` (the store, the route table, the seeds, the personas, the failure
simulator, the validators and four test files); `src/dev/**` (the PROTOTYPE pill and panel, the
persona switch); `contract/business_rules.md` and the `contract` folder; `VITE_API_MODE` and the
mode branch in `bootstrap.ts`; the mock-only read models in `dto.ts`, the four `PageSize=1` probes
and the mock-only activity feed in `api/overview.ts`; every per-row fan-out; seven prototype-era
README sections.

From run 2: `AccountLayout.tsx` and `Account.module.css` (the centred card, its title block, its
link row and its alert); `ResendConfirmation.tsx`, whose form is the prototype's own screen now;
the Access pending card in `App.tsx`; the local theme hook inside `AppShell.tsx`; the profile's four
inline-form panels.

From run 3: the Overview's page of vehicles and the `VehicleAvailability` counting with it; the
checklist's lowercase rule; the two "the API does not report this yet" notes.

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

### 8.1 The joint check of 2026-09-16 (follow-up 2 §3)

Against the round-2 API restarted from its new build, the app restarted from this branch, and the
seeded database.

| Check | Outcome |
|---|---|
| Sign in as the seeded administrator | pass |
| Every route opened: Overview, Needs attention, Tasks, Insurance cases, assignments and a record, vehicles, customers, drivers, user directory, Registrations, Security audit, Company profile, System Administrator, the three account tabs | pass: 12 assignments, 10 vehicles, 8 customers, 7 drivers, 11 users, 5 registrations, 18 audit rows, the transfer to Liga Brice |
| The activity card hides routine sign-ins and sign-outs | pass: after several sign-ins it shows Timeline corrected, Company updated, Registration submitted, Driver authorisation corrected, Session revoked by administrator — no "Session created", no "Logout" |
| The vehicles card reads the summary alone | pass: "2 of 8 active", and no `GET /api/vehicles` in the network log for the Overview |
| The vehicles list agrees with the card | pass: 2 Available, 4 In use, 2 Reserved, 2 Retired |
| Cancel a Planned assignment with a note | **failed first, then passed.** The first attempt answered 500: the dialog sent `…T08:01:00.000+03:00` and the API cannot store a non-UTC offset. Fixed in Wiring 10; the same cancellation then succeeded from the record, the note appears as its own fact beside the assignment note, and the Corrections history shows `Rental assignment · Cancelled` with the note as its reason at the right UTC instant |
| "Last changed" on Sign-in & security | pass: 11 Aug 2025, 12:07 for the seeded administrator — his sample registration instant, because the seed writes no password history (see the backend report's deviation 1) |
| A password change moves it | pass: after the change it read 16 Sep, 08:05 |
| "Pending change" while a change is open | pass: `arturs.veidenbaums@rwrent.example — awaiting confirmation` |
| Confirm the change through Mailpit | pass: the Email changed screen, then Current address is the new one and Pending change is None again |
| Revoke one session | pass: the second session turned Revoked; the current one is marked Current and has no Revoke |
| Sign out | pass: the sign-in form, with no "your session has ended" |
| Signe Priede (Company Principal) | pass: navigation without System Administrator; an assignment record without the Corrections tab |
| Toms Rudzitis (Viewer) | pass: navigation without Registrations, Security audit and System Administrator; the vehicles list read-only, with no create or row actions |
| The console over the whole check | pass: no JavaScript error and no React warning. The only console entry was the one 500 of the cancellation defect |
| A record page opened with an id that does not exist | pass: the error card "That assignment is not available" with Try again, not a blank page |
| Database re-seeded afterwards | pass, with `--replace true` |

### 8.2 Carried from the earlier runs

| Check | Outcome |
|---|---|
| App starts against the seeded API; `/` opens `/sign-in` | pass |
| Protected route while signed out → `/sign-in`, then back to it after signing in | pass, checked with `/drivers`, `/vehicles` and `/customers` |
| Session ended elsewhere → the prototype's Session expired screen, then back to the page it left | pass, checked from `/drivers` |
| One list request per page, no per-row requests | pass on the assignments list, the assignment record, the vehicles list, the driver record, Needs attention and Registrations |
| Register → the registration-submitted screen → the emailed link → Email confirmed | pass, with a real registration through the API |
| Signing in as a confirmed but unactivated account → Awaiting activation | pass, from `authentication.account_pending_activation` |
| The suspended account → Account suspended | pass, from `authentication.account_suspended` |
| An unconfirmed account → the form's alert with "Resend the confirmation email" | pass; the resend lands on the registration-submitted screen |
| Forgotten password → Check your email; the emailed link → Set a new password with the token note | pass; the token leaves the address bar |
| 1512 / 834 / 402, dark and light, on sign in, create account, an outcome screen, both reset screens, the three account tabs and Access pending | pass; no overflow, no cut text, the art panel leaves below 1024 |
| A dialog at 402 in the light theme | pass; the sheet's Cancel and its primary action both read correctly |

## 9. Test and build results

```
$ npm run typecheck
> tsc -b --noEmit
(no output)

$ npx vitest run
 ✓ src/format/datetime.test.ts (14 tests)
 ✓ src/api/problem.test.ts (12 tests)
 ✓ src/permissions/can.test.ts (9 tests)
 ✓ src/pages/account/outcomes.test.ts (8 tests)
 ✓ src/pages/account/password.test.ts (8 tests)
 ✓ src/format/labels.test.ts (7 tests)
 ✓ src/api/http.test.ts (6 tests)
 ✓ src/app/session.test.ts (6 tests)
 ✓ src/pages/account/failure.test.ts (6 tests)
 ✓ src/pages/overview/activity.test.ts (5 tests)
 ✓ src/pages/account/profileFacts.test.ts (4 tests)
 ✓ src/pages/account/token.test.ts (4 tests)

 Test Files  12 passed (12)
      Tests  89 passed (89)

$ npm run build
dist/assets/index-CXhrh6EP.css   75.25 kB │ gzip:  13.93 kB
dist/assets/index-MdpkvBYm.js   562.25 kB │ gzip: 158.79 kB
✓ built in 637ms
```

Run 3 added nine tests — five for the activity filter, one for a password with no lowercase letter,
four for the two profile facts, three for the UTC conversion — and changed three assertions of
`password.test.ts` to the four-rule checklist the owner decided on. No test was removed or weakened.

The build warns that the single chunk is over 500 kB, as it did before this phase. Code splitting is
a hosting decision, not part of the wiring.

## 10. Deviations from the specification

1. **The account screens are ports, not the specification's own design.** Spec §8–§10 asked for new
   screens on the app's centred card; the prototype has the whole family, so they are transcriptions
   of it and the specification's layout guidance is superseded. Its routes, API calls, outcomes and
   flows are unchanged.
2. **The reset form asks for the email address.** The API requires `email`, `token` and
   `newPassword`, and the prototype's own reset screen shows the field and names it in its copy.
3. **There is no "repeat the password" field.** The prototype has the live checklist instead, and
   the API takes no confirmation.
4. **The symbol rule excludes whitespace.** The API's validator wants a non-whitespace punctuation
   or symbol character, so a password whose only symbol is a space is refused by the server.
5. **The driver record's audit trail is filtered on the server**, through the `EntityType` and
   `EntityId` filters, rather than fetching 100 rows and filtering in the page.
6. **The driver history keeps the reviewed order** — open periods first, then the most recent
   boundary — by sorting the one returned page.
7. **The checklist asks for four rules, not the prototype's five.** Identity does not require a
   lowercase letter (owner decision 3, 2026-09-16), so the fifth line is gone and the panel
   description that stated the policy now reads "At least 12 characters with upper case, a digit and
   a symbol."
8. **A deliberate sign-out no longer raises the session-end signal.** Emptying the cache refetches
   the page's watched queries, whose 401s used to raise it, so signing out reached the sign-in page
   carrying "your session has ended".
9. **`fromLocalInput` now reports UTC, not the zone's offset.** Every value it produces is stored by
   the API in a `timestamp with time zone` column, and Npgsql writes a `DateTimeOffset` only at
   offset zero, so the lifecycle dialogs failed with a 500 (§8.1). The instant is resolved exactly
   as before. `startOfDayLocal` and `endOfDayLocal` keep their offset form: those are filter bounds
   the API only compares, never stores.
10. **`AccessProvider` has a fourth state.** An API that does not answer at all is neither signed in
    nor signed out, so it has its own state and its own card.
11. **Two additions to shared components.** `Chip` gained the prototype's `accent` tone for the
    current session's chip, and `Dialog` gained `hideCancel` for the prototype's read-only access
    sheet. Neither changes an existing screen.

## 11. Open risks

1. **The backend answers 500 for an offset it cannot store** (§3, item 3). The app no longer sends
   one, so this is a hardening item rather than a live fault.
2. **The shell's open-work queue runs on every page** — three list requests follow the user around.
   Cheap against the seeded data and cached for the default stale time, but the first thing to look
   at if a page ever feels slow.
3. **`GET /api/me` is cached for a minute after a full page load.** A permission granted or revoked
   while someone is signed in reaches them at the next reload or after that minute.
4. **The build is a single 562 kB chunk**, already over the warning threshold before this phase.
5. **Seeded "Last changed" dates look old.** The seed writes no password history, so every seeded
   person reports their sample registration date. Nothing malfunctions; the backend's backlog item 1
   is where it would change.
6. **The seeded transfer can be accepted for real.** Accepting it makes Liga Brice the System
   Administrator and demotes the seeded one, which changes every screen. Re-seed with
   `--replace true` afterwards.
7. **Access pending has no seeded way in** (§2.3): reaching it means revoking someone's only role,
   which changes the dataset.
8. **The Button `block` variant with the primary tone has poor contrast in the light theme** on
   phone-sized dialog sheets. Checked once at 402 in light on the account area's dialogs and nothing
   reproduced there; it stays on the follow-up document's backlog for the owner's own check.
