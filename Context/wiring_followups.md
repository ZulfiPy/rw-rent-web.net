# Frontend Wiring — what remains

> **The single document of the frontend wiring phase from here on.** Phases 1–8 are implemented
> (commits `2a2cece` … `0e49285` on `feature/backend-wiring`): the app runs on the real API, the mock
> is gone, every screen reads the projections the backend serves, and the account area is a port of
> the prototype (`Context/prototype/RW-Rent.dc.html`, the design source, stays in this folder). The
> specification, plan and report of those phases were removed on 2026-09-16 as implemented; what is
> still to do is below. The agent's report is one file, `Context/wiring_report.md`, rewritten at the
> end of every run; the agent's chat reply is a plain-language overview only.
>
> Working folders: this app in `/Users/zulf/rw-rent-api/rw-rent-web-wiring` (branch
> `feature/backend-wiring`); the backend in `/Users/zulf/rw-rent-api/RWRentApi-wiring` (same branch
> name). The main checkouts stay untouched until the merge gate (§6) opens.
>
> Rewritten 2026-09-16.

## 1. Owner decisions taken so far (2026-09-15/16)

| # | Decision |
|---|---|
| 1 | The reset form keeps its email field (the API requires it). |
| 2 | The Overview's "Recent security activity" card hides routine sign-in and sign-out events; the audit page keeps everything. |
| 3 | The password checklist drops the "lowercase letter" line: four rules, exactly what the API requires. |
| 4 | The note "The reset must be completed with the address the link was sent to" appears only on the two password-reset screens, not on resend or transfer acceptance. |
| 5 | The transfer-acceptance screen keeps the port's single existing-password field (the API takes the token and that password only); the prototype's extra email and new-password fields are a prototype error, noted in §7. |
| 6 | The resend-confirmation screen keeps the password field the port added (the API requires it); a prototype omission, noted in §7. |
| 7 | The three values the app shows as dashes or computes itself come from the backend's round 2 (`RWRentApi-wiring/Context/wiring2_spec.md`): `availableVehicles` on the overview summary, `passwordChangedAtUtc` and `pendingEmail` on `GET /api/me`. |
| 8 | Follow-up 3 (§8, the two day-bound helpers report UTC) runs now, before the owner's manual check. |
| 9 | The backend's own hardening for offsets (its `Context/backlog.md` item 10, accept any offset) waits until after the merge, in the next backend round together with the seed revision. |
| 10 | The seed revision also writes one password-history entry per seeded account, so "Last changed" on a seeded database reads the seeding moment (backend backlog item 1). |

## 2. Follow-up 2 — implemented

> **Status: IMPLEMENTED** (commits `12b11c3` Wiring 9 and `238c8bb` Wiring 10, 2026-09-16; report
> `Context/wiring_report.md`). Verified on 2026-09-16 by the reviewer: typecheck, 89 tests and the
> build green; the register checklist shows four rules; the reset note renders on the two reset
> screens only and not on the resend or transfer screens; the summary's `availableVehicles` equals
> the vehicles list's Available count on the live API; `GET /api/me` carries both profile facts.
> Wiring 10 was not on the list below: the agent's joint check found that every lifecycle dialog sent
> its instant with the zone's offset, which the API cannot store (500), and `fromLocalInput` now
> reports UTC. The same defect survives in two other helpers — Follow-up 3 (§8).

- F1. Activity card (decision 2): the Overview's Recent security activity card requests a larger page
  of the audit list (`PageSize=25`), drops entries whose event type is `Authentication.SessionCreated`
  or `Authentication.Logout`, and shows the first five that remain; when fewer than five remain it
  shows what there is; the card's link to the full audit page is unchanged. No other event type is
  filtered.
- F2. Password checklist (decision 3): remove the lowercase rule from the checklist and from the
  client-side validation on `/register`, `/reset-password` and the change-password dialog; the four
  remaining rules and their wording stay as the prototype has them; the server remains the final
  judge.
- F3. Reset note (decision 4): the note on the shared email field renders only on the forgotten
  password screen and the set-a-new-password screen.
- F4. Adopt the backend's round-2 members: the Overview's vehicles card reads `availableVehicles`
  from the summary and stops reading a page of vehicles; the Sign-in & security tab shows "Last
  changed" from `passwordChangedAtUtc` and "Pending change" from `pendingEmail` ("<address> —
  awaiting confirmation", "None" when null), and the two "The API does not report this yet" notes
  go; `dto.ts` gains the three members from the live OpenAPI document.
- F5. Tests: the card filter (a pure function over a list of entries), the checklist rules, the
  profile facts' rendering from a `me` object with and without the values.
- F6. Report: rewrite `Context/wiring_report.md` (all runs, eleven sections; §2 keeps the two tables
  of §5 below and the accounts).

Acceptance: the card shows no sign-in or sign-out rows on the seeded database after a few sign-ins;
a password with no lowercase letter passes the checklist and the API; the note is absent on the
resend and transfer screens; the Overview's vehicles card equals the summary's numbers with no
vehicles request in the network tab; the profile tab shows a date and "None" for the seeded
administrator; typecheck, tests and build green.

## 3. The joint check (the agent's part of the testing)

After F1–F6, with the round-2 API rebuilt and restarted and the app restarted: sign in as the seeded
administrator, open every route, and drive once: a Planned cancellation with a note, the activity
card, the vehicles card, the profile's three tabs including a password change and an email-change
request (then confirm it through Mailpit), a session revoke, sign out, sign in as Signe Priede and as
Toms Rudzitis and confirm what each sees matches §5. Record the outcomes in the report's
verification section. Re-seed with `--replace true` afterwards so the owner starts from the clean
dataset, and leave both apps running.

## 4. The owner's manual check (the gate before the merge)

The owner works through the two tables of §5 on their devices, with the accounts listed there, the
app at `http://localhost:5173`, the API at `http://localhost:5001`, emails at
`http://localhost:8025`, the seed password kept outside the repository. Differences from the
prototype or the mock found here become Follow-up 4.

## 5. Verification tables and accounts (carried from the report of 2026-09-15)

### 5.1 Account screens — prototype screen → app route → what to compare

| Prototype screen | App route | What to compare |
|---|---|---|
| `signin` | `/sign-in` | title, the two fields, "Forgot password?" on the password's label row, the black Sign in with its arrow, "No account yet? Create one", the footer line, the art panel |
| `register` | `/register` | the two names on one row, the phone placeholder, the four-rule checklist filling in as you type (decision 3; the prototype still shows five) |
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

### 5.2 Every other screen — compare with the mock's rendering, and what to try

| Screen | Compare with the mock's rendering | Try |
|---|---|---|
| Overview | metric cards, Needs attention, assignment mix, activity card | the counts: 4 active of 12, 2 planned, 2 vehicles available of 8 active, 3 registrations |
| Needs attention | the same five rows in the same order | open each row; the two interruptions and the planned handover without a driver |
| Rental assignments | coverage column, Interrupted chip, model and type sub-lines | filter by status; filter by a planned or started date range (Follow-up 3); open 552 KLM (collective coverage, one open interruption) |
| Assignment record | Parties, Lifecycle, Notes, the two tabs, Corrections | cancel a Planned assignment with a note; then read Notes and Corrections |
| Assignment record, Active | the mistaken-activation cancel | cancel without a note: the message appears under the note field, not above the form |
| Vehicles | availability chips and their sub-lines | in use 482 TKL, 770 HDV, 552 KLM, 204 JLM; reserved 444 WKS and 335 SNB; retired 881 GRT, 660 BYH |
| Vehicle record | the same chip as the list, rental history | open 444 WKS from the list |
| Drivers | personal identifier, licence, address columns | search; open Janis Krumins |
| Driver record | the authorization history table | vehicle, customer and status come from the row; the audit panel shows the creation |
| Customers, Customer record | unchanged | open a business and a private customer |
| User directory, User record | Registered column, roles, sessions | open Dita Smite (four role rows) and Imants Gailis (the rejection reason); grant a role with an expiry date and revoke it (Follow-up 3) |
| Registrations | All lifecycle states in one page | the five people; then each single-status filter; activate Gatis Lapsa with a role |
| Security audit | list filters, entity chips | filter by event type and by entity type; open any row |
| Audit entry | the payload diff | open the Registration · Activated entry: the role grant reads "Viewer — no expiry" |
| System Administrator | transfers table | the one open transfer to Liga Brice, Awaiting acceptance; Resend asks for your password |

### 5.3 Seeded accounts (same password for all, set by the owner when seeding)

| Role | Email | Name | What they see |
|---|---|---|---|
| System Administrator | `sysadmin@rwrent.example` | Arturs Veidenbaums | everything, including Corrections and the System Administrator page |
| Company Principal | `signe.priede@rwrent.example` | Signe Priede | the company's records, role administration, the company's audit history |
| Fleet Manager | `karlis.zvaigzne@rwrent.example` | Karlis Zvaigzne | fleet and rental work, registrations to review |
| Viewer | `toms.rudzitis@rwrent.example` | Toms Rudzitis | read-only across the fleet |
| Viewer + Fleet Manager | `dita.smite@rwrent.example` | Dita Smite | four role rows in her record, one of them expiring |
| Suspended | `raivis.dumins@rwrent.example` | Raivis Dumins | cannot sign in; the Account suspended screen says why |

## 6. Merge gate

Both `feature/backend-wiring` branches merge into their `main` only after the owner's manual check
(§4) passes with the round-2 backend and the Follow-up 2 app running together. Until then the main
checkouts stay untouched and the developer database keeps the seeded dataset.

## 7. Backlog — known, not scheduled

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
6. Tasks and Insurance cases remain sample-data placeholders until their backend exists.

## 8. Follow-up 3 — found in the review of 2026-09-16

> **Status: IMPLEMENTED** (commits `d61ebbd` Wiring 12 and `53df077` Wiring 13, 2026-09-16). Verified
> by the reviewer the same day: both helpers return the instant in UTC, no offset is written anywhere
> under `src/`, the tests cover both helpers in both offset seasons and the picker round trip,
> typecheck, 91 tests and the build green; the report carries run 4 with the two live rows and the
> corrected deviation 9; the database was re-seeded after the agent's check. One defect, same family
> as Wiring 10. Nothing else from the review needed a frontend change. Feedback to the agent
> that goes with it: the joint check of run 3 filtered the assignments list by status only and
> granted no role with an expiry, so the two paths that still carry an offset were never exercised;
> and the report's deviation 9 assumed the API tolerates an offset on a value it only compares —
> Npgsql refuses a non-zero offset as a query parameter exactly as it refuses one on a stored value.
> A check of a fix has to drive every caller of the thing that was fixed.

- F3-1. **Two helpers still send instants with the zone's offset.** `startOfDayLocal` and
  `endOfDayLocal` in `src/format/datetime.ts` write `…T00:00:00.000+03:00` / `…T23:59:59.999+03:00`.
  They feed the assignments list's four date filters (`PlannedFromUtc`, `PlannedToUtc`,
  `StartedFromUtc`, `StartedToUtc` in `src/pages/fleet/Assignments.tsx`) and the role expiry in the
  three user dialogs of `src/pages/users/UserDialogs.tsx` (activate with roles, grant a role, change
  an expiry). The report's deviation 9 assumed the API only compares a filter bound and so tolerates
  the offset; it does not. Verified against the live round-2 API on 2026-09-16:
  `GET /api/rental-assignments?StartedFromUtc=2026-09-01T00:00:00.000+03:00` answers 500 and the same
  bound in UTC answers 200; `POST /api/users/{id}/roles` with `expiresAtUtc`
  `2026-12-31T23:59:59.999+02:00` answers 500 and the UTC form 201. So today a date filter on the
  assignments list and any role granted with an expiry date fail with the unexpected-error card.
  Change: both helpers resolve the same instant and return it in UTC (`toISOString()`), exactly as
  `fromLocalInput` does since Wiring 10; a test for each (the September and January offsets, the
  trailing `Z`); the report's deviation 9 corrected. Acceptance: a planned-date filter on the
  assignments list narrows the list without an error; a role granted with an expiry date appears in
  the user record with that date; typecheck, tests and build green. Side: frontend. The backend keeps
  its own hardening item (its backlog, item 10: accept any offset), so a future client cannot hit the
  same wall.
- F3-2. Report: rewrite `Context/wiring_report.md` (one file, all runs): the summary gains run 4; §8.1
  gains the two live rows (a planned-date and a started-date filter on the assignments list; a role
  granted with an expiry date, read back, then revoked); §10 deviation 9 is corrected to say that
  every instant the app sends is UTC, day bounds included, and why; §3 item 3 stays as the backend's
  hardening item. This document is not edited by the agent.

Acceptance: the two rows of §8.1 pass against the running round-2 API; `grep` finds no instant
written with an offset anywhere under `src/`; the tests cover both helpers; re-seeded with
`--replace true` afterwards; both apps left running.
