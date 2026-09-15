# Frontend Wiring Implementation Report

> App `rw-rent-web`, worktree `/Users/zulf/rw-rent-api/rw-rent-web-wiring`, branch
> `feature/backend-wiring`. Implements `Context/wiring_spec.md` in the order of
> `Context/wiring_plan.md`, with the corrections in `Context/wiring_followups.md`, against the
> backend's own `feature/backend-wiring` worktree, which was read and run but never changed.
> Covers both runs — the wiring phase (Wiring 1–7) and the account-area port (Wiring 8).
> Rewritten 2026-09-15. One report file; a later run rewrites it completely.

## 1. Summary

**First run — the wiring (Wiring 1–7).** The app no longer has a fake backend. It talks to the real
API at `http://localhost:5001` with cookies and the antiforgery header, it has a front door and an
account area it never had, and every screen is served by the request it already made — no screen
fans out per row any more. The mock, the PROTOTYPE panel with its persona switch and failure
simulator, the copy of the business rules and the mode switch are deleted.

**Second run — the port (Wiring 8).** The specification said the sign-in and account screens had no
prototype. They do: the reviewed prototype carries the whole authentication family, "Your account"
and "Access pending". The screens the first run designed are gone, replaced by ports of
`Context/prototype/RW-Rent.dc.html` — its split page with the monogram art, its theme toggle and
platform line, its sixteen states with their copy word for word, its three-tab account screen and
its Access pending page. The API behaviour behind them is the one the first run built and verified.

Commits `2a2cece` (Wiring 1) … `f338131` (Wiring 7), `5bcd87d` (the follow-up and the prototype
file) and the `Wiring 8` commit, on top of `850eb1f`. Tests went from 88 before the phase (56 of
them the mock's own) to 76, all of them about the app: the transport, the session signal, the
account failure mapper, the token reader, the outcome table, the password rules, the audit
vocabulary, the failure envelope, the formatting and the permission gate. `npm run typecheck`,
`npx vitest run` and `npm run build` are green.

Verified live against the seeded database, in both runs: signed in as the seeded administrator,
opened every route with no console error and no failed request, registered a new person and took
them through confirmation and the awaiting-activation screen, asked for a password reset and opened
the emailed link, changed a phone number, revoked sessions, and watched a revoked session turn into
the prototype's Session expired screen and come back to the page it left.

## 2. Implemented

**A. The switch (spec §6).** `bootstrapApi()` installs the http transport and nothing else;
`.env.development` is committed with `VITE_API_BASE_URL=http://localhost:5001` and `.env.example`
mirrors it. A missing base URL is named in the console at start.

`AccessProvider` reports four states: `loading`, `signed-in`, `signed-out` (the `me` probe answered
401) and `unreachable` (it did not answer at all, which is neither). A protected route while signed
out redirects to `/sign-in` with the same-origin path it came from, and sign-in returns there.

A 401 from any request that does not own its own 401 ends the session once, from the query client's
`QueryCache` and `MutationCache` handlers. `src/app/session.ts` raises one signal; `App` consumes
it, resets the queries and opens `/sign-in`, where the prototype's Session expired screen is
rendered. A 401 arriving after the sign-in page is already open raises nothing, and a deliberate
sign-out raises nothing at all (§10, deviation 8).

Sign out calls the API, resets the queries and navigates, with no page reload, so the theme and
rail preferences stay. The shell's account button is the way to `/profile`.

**B. Contract adoption, screen by screen (spec §7).** §5 lists what each screen now calls. In
short: the Overview's counts come from one summary request; Needs attention reads the company-wide
interruptions and the assignment list's own coverage count; the assignments list reads coverage,
model, customer type and the interruption count from the row; the assignment record reads parties,
VIN, the customer's driver link and every authorization's driver identity from the record, and its
Corrections history from the assignment's own audit scope; the vehicles list and record read the
server's availability with the customer holding the vehicle and the one it is reserved for; the
drivers list shows the real identifiers and the record's history is one request; Registrations is
one request with `Statuses=1,4,5` and server-side paging; the audit entry page reads the entry by
id; the transfers table reads the target's identity and the server's status, so Expired is visible
at last.

The vocabulary in `src/format/labels.ts` was reconciled with the strings the backend writes, read
out of its source: every event type has a label, `RentalAssignment.Cancelled` included, and the
entity names it stores are named. A test asserts both lists, so a new backend event type that the
app has not been taught fails there.

**C. The account area, ported from the prototype (follow-up 1).** `src/pages/account/` is now a
transcription of the prototype's `showAuth` block and its `profile` and `noaccess` routes:

- `AuthLayout` is the split page: the form column on the rail surface under the prototype's 64px
  grid, the wordmark and the theme toggle above it, the line "RW-Rent operations platform · v1.0.0 ·
  Sessions expire after 2 h idle, 12 h absolute" below it, and the monogram art panel at 46 % width
  from 1024 up — which is exactly the prototype's `!isNarrow() && w >= 900`.
- `Auth.module.css` carries the prototype's inline styles as classes on the app's tokens, which are
  the prototype's tokens. Nothing in it was designed.
- `outcomes.ts` is the prototype's `messageModel()` as data: icon, tone, title, body, facts, the
  mono code line and the actions, for every message state. `signInOutcome()` maps the API's coded
  refusals onto them. Both are covered by `outcomes.test.ts`.
- `password.ts` is the prototype's `pwRules()`: the five-rule live checklist under every new
  password, and the check the create-account form runs before it sends.
- The screens: `SignIn`, `Register`, `ConfirmRegistrationEmail` (with the prototype's resend screen
  at `?resend=1`), `ResetPassword` (the forgotten-password request and the new password behind the
  link), `AcceptAdministratorTransfer`, `ConfirmEmailChange`, `Profile` and `AccessPending`.
- The theme is one store, `src/app/theme.ts`, applied to the document before the first paint. A
  cold load of any public page is already in the theme the person chose, and the toggle in the
  authentication header and the one in the shell are the same switch.

**D. "Your account" and "Access pending".** `/profile` is the prototype's three tabs — Profile,
Sign-in & security, Your sessions with its active count — with the record vocabulary's panels and
fact grids, and a dialog behind every action: Update phone, Show permissions, Change password,
Change email, Revoke session, Revoke other sessions. The session this browser is using carries the
prototype's accent chip and "This device", and is never offered for revocation. Access pending is
the prototype's `noaccess` page inside the shell, whose navigation is empty for an account with no
permissions, exactly as `navModel()` does it; the account button still leads to `/profile`.

**E. Mock retirement (spec §11).** §6.

### The owner's per-screen check

Re-seed before a session — the sample instants are relative to the seeding moment — then work down
this list on each device. Sign in with the password given to `seed-development-data`.

The account screens are pairs: open the prototype state in Claude Design beside the app's route.
The prototype's state is chosen from its "Prototype states" panel (`authScreen`), or by opening
`profile` / `noaccess`.

| Prototype screen | App route | What to compare |
|---|---|---|
| `signin` | `/sign-in` | title, the two fields, "Forgot password?" on the password's label row, the black Sign in with its arrow, "No account yet? Create one", the footer line, the art panel |
| `register` | `/register` | the two names on one row, the phone placeholder, the five-rule checklist filling in as you type |
| `register-submitted` | `/register` after Create account | the mail glyph, both facts, the two actions |
| `confirm-checking` · `confirm-done` · `confirm-bad` | `/confirm-registration-email` | the glyph and its colour, the fact list, the mono `code:` line |
| `resend` | `/confirm-registration-email?resend=1` | title and body; the app adds the password field the API requires (§3) |
| `pending` | `/sign-in` as a confirmed but unactivated account | five facts, the warn hourglass |
| `rejected` · `expired` · `suspended` | `/sign-in` as each account | glyph, colour, actions |
| `session-expired` | `/sign-in` after a session is revoked elsewhere | the warn clock, "Sign in again", and that it returns to the page you were on |
| `rate-limited` | `/sign-in` after repeated attempts | the `HTTP 429` mono line |
| `forgot` · `forgot-sent` | `/reset-password` | the email field with its note, "Send reset link", then the outgoing-mail screen |
| `reset` · `reset-bad` | `/reset-password` from the emailed link | the token note with its key glyph, the checklist, then the unusable screen with the API's code |
| `transfer-accept` | `/accept-administrator-transfer` | title, body, the existing-password field and its note (§3 for the two fields the API does not take) |
| `profile` · Profile | `/profile` | the two panels, "Update phone", "Show permissions" |
| `profile` · Sign-in & security | `/profile?tab=security` | both panels, their notes, the dialogs behind Change password and Change email |
| `profile` · Your sessions | `/profile?tab=sessions` | the six columns, the Current chip and "This device", "Revoke other sessions" |
| `noaccess` | any route as an account with no permissions | the info banner, both panels, the empty navigation |

And the screens of the first run, against the mock's rendering:

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

### The seeded accounts

Every seeded person shares the password given to `seed-development-data`.

| Role | Email | Name | What they see |
|---|---|---|---|
| System Administrator | `sysadmin@rwrent.example` | Arturs Veidenbaums | everything, including Corrections and the System Administrator page |
| Company Principal | `signe.priede@rwrent.example` | Signe Priede | the company's records, role administration, the company's audit history |
| Fleet Manager | `karlis.zvaigzne@rwrent.example` | Karlis Zvaigzne | fleet and rental work, registrations to review |
| Viewer | `toms.rudzitis@rwrent.example` | Toms Rudzitis | read-only across the fleet |
| Viewer + Fleet Manager | `dita.smite@rwrent.example` | Dita Smite | four role rows in her record, one of them expiring |
| Suspended | `raivis.dumins@rwrent.example` | Raivis Dumins | cannot sign in; the Account suspended screen says why |

The seed has no Active account without permissions, so Access pending has no seeded way in. To see
it, revoke a Viewer's role from the user record and sign in as them, then re-seed. That is how it
was verified here.

## 3. Not implemented or partial

1. **The prototype's transfer-acceptance screen shows two fields the API does not take.** Its
   `transfer-accept` state carries an email address and a new password beside the existing-password
   field, but `POST /api/system-administrator/transfers/accept` takes the token and the account's
   existing password and nothing else. The port shows the existing-password field only. Side that
   has to change: an owner decision, then one side or the other. Proposed option: leave the screen
   as it is and correct the prototype, because a field that changes nothing is worse than a missing
   one.
2. **The prototype's resend screen shows no password, but the API requires one.**
   `POST /api/registrations/email-confirmation/resend` takes the email and the password the person
   registered with — the prototype's own body copy says so, while its state renders only the email
   field. The port adds a "Password" field in the prototype's field style. Side that has to change:
   the prototype. Proposed option: adopt the app's field.
3. **"Last changed" and "Pending change" on Sign-in & security have no source.** The prototype shows
   when the password was last changed and which address is waiting for confirmation. `GET /api/me`
   carries neither, although the backend stores the pending change. Both facts render as "—" with
   the note that the API does not report them yet. Side that has to change: backend. Proposed
   option: add `passwordChangedAtUtc` and the pending email address to the current-user projection.
4. **The Overview's "Vehicles available" count is not in the summary.**
   `GET /api/overview/summary` carries `activeVehicles`, which the card shows as its denominator,
   but not the number that are free. The page still reads one page of vehicles and counts the rows
   whose availability is Available. Side that has to change: backend. Proposed option: add
   `availableVehicles` to the summary and the Overview stops reading the vehicles list.
5. **Tasks and Insurance cases stay sample data**, as the specification puts them out of scope.
6. **The prototype answers a completed reset and an accepted transfer with a toast.** The app has no
   toast surface — an earlier, reviewed decision — so each is shown as a message screen in the
   prototype's own vocabulary, carrying the toast's copy word for word ("Password changed / All
   other sessions were signed out.", "Administrator transfer accepted / Sign in to continue with the
   new access."). Side that has to change: nobody, unless the owner wants a toast surface.
7. **Three states the prototype's family does not cover** are built from the vocabulary of the
   states it does define: a transfer link that cannot be used, and the two halves of
   `/confirm-email-change`, which the design has no screen for. Side that has to change: the
   prototype, if the owner wants them designed rather than composed.

## 4. Decisions needed

1. The password checklist under a new password lists five rules, the prototype's own: twelve
   characters, an uppercase letter, a lowercase letter, a digit and a symbol. The API requires four
   of them — it does not require a lowercase letter — so the form refuses a password the server
   would accept. Should the checklist keep the prototype's five rules, or drop the lowercase line to
   match the API exactly?
2. The prototype's reset-family screens share one email field, whose note reads "The reset must be
   completed with the address the link was sent to." It is transcribed as it stands, so it also
   appears on the resend-confirmation screen and the transfer acceptance, where nothing is being
   reset. Should the note stay on every screen as the prototype has it, or appear only on the two
   password-reset screens?
3. The Overview's "Recent security activity" card shows the five newest audit entries. On a database
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
| Create account | `POST /api/registrations` |
| Confirm registration email, and its resend screen | `POST /api/registrations/email-confirmation/complete`, `POST /api/registrations/email-confirmation/resend` |
| Reset password | `POST /api/auth/password-reset/request`, `POST /api/auth/password-reset/complete` |
| Confirm email change | `POST /api/me/email-change/confirm` |
| Accept administrator transfer | `POST /api/system-administrator/transfers/accept` |
| Your account | `GET /api/me`, `PUT /api/me/phone`, `POST /api/me/password`, `POST /api/me/email-change`, `GET /api/me/sessions?IncludeEnded=true`, `DELETE /api/me/sessions/{id}`, `POST /api/me/sessions/revoke-others` |
| Access pending | `GET /api/me` only |

## 6. Removed

From the first run:

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

From the port:

- `src/pages/account/AccountLayout.tsx` and `src/pages/account/Account.module.css` — the centred
  card, its title block, its link row and its alert, which the port makes obsolete.
- `src/pages/account/ResendConfirmation.tsx` — the resend form is the prototype's own screen now,
  behind `/confirm-registration-email?resend=1`.
- The Access pending card and the `PASSWORD_POLICY` sentence in `App.tsx` and `Register.tsx`; the
  prototype states the policy as its five-rule checklist instead.
- The local theme hook inside `AppShell.tsx`, replaced by the shared store.
- The profile's four inline-form panels, replaced by the prototype's tabs, facts and dialogs.

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

The first run's checks, all still passing after the port:

| Check | Outcome |
|---|---|
| App starts against the seeded API; `/` opens `/sign-in` | pass |
| Sign in as the administrator → Overview with the seeded counts | pass: 4 active of 12, 2 planned, 2 available of 8 active, 3 registrations |
| Every route opened, no console error, no failed request | pass: the only console entries are the HTTP statuses of the refusals that were exercised on purpose — the `me` probe's 401 while signed out, and the coded 403s of the suspended and awaiting-activation accounts. No JavaScript error and no React warning. |
| Sign out → `/sign-in`, without a reload | pass |
| Protected route while signed out → `/sign-in`, then back to it after signing in | pass, checked with `/drivers`, `/vehicles` and `/customers` |
| One list request per page, no per-row requests | pass on the assignments list, the assignment record, the vehicles list, the driver record, Needs attention and Registrations |
| Password reset requested and completed through the emailed link | pass; an invalid link falls back to the request form with its message |
| Email change requested and confirmed through the emailed link | pass |
| The seeded transfer was not accepted | respected; it still reads Awaiting acceptance to Liga Brice |

The port's own checks, this run, against the seeded API:

| Check | Outcome |
|---|---|
| Sign in renders the prototype's screen at 1512 with the art panel, and without it below 1024 | pass |
| Theme toggle on a public page, and the saved theme on a cold load of `/sign-in` | pass, both directions, and the shell's toggle is the same switch |
| Create account → the registration-submitted screen | pass, with a real registration through the API |
| The emailed confirmation link → the Email confirmed screen with its four facts | pass |
| Signing in as that confirmed, unactivated account → Awaiting activation | pass, from `authentication.account_pending_activation` |
| Signing in as the suspended account → Account suspended | pass, from `authentication.account_suspended` |
| An unconfirmed account → the form's alert with "Resend the confirmation email" | pass; the resend lands on the registration-submitted screen, as the prototype does |
| "Back to sign in" on a message screen returns to the form without leaving the page | pass |
| Forgotten password → Check your email; the emailed link → Set a new password with the token note | pass; the token is out of the address bar afterwards |
| `/confirm-registration-email` with no token → the unusable screen with its `code:` line | pass |
| `?resend=1` → the prototype's resend screen with the added password field | pass |
| A session revoked elsewhere → Session expired, then back to the page it left after signing in | pass, checked from `/drivers` |
| A deliberate sign-out lands on the sign-in form, not on Session expired | pass (§10, deviation 8) |
| Your account, three tabs, against the real `/api/me` and `/api/me/sessions` | pass; the current session carries the accent chip and "This device" and has no Revoke |
| Update phone through the dialog | pass; the dialog closes and the panel shows the new number |
| Show permissions lists the 34 the API grants the administrator | pass |
| Access pending inside the shell with an empty navigation | pass, as an Active account whose only role was revoked |
| 1512 / 834 / 402, dark and light, on sign in, create account, an outcome screen, forgotten password, set a new password, all three account tabs and Access pending | pass; no overflow, no cut text, the art panel leaves below 1024 as the prototype's styles say |
| A dialog at 402 in the light theme (the reviewer's contrast finding) | pass; the sheet's Cancel and its primary action both read correctly |
| Database re-seeded after the checks | pass, with `--replace true` |

## 9. Test and build results

```
$ npm run typecheck
> tsc -b --noEmit
(no output)

$ npx vitest run
 ✓ src/permissions/can.test.ts (9 tests)
 ✓ src/pages/account/password.test.ts (7 tests)
 ✓ src/pages/account/outcomes.test.ts (8 tests)
 ✓ src/api/problem.test.ts (12 tests)
 ✓ src/format/labels.test.ts (7 tests)
 ✓ src/format/datetime.test.ts (11 tests)
 ✓ src/api/http.test.ts (6 tests)
 ✓ src/app/session.test.ts (6 tests)
 ✓ src/pages/account/failure.test.ts (6 tests)
 ✓ src/pages/account/token.test.ts (4 tests)

 Test Files  10 passed (10)
      Tests  76 passed (76)

$ npm run build
dist/assets/index-CXhrh6EP.css   75.25 kB │ gzip:  13.93 kB
dist/assets/index-Bj4tV2FP.js   562.15 kB │ gzip: 158.63 kB
✓ built in 693ms
```

The build warns that the single chunk is over 500 kB, as it did before this phase. No code splitting
was added: that is a build decision, not part of the wiring.

## 10. Deviations from the specification

1. **The account screens are not the specification's.** Spec §8–§10 asked for new screens on the
   app's centred card. The prototype has them, so they are ports of it and the specification's
   layout guidance is superseded (follow-up 1). Its routes, API calls, outcomes and flows are
   unchanged.
2. **The reset form asks for the email address.** Spec §10.3 describes the form behind the link as
   "new password and confirmation". The API requires `email`, `token` and `newPassword`, and the
   prototype's own reset screen shows the address field and names it in its copy. The live document
   and the design agree; the specification was wrong.
3. **There is no "repeat the password" field.** The first run added one to the create-account and
   reset forms. The prototype has neither; it has the live checklist instead, and the API does not
   take a confirmation. The port follows the prototype.
4. **The symbol rule excludes whitespace.** The prototype counts any non-alphanumeric character as
   the symbol; the API's own validator requires a non-whitespace punctuation or symbol character, so
   a password whose only symbol is a space is refused by the server. The live API wins.
5. **The driver record's audit trail is filtered on the server.** Spec §7.7 only asks for the
   authorization history. The trail used to fetch 100 audit rows and filter them in the page; it now
   uses the `EntityType` and `EntityId` filters, which is what §7.10 asks of the audit screens.
6. **The driver picker's licence hint reads the list, not a record.** The list projection carries
   the licence number, so the hint comes from the list the picker already has.
7. **The driver history keeps the reviewed order.** The endpoint's order is fixed (newest first),
   but the reviewed screen shows open periods first and then the most recent boundary. The page
   sorts the one returned page to keep that; it is ordering, not a second request.
8. **A deliberate sign-out no longer raises the session-end signal.** Emptying the cache refetches
   the page's watched queries, whose 401s used to raise it, so signing out from a page with queries
   of its own reached the sign-in page carrying "your session has ended". It was harmless while that
   was a small line above the form; with the prototype's full Session expired screen it was plainly
   wrong. `beginSignOut()` / `endSignOut()` hold the signal down for the length of the sign-out.
9. **Needs attention no longer reads the active assignments.** Its queue is registrations, open
   interruptions and planned handovers; the active list only fed counters that the summary now
   serves.
10. **`AccessProvider` has a fourth state.** Spec §6.2 names three. An API that does not answer at
    all is neither signed in nor signed out, so it has its own state and its own card.
11. **Two additions to shared components.** `Chip` gained the prototype's `accent` tone, for the
    current session's chip, and `Dialog` gained `hideCancel`, for the prototype's read-only access
    sheet, whose single action is Close. Neither changes an existing screen.

## 11. Open risks

1. **The Overview still reads a page of vehicles** to count the available ones (§3, item 4). On a
   large fleet that read grows; the summary count would remove it.
2. **The shell's open-work queue runs on every page.** Three list requests follow the user around,
   as they did before this phase. They are cheap against the seeded data and cached for the default
   stale time, but they are the next thing to look at if a page feels slow.
3. **`GET /api/me` is fetched once per full page load and cached for a minute.** A permission granted
   or revoked while someone is signed in reaches them at the next reload or after that minute, not
   immediately.
4. **The build is a single 562 kB chunk.** It was already over the warning threshold before this
   phase. Code splitting is a decision for whoever hosts the app.
5. **The audit list's "Recent security activity" card is dominated by sign-in events** on a database
   that has been used (§4, question 3).
6. **The seeded transfer can now be accepted for real.** Accepting it makes Liga Brice the System
   Administrator and demotes the seeded one, which changes every screen. Re-seed with
   `--replace true` after trying it.
7. **Access pending has no seeded way in.** Reaching it means revoking someone's only role, which
   changes the dataset; re-seed afterwards.
