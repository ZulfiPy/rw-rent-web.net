# Frontend Wiring — what remains

> **The single document of the frontend wiring phase.** The phase is implemented and verified
> (commits `2a2cece` … `53df077` on `feature/backend-wiring`, 2026-09-15/16): the app runs on the
> real API, the mock is gone, every screen reads the projections the backend serves, the account area
> is a port of the prototype (`Context/prototype/RW-Rent.dc.html`, the design source, stays in this
> folder), and the three follow-ups are in. The phase's specification, plan, follow-up ledger and
> reports were removed as implemented; git history keeps them. What is still to do is below.
>
> Working folders: this app in `/Users/zulf/rw-rent-api/rw-rent-web-wiring` (branch
> `feature/backend-wiring`); the backend in `/Users/zulf/rw-rent-api/RWRentApi-wiring` (same branch
> name). The main checkouts stay untouched until the merge gate (§3) opens. Rewritten 2026-09-16.

## 1. The owner's manual check (the gate before the merge)

Deferred by the owner on 2026-09-16. Decided the same day: the app ships without Tasks and Insurance
cases for now (their brainstorm is parked), and an **independent testing phase** runs first, by a
separate agent in a fresh session, against both the API and the app as they are: brief in
`Context/testing_brief.md`, report in `Context/testing_report.md`. Its findings become the next
follow-ups on the side they name. After that, and after the seed data is replaced with real data,
the owner works through the tables of §2 on their devices, with the accounts listed there (or the real
ones by then), the app at `http://localhost:5173`, the API at `http://localhost:5001`, emails at
`http://localhost:8025`, the seed password kept outside the repository. Differences from the
prototype found there become the next follow-up.

## 2. Verification tables and accounts

### 2.1 Account screens — prototype screen → app route → what to compare

| Prototype screen | App route | What to compare |
|---|---|---|
| `signin` | `/sign-in` | title, the two fields, "Forgot password?" on the password's label row, the black Sign in with its arrow, "No account yet? Create one", the footer line, the art panel |
| `register` | `/register` | the two names on one row, the phone placeholder, the four-rule checklist filling in as you type (four rules by the owner's decision; the prototype still shows five) |
| `register-submitted` | `/register` after Create account | the mail glyph, both facts, the two actions |
| `confirm-checking` · `confirm-done` · `confirm-bad` | `/confirm-registration-email` | the glyph and its colour, the fact list, the mono `code:` line |
| `resend` | `/confirm-registration-email?resend=1` | title and body; the app adds the password field the API requires (backlog item 1) |
| `pending` | `/sign-in` as a confirmed but unactivated account | five facts, the warn hourglass |
| `rejected` · `expired` · `suspended` | `/sign-in` as each account | glyph, colour, actions |
| `session-expired` | `/sign-in` after a session is revoked elsewhere | the warn clock, "Sign in again", and that it returns to the page you were on |
| `rate-limited` | `/sign-in` after repeated attempts | the `HTTP 429` mono line |
| `forgot` · `forgot-sent` | `/reset-password` | the email field with its note, "Send reset link", then the outgoing-mail screen |
| `reset` · `reset-bad` | `/reset-password` from the emailed link | the token note with its key glyph, the checklist, then the unusable screen with the API's code |
| `transfer-accept` | `/accept-administrator-transfer` | title, body, the existing-password field and its note (backlog item 1 for the two fields the API does not take) |
| `profile` · Profile | `/profile` | the two panels, "Update phone", "Show permissions" |
| `profile` · Sign-in & security | `/profile?tab=security` | both panels, their notes, the dialogs behind Change password and Change email |
| `profile` · Your sessions | `/profile?tab=sessions` | the six columns, the Current chip and "This device", "Revoke other sessions" |
| `noaccess` | any route as an account with no permissions | the info banner, both panels, the empty navigation |

### 2.2 Every other screen — compare with the mock's rendering, and what to try

| Screen | Compare with the mock's rendering | Try |
|---|---|---|
| Overview | metric cards, Needs attention, assignment mix, activity card | the counts: 4 active of 12, 2 planned, 2 vehicles available of 8 active, 3 registrations |
| Needs attention | the same five rows in the same order | open each row; the two interruptions and the planned handover without a driver |
| Rental assignments | coverage column, Interrupted chip, model and type sub-lines | filter by status; filter by a planned or started date range; open 552 KLM (collective coverage, one open interruption) |
| Assignment record | Parties, Lifecycle, Notes, the two tabs, Corrections | cancel a Planned assignment with a note; then read Notes and Corrections |
| Assignment record, Active | the mistaken-activation cancel | cancel without a note: the message appears under the note field, not above the form |
| Vehicles | availability chips and their sub-lines | in use 482 TKL, 770 HDV, 552 KLM, 204 JLM; reserved 444 WKS and 335 SNB; retired 881 GRT, 660 BYH |
| Vehicle record | the same chip as the list, rental history | open 444 WKS from the list |
| Drivers | personal identifier, licence, address columns | search; open Janis Krumins |
| Driver record | the authorization history table | vehicle, customer and status come from the row; the audit panel shows the creation |
| Customers, Customer record | unchanged | open a business and a private customer |
| User directory, User record | Registered column, roles, sessions | open Dita Smite (four role rows) and Imants Gailis (the rejection reason); grant a role with an expiry date and revoke it |
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

## 3. Merge gate

Both `feature/backend-wiring` branches merge into their `main` only after the owner's manual check
(§1) passes with the wired backend and the wired app running together. Until then the main
checkouts stay untouched, both branches keep receiving the next phases' commits, and the developer
database keeps the seeded dataset.

## 4. Backlog — known, not scheduled

1. The prototype file is out of date in two places (decisions 5 and 6): its transfer-acceptance
   screen shows an email and a new-password field the API does not take, and its resend screen lacks
   the password field the API requires. The app is right; the prototype is the reference for looks
   only. Correct the file if it is ever edited again.
2. The Button `block` variant with the primary tone has poor contrast in the light theme; phone-sized
   dialog sheets use it. Check on the phone in the light theme during §4; fix as a shared-component
   change if confirmed.
3. `GET /api/me` is cached for a minute after a full page load: a role granted or revoked while
   someone is signed in reaches them at the next reload or after that minute.
4. The build is a single chunk over the bundler's size warning (about 560 kB); code splitting is a
   hosting-time decision.
5. The shell's open-work queue runs three list requests on every page; cheap on the seeded data,
   the first thing to look at if a page ever feels slow.
6. Tasks and Insurance cases are sample-data placeholders (`src/pages/overview/sample.ts`,
   `src/pages/simple/`). The owner parked their design on 2026-09-16 (facts gathered: the prototype
   defined only a queue stub for each; the backend has nothing; the vehicle carries no policy,
   road-tax or inspection dates). The app ships without them until that phase is opened.

## 5. Testing run 1 — reviewed 2026-09-17; decisions taken the same day (§6, and the backend's round 3)

The independent tester's report is `Context/testing_report.md` (run 1, 2026-09-16: 82 operations ×
four roles and anonymous, every rule id, 522 route/width/theme combinations, the scenario
catalogue). No blocker, no unauthorized write, no data loss, no unexpected 500. Six items; all five
defects were confirmed in the code by the reviewer. Only the report was committed; both apps kept
running from the wiring folders; the dataset was re-seeded.

| Id | Side | What | Reviewer's note |
|---|---|---|---|
| T-001 | Frontend | `/system-administrator` typed into the address bar shows any signed-in person as the "Current System Administrator" with an enabled Initiate transfer; the API refuses the action with 403 | Confirmed: `App.tsx` has no per-route permission guard, and the page falls back to `me` when it cannot resolve the administrator. Fix: a route guard from the permission the navigation already carries, for every route, and no fallback to `me`. Major. |
| T-004 | Frontend | Enter pressed twice sends the request twice | Confirmed: `useActionMutation.submit` has no in-flight guard and all 42 dialog submissions go through it, so one fix covers them all. **The reviewer rates it Major, not Minor**: the API accepts two identical interruptions (verified live, 201 and 201; INTERRUPT-007 allows overlaps) and interruptions are never deleted, so a double Enter leaves a permanent duplicate. |
| T-005 | Frontend | A spent confirmation or reset link reopened in the same tab keeps showing the old success screen and sends nothing | Confirmed: the pages read the token once and keep their finished state. The practical case is a second, valid link opened in the same tab being ignored. Fix: reset the page when a new fragment arrives. Minor. |
| T-002 | Backend | The contract documents validation errors as `oneOf` two shapes that both match | Backend backlog item 11. Documentation only. |
| T-003 | Backend | A 17-character VIN with a space around it is refused for length before it is trimmed | Backend backlog item 12. The app trims before sending, so an operator never meets it. |
| T-006 | Both | A driver born today can be created and authorised; the rules only refuse a future birth date | Owner question: backend backlog item 13. |

Coverage the run did not reach, for a second run after the fixes: the first-run path on an empty
database (bootstrap of the first administrator, creating the Company, the first Principal — the
go-live path once the seed is replaced by real data); several scenarios driven on the API only and
not through the app (the private-customer day, the double booking, promotion and suspension of new
staff, accepting the transfer through the app, the correction dialogs' mutations, the signed-in
password-change and email-change click-throughs); expiries that need real waiting (2 h idle, 12 h
absolute, 15 min lockout release, 1 h reset, 24 h confirmation); an induced email failure; a whole
browser restart.

## 6. Follow-up 4 — the testing run's frontend findings

> **Status: IMPLEMENTED 2026-09-17** (commits `9127ea1` Wiring 14 and `6329f0e` Wiring 15; report
> `Context/wiring_report.md`), **with one hole found in the review: Follow-up 5 (§7).** The agent
> built F4-1…F4-5 and ran no joint check, because it never had the seed password. The reviewer ran
> it the same day in a headless browser: `/system-administrator` as Principal, Fleet Manager and
> Viewer shows the lock, no administrator panel, no transfer button and sends nothing; a Viewer's
> typed `/registrations`, `/security-audit` and an audit record are locked while the pages they may
> read open; three Enters on the phone dialog send one request; two Enters plus a click on the
> interruption dialog send one request and store one row; the same interruption entered again
> answers 409 with the API's message in the dialog and no new row; the two age refusals appear under
> the Driver field; after a finished reset a second valid link in the same tab brings the form back
> and completes, and the spent link is sent again and refused. Typecheck, 119 tests and the build
> are green. Originally authorised to run in the same agent run
> as the backend's round 3 (`RWRentApi-wiring/Context/round3_spec_and_plan.md`), after it, in this
> worktree, against the API rebuilt from that round with its migration applied. Owner decisions of
> 2026-09-17 behind it: a named driver must be at least 18 on the authorization date; the API also
> refuses an exact duplicate interruption; a second testing run follows the fixes.
> The reproduction steps of every finding are in `Context/testing_report.md` §2; use them.

- F4-1. **Routes are guarded by permission, not only the menu (T-001, Major).** Every route is
  reachable by typing its address, and `/system-administrator` then shows the signed-in person as
  the "Current System Administrator" with an enabled Initiate transfer. One guard, fed from the same
  permission the navigation already carries for that destination (`src/app/AppShell.tsx`), wraps
  every route; a record route takes its list's permission. A person without the permission gets the
  restricted state the app already uses for a refused list (the lock icon, "Not available to you"),
  inside the shell, with no page content behind it and no request sent. `/overview`,
  `/needs-attention`, `/profile`, `/tasks` and `/insurance-cases` need no permission. Separately,
  the System Administrator page never falls back to the signed-in person when it cannot resolve the
  administrator: it shows the app's dash.
- F4-2. **Every submission happens once (T-004, rated Major by the reviewer).** Enter pressed twice
  sends the request twice, because nothing blocks the second submit before React has re-rendered the
  busy state. All 42 dialog submissions go through `useActionMutation`: give its `submit` a
  synchronous in-flight guard, and make `Dialog` ignore a submit while busy. The account pages that
  use `useMutation` directly (sign in, register, reset, resend, the emailed-link pages, transfer
  acceptance) and any other form that submits get the same guard through one small shared helper.
  The consequence that matters: the interruption dialog created two identical permanent records.
- F4-3. **An emailed-link page starts over when a new link arrives (T-005).** After a link has been
  used, opening a link again in the same tab keeps the finished screen and sends nothing, so a
  second, valid link is ignored. All four pages (`/confirm-registration-email`, `/reset-password`,
  `/confirm-email-change`, `/accept-administrator-transfer`) reset their state and read the new
  token when the fragment changes, then remove it from the address bar as before.
- F4-4. **The backend's round-3 refusals are shown where they belong.** Three new conflict codes:
  `assignment_authorizations.driver_birth_date_required` and
  `assignment_authorizations.driver_underage` appear under the driver field wherever a named
  authorization is started or corrected (the new-assignment form, the start and replace dialogs,
  the authorization correction); `drivers.birth_date_breaks_open_authorization` under the date of
  birth in the driver dialog; `assignment_interruptions.duplicate` under the start field of the
  interruption create, update and correction dialogs. Messages are the API's own. Nothing else in
  the UI changes; `dto.ts` follows the live OpenAPI document.
- F4-5. Tests: the guard's decision as a pure function over a route and a permission list; the
  submit-once helper (two synchronous submits, one call); the link page's reset on a new fragment;
  the three codes' field mapping.
- F4-6. Report: `Context/wiring_report.md`, created anew for this run (the phase's earlier report was
  removed when the phase closed): summary; implemented; not implemented or partial; decisions
  needed; verification; tests and build; deviations; open risks. One file; a later run rewrites it.

**The joint check**, after F4-1…F4-5, against the round-3 API and the seeded database: repeat the
tester's own steps for T-001 as each of the three ordinary roles (restricted state, no
administrator panel, no request); type every guarded address as a Viewer; T-004 on the phone dialog
and on the interruption dialog (exactly one request, exactly one record); T-005 for the confirmation
and the reset link, including a second valid reset link in the same tab; an authorization for a
driver without a birth date and for one aged 17 (the messages under the driver field); the same
interruption entered twice by hand (the message under the start field); then every route once as
each role to prove nothing else moved. Re-seed with `--replace true`; leave both apps running.

Acceptance: the checks above pass; typecheck, tests and build green; reviewed screens keep their
markup and CSS.

## 7. Follow-up 5 — the guard and the router must agree (found in the review of Follow-up 4)

> **Status: IMPLEMENTED 2026-09-17** (commits `06b6027` Wiring 16, `3f31cad` Wiring 17, `d9d4f07`
> Wiring 18; report `Context/wiring_report.md`, which covers Follow-ups 4 and 5). Frontend only. The
> agent ran the joint check in full this time and found and fixed one defect of its own on the way:
> the same link arriving a second time in a finished tab left the page on its spinner (Wiring 17).
> Verified by the reviewer the same day: typecheck, 149 tests and the build green; as a Viewer every
> spelling of the guarded addresses (`/System-Administrator`, `/SYSTEM-ADMINISTRATOR`,
> `/%73ystem-administrator`, `/REGISTRATIONS`, `/Registrations/`, `/Security-Audit`, a trailing
> slash) shows the lock with no request sent, and an extra segment falls to the Overview like any
> unknown address; the double-submit and duplicate-interruption checks still hold. The permission
> now comes from one route table (`src/app/routes.tsx`) that the routes and the navigation are both
> generated from. Next: testing run 2 (`Context/testing_brief.md` §13).

- F5-1. **An address written differently walks past the guard.** Verified by the reviewer as a
  Viewer: `/System-Administrator`, `/SYSTEM-ADMINISTRATOR` and `/%73ystem-administrator` render the
  System Administrator page with an enabled Initiate transfer again (the name is a dash now, the
  page and the action are back); `/REGISTRATIONS` renders the registrations page; `/Security-Audit`
  renders the audit page, which sends its request and gets the API's 403. The lower-case addresses,
  a trailing slash and an extra segment are guarded correctly. Cause: React Router matches a path
  without regard to letter case and after decoding it, while `routePermission` looks the raw first
  segment up exactly as typed. Change: the permission is decided from **the route that matched**,
  never from the text of the address. One table carries each route's path, element and permission
  (`null` said explicitly); the routes and the navigation are generated from it; the guard takes the
  matched route's permission. Whatever address the router resolves to a page then gets that page's
  permission, and a route cannot exist without a declared one. Tests: the decision for the same
  destination written in another letter case, percent-encoded, with a trailing slash, with extra
  segments and with a query; every route of the table has its entry.
- F5-2. **The refusal codes the app knows are the codes the backend sends** (the agent's own open
  risk 1). `src/api/codes.ts` names five codes that do not exist in the backend's catalogue
  (`driver_already_open`, `collective_requires_business`, `collective_already_open`,
  `named_and_collective_exclusive`, `from_required`); the real ones are `duplicate_open_named`,
  `collective_requires_business_customer`, `duplicate_open_collective` and `mixed_open_modes`, and
  there is no `from_required`. Correct them, then sweep the whole table against the backend's error
  catalogues (the `*Errors.cs` and `*Conflicts.cs` files under
  `RWRentApi-wiring/src/RWRentApi.Application`), so every entry names a code the API really returns
  and lands under the field it names. The report lists what was corrected.
- F5-3. **The joint check is run this time.** Ask the owner for the seed password before anything
  else, and wait for it. Then: the address variants of F5-1 as each of the three ordinary roles
  (lock, no page content, no request); §6's joint check in full; one corrected code of F5-2 seen
  under its field in the app. Re-seed with `--replace true`; leave both apps running.
- F5-4. Report: `Context/wiring_report.md` rewritten to cover Follow-ups 4 and 5. Commits
  `Wiring 16: …` for the change with its tests and `Wiring 17: …` for the report.
