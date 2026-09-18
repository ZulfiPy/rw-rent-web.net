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
7. **The transfer-acceptance screen after a wrong password** (Follow-up 6 report §3.1, awaiting the
   owner's decision). A wrong password on `/accept-administrator-transfer` is answered by the API with
   the same code as a dead link (`system_administrator.transfer_not_usable`, on purpose, so the answer
   never says which was wrong), and the app then shows "This transfer link cannot be used" although
   the link still works; the person is told to ask for a new link they do not need. Options: (a)
   frontend only, keep the form on that code and show a message naming both causes ("The password did
   not match, or this link can no longer be used…"); (b) a distinct backend code for a wrong password.
   Recommendation: (a), in the next frontend follow-up.
6. Tasks and Insurance cases are sample-data placeholders (`src/pages/overview/sample.ts`,
   `src/pages/simple/`). The owner parked their design on 2026-09-16 (facts gathered: the prototype
   defined only a queue stub for each; the backend has nothing; the vehicle carries no policy,
   road-tax or inspection dates). The app ships without them until that phase is opened.

## 5. Testing — where it stands (2026-09-17)

Run 1 (2026-09-16) found T-001…T-006. They were fixed by the backend's round 3 and by the app's
Follow-ups 4 and 5 (commits `9127ea1` … `d9d4f07`): the permission of a page now comes from the
route that matched, out of one table the routes and the navigation are both generated from
(`src/app/routes.tsx`); every dialog submission passes one synchronous gate; the four emailed-link
pages start over on every arrival; the refusal codes the app knows were checked against the
backend's catalogues. Run 2 (`Context/testing_report.md`, 2026-09-17, 3 h 21 min) confirmed all of
them fixed, including 540 spellings of the guarded addresses, walked the first start on an empty
database from nothing to a returned rental and an offline recovery without a defect, and found three
new Major defects: T-007 on the backend (its round 4, `RWRentApi-wiring/Context/round4_spec_and_plan.md`)
and T-008 and T-009 here (§6). The sections that specified Follow-ups 4 and 5 were removed as
implemented and tested; git history keeps them. The agreed order from here: this one fix round, the
reviewer's verification with the tester's own steps, then the owner's check on real data (§1), then
the merge (§3).

## 6. Follow-up 6 — testing run 2's frontend findings

> **Status: IMPLEMENTED 2026-09-18** (commits `a800dc4` Wiring 19 and `e89beef` Wiring 20; report
> `Context/wiring_report.md`). The agent, working under rules that forbid it to type a real password
> into a page, ran the refused-then-corrected pattern on every public form and the T-007 race, and
> handed the signed-in checks over. The reviewer ran those the same day in a headless browser: on
> `/sign-in` a wrong password then the right one gives two requests (401, then 200) and lands on the
> Overview; on a real reset link a weak password then a strong one gives two requests (400, then 204)
> and "Password changed"; three Enters on the phone dialog send one request; as the administrator,
> the timeline correction of the tester's assignment saved with the dates untouched answers 200, the
> note changed and all four stored instants byte-identical (the controls showed minutes, the request
> carried the stored microseconds). Typecheck, 167 tests and the build are green. One leftover, on
> the transfer-acceptance screen, is backlog item 7 (§4). The reproduction steps of both findings are
> in `Context/testing_report.md` §2.2.

- F6-1. **A form can be submitted again after it was refused (T-008, Major).** After one refused
  request the sign-in form is dead: a wrong password, then the right one, sends nothing until the
  page is reloaded. The same on the reset form after a weak password, and on every public form.
  Cause, confirmed in the code: `SignIn.tsx`, `Register.tsx` and `ResetScreen` in `AuthLayout.tsx`
  call `gate.attempt` and nothing ever calls `gate.settle`; only the dialogs' hook and sign-out
  settle theirs. Follow-up 4 added the gate and tested that it closes; nothing tested that it opens.
  Change: make forgetting impossible. The gate is owned by one small hook that wraps a mutation and
  settles it in `onSettled`, success or failure, and every public form submits through it;
  `ResetScreen` takes a gated submit from its caller instead of owning a gate that cannot know when
  the request ended. Tests: refused then corrected makes two calls; a success keeps the gate shut
  only until it settles; a rate-limited answer reopens it too.
- F6-2. **An instant the person did not touch is sent exactly as it is stored (T-009, Major).** The
  date-time controls show minutes; stored instants can carry seconds. Every dialog that prefills an
  instant converts it to minutes and back, so saving a correction without touching the dates sends
  four changed instants, and the timeline correction of a seeded assignment answers
  `409 corrections.timeline_invalid` with no field marked. It applies wherever a stored instant is
  prefilled (`src/pages/fleet/AssignmentDialogs.tsx`): the planned-dates update, the authorization
  correction, the interruption update and correction, the timeline correction. Change: one helper in
  `src/format/datetime.ts` keeps the stored instant when the control still shows what it was
  prefilled with and converts only a control the person changed; an emptied control is still null.
  Tests: an untouched instant with seconds and with microseconds comes back byte-identical; a
  changed control converts as today, in both offset seasons; an emptied one is null.
- F6-3. Tests as named above; typecheck, tests and build green; reviewed screens keep their markup
  and CSS; no new runtime dependency.
- F6-4. **The joint check**, against the round-4 API and the seeded database; ask the owner for the
  seed password in your first message if it is not in the environment, and wait. The tester's own
  steps for T-008 on `/sign-in` and on a real reset link from Mailpit, then the same
  refused-then-corrected pattern on every other public form (register, the resend screen, the
  forgotten-password request, the email-change confirmation where it can be refused, the transfer
  acceptance with a wrong then a right password); the tester's own steps for T-009 on assignment
  `2d7b5c86-0007-42d7-92d7-000000000007`, then every other prefilled-instant dialog saved without
  touching its dates on a seeded record, and once with one date changed; T-004 again on the phone
  and the interruption dialogs, one request each; the backend's T-007 steps once through two browser
  sessions if the app can produce them. Re-seed with `--replace true`; leave both apps running.
- F6-5. Report: `Context/wiring_report.md` rewritten for this run, the joint check's outcomes in its
  verification section. Commits `Wiring 19: …` for the change with its tests and `Wiring 20: …` for
  the report. This document is not edited by the agent.

## 7. Follow-up 7 — what the owner finds while checking on real data

> **Status: COLLECTING (started 2026-09-18).** The owner walked the go-live sequence on this Mac
> (empty database, the dedicated administrator bootstrapped, the company "RW-Rent OÜ" created, the
> daily account activated as Company Principal) and is now checking the app on real data. Each
> thing they notice is written here with the detail the implementation agent needs; the follow-up is
> specified and authorised when the check is over, as one batch.

- F7-1. **Times shown in UTC where the owner reads local time.** Seen on the Security audit page
  (column "OCCURRED (UTC)", the page description says "All times UTC"): entries read three hours
  earlier than the clock on the wall. The app does this by design, inherited from the prototype:
  operational screens render Europe/Tallinn through `formatLocal`, while the audit list and entry
  page, the sessions tab, the System Administrator page's transfer times and the Overview's activity
  card render UTC through `formatUtc`, `formatUtcHuman` and `formatUtcLabelled`
  (`src/format/datetime.ts`; used in `src/pages/audit/SecurityAudit.tsx`, `AuditEntry.tsx`,
  `src/pages/admin/SystemAdministrator.tsx`, the profile's sessions tab, `src/pages/overview/Overview.tsx`).
  Owner's expectation: the same local time everywhere a person reads a time. Change: those
  surfaces render Europe/Tallinn like the rest of the app, the "(UTC)" column heading and the "All
  times UTC" description go, and one small note names the zone where a page used to say UTC; the
  API keeps speaking UTC and nothing sent to it changes. Tests: the formatting helpers on a fixed
  instant in both offset seasons. Side: frontend.
