# Frontend Wiring — Follow-up 6 (testing run 2: T-008, T-009)

> Follow-up 6 answers the second testing run's two frontend findings (`Context/testing_report.md`
> §2.2): T-008, a refused public form that could never be sent again, and T-009, dialogs that
> rounded stored instants they had only prefilled. It ran in the same agent run as the backend's
> round 4, after it (`RWRentApi-wiring/Context/round4_report.md`). Worktree
> `/Users/zulf/rw-rent-api/rw-rent-web-wiring`, branch `feature/backend-wiring`. Written
> 2026-09-18. It replaces the report of Follow-ups 4 and 5, which git history keeps (`d9d4f07`).
>
> **For the agent that checks this run: §5 lists what is still yours to run.** The joint check
> covered every step that needs no real password and all of them passed. The steps that need a
> real password typed into the app were not run (§3.2), because the implementing agent may not
> type one into a web page. That includes T-009 in the browser and every signed-in dialog.

## 1. Summary

| Commit | What |
|---|---|
| `a800dc4` | Wiring 19: a refused form can be sent again, and an untouched instant is sent as stored |
| (this one) | Wiring 20: this report |

`npm run typecheck` is clean. `npx vitest run` is green: **167 tests across 15 files**, up from 149;
the 18 new ones are listed in §2.3. `npm run build` is green, with the chunk-size warning it
already had (backlog item 4). No `.module.css` file and no JSX structure of a reviewed screen was
touched. The change is in submit handlers, hooks and request bodies only, and `package.json` is
unchanged.

**T-008** had one cause in the code and one outside it. Sign-in, registration and the shared reset
screen closed their submit gate and nothing ever reopened it. Now one hook owns every gate in the
app and reopens it when the request settles, whatever the answer. In the joint check, every public
form that was refused sent its corrected request. The one exception is the transfer acceptance,
where a wrong password is answered with the dead-link code and the app shows the dead-link screen.
That screen was not built into a retry; §3.1 explains why and offers the options.

**T-009**: one helper sends a stored instant back byte for byte while its control still shows what
it was prefilled with. It is used in every dialog that prefills one: the four the follow-up names,
and the role-expiry dialog besides (§7).

**Joint check**: partial (§4). Passed: every public form refused and then corrected (sign-in with a
second wrong password in place of the real one), T-004 on sign-in, the tester's T-007 pair released
25 more times with no violation, and the re-seed. Not run, and handed over in §5: the real-password
sign-in, the strong-password reset, T-009 and the other prefilled-instant dialogs in the browser,
T-004 on the phone and interruption dialogs, the email-change confirmation, and the accepted
transfer.

## 2. Implemented

### 2.1 F6-1 — a refused form can be sent again (T-008)

**The cause** was exactly the one the follow-up names. Follow-up 4 gave every form a synchronous
gate against a double Enter (T-004), `createSubmitGate` / `useSubmitGate`, and left each page to
reopen its own gate. The dialogs' `useActionMutation` and `useSignOut` did, in `onSettled`.
`SignIn.tsx`, `Register.tsx` and `ResetScreen` in `AuthLayout.tsx` called `gate.attempt` and never
`gate.settle`, so the first request, refused or not, shut the form until the page was reloaded.
Follow-up 4's tests proved that the gate closes. The only test that said it opens called
`settle()` by hand.

**The change** (`src/app/submitOnce.ts`) removes the possibility of forgetting:

- `useGatedMutation(options)` wraps TanStack's `useMutation` and owns the gate. `submit(variables)`
  closes the gate and sends. The gate reopens in the mutation's `onSettled`, which TanStack runs
  after a success and after every failure alike: a refusal, a 429, or a request that never reached
  the API. The form's own `onSettled` runs first, and the gate reopens even if that throws
  (`settlingGate`, `try … finally`). A success therefore keeps the gate shut until the success
  handling has finished, and not a moment longer.
- `useSubmitGate` is no longer exported. The only way to get a gate is the hook that also reopens
  it, so no page can hold one it could forget. `createSubmitGate` stays exported for the tests.
- Every form submits through the hook: sign-in, and the "Resend the confirmation email" link inside
  its alert; registration; both halves of the password reset; the resend screen
  (`/confirm-registration-email?resend=1`); the transfer acceptance; every dialog, through
  `useActionMutation`; and sign-out.
- `ResetScreen` no longer holds a gate. It calls the `onSubmit` its caller passes, which is that
  caller's gated `submit`. The screen could never know when the request ended, so it no longer
  tries. Its `busy` check stays as the readable statement of intent.
- The two link-driven confirmations (registration email, email change) are not forms. They send
  from an effect guarded by their `started` ref and restart on every link arrival (T-005), and are
  unchanged.

### 2.2 F6-2 — an instant the person did not touch is sent as stored (T-009)

`fromPrefilledInput(value, stored, control = 'datetime')` in `src/format/datetime.ts`:

- while the control still shows what it was prefilled with (`toLocalInput(stored)`, or
  `toDateOnlyLocal(stored)` for a date), it returns **`stored` itself, byte for byte**: seconds,
  microseconds, and the API's own `+00:00` spelling;
- a changed control is converted exactly as before: `fromLocalInput`, or `endOfDayLocal` for a date,
  UTC in both offset seasons;
- an emptied control is `null`, and so is an empty control with nothing stored.

What decides is what the control shows. A control changed and then changed back counts as
untouched.

Used for every stored instant a dialog prefills:

| Dialog (`src/pages/fleet/AssignmentDialogs.tsx` unless noted) | Instants |
|---|---|
| Edit assignment (the planned-dates update) | `plannedStartAtUtc`, `plannedEndAtUtc` |
| Correct authorization | `authorizedFromUtc`, `stoppedAtUtc` |
| Interruption edit and correction (`InterruptionForm`) | `startedAtUtc`, `endedAtUtc`; a new interruption has nothing stored and converts as before |
| Correct timeline | `plannedStartAtUtc`, `startedAtUtc`, `plannedEndAtUtc`, `closedAtUtc` |
| Change expiry, `src/pages/users/UserDialogs.tsx` (beyond the follow-up's list, §7) | `expiresAtUtc`, a date control |

The dialogs that seed a control with *now* (activate, end, cancel, authorize, stop, end
interruption, new assignment) have nothing stored to keep and are unchanged.

### 2.3 F6-3 — tests, and whether they can fail

`src/app/submitOnce.test.ts` gains eight tests. They drive the gate through TanStack's own
`MutationObserver`, the machinery `useGatedMutation` is built on, so what reopens the gate is the
library's `onSettled` and not the test:

1. a wrong password, then the right one: two requests;
2. a refused weak password (a field-level 400), then a strong one: two requests;
3. a 429 reopens the gate;
4. so does a request that never reached the API;
5. a success keeps the gate shut while in flight (a second submit is turned away, T-004 kept) and
   opens it once settled;
6. the gate stays shut through the form's own `onSettled`, as sign-out's move to the front door
   needs;
7. it opens even when the form's own `onSettled` throws;
8. no page can get a gate: the module exports `useGatedMutation` and not `useSubmitGate`.

`src/format/datetime.test.ts` gains ten tests for `fromPrefilledInput`: an untouched instant with
microseconds comes back byte-identical (the seeded shape, `…10.839886+00:00`); seconds and other
spellings do too; a changed control converts exactly as `fromLocalInput` does in summer (+03:00) and
in winter (+02:00); an emptied control is `null`; a value with nothing stored behind it converts; a
control changed back counts as untouched; and for a date-only expiry, an untouched date keeps the
stored instant, a changed one resolves to the end of that local day, and a cleared one is `null`.

**Do they have teeth?** Both mutation checks were run locally and restored byte-for-byte:

- With the one line that reopens the gate removed, all seven lifecycle tests (1–7) fail, while the
  seven gate tests Follow-up 4 wrote all still pass. That is exactly how T-008 went unseen.
- With `fromPrefilledInput` converting always, as the dialogs did, four of the new date tests fail:
  the three "untouched" ones and the untouched expiry.

## 3. Not implemented or partial

### 3.1 The transfer acceptance cannot be retried in place after a wrong password

**What happens.** A wrong password on `/accept-administrator-transfer` is answered with
`400 system_administrator.transfer_not_usable`. That is the same code and the same message ("The
administrator transfer is invalid, expired, cancelled, or already accepted.") as a link that is
really dead. The backend does this on purpose (`SystemAdministratorService.AcceptTransferAsync`),
so a request never says which of the two was wrong. The app lists that code among the dead-link
codes (`src/pages/account/failure.ts`, `EXPIRED_CODES`), so it replaces the form with "This transfer
link cannot be used … The administrator who sent it can issue a new one."

**But the link is not spent.** A wrong password leaves the transfer untouched. It only counts as a
failed password attempt on the invited account, and five of those lock it for 15 minutes
(LOGIN-005). While locked, even the right password gets the same code. Reopening the same link in
the same tab brings the form back (the T-005 arrival), and a second wrong password is sent: the gate
reopened. That second attempt lands on the same screen. So a person who mistypes is told to ask for
a new link they do not need. This is a second, older cause of a dead form, separate from the gate,
and specific to this screen.

**Why it was not built.** Keeping the form on that code changes which screen a genuinely dead link
ends on, and needs a message the reviewed screen does not have. Those are decisions about a
reviewed screen, not part of the gate fix. The run's rule is not to invent behaviour where the
specification did not foresee a cause.

**Side that has to change, and options.** (a) *Frontend only:* on this page, keep the form on
`transfer_not_usable` and put, in the existing alert slot, a message that names both causes. For
example: "The password did not match, or this link can no longer be used. Check the password and
try again; if it keeps failing, ask the administrator for a new link." The dead-link screen stays
for the codes that can only mean a dead link. (b) *Backend:* a distinct code for a wrong password.
That is a new refusal code and a disclosure decision. It discloses little, since the token already
proves the invitation, but it touches the API contract. **Recommendation: (a).** The decision is in
§6.

### 3.2 The joint-check steps that need a real password typed into the app

The implementing agent may not enter a real password into a web page, even the seed password the
owner supplied for this run, and may not change an account's credentials. The seed password was
used only in scripts that call the API directly, from an environment variable, and never typed into
a page or written to a file. Every step of F6-4 that needs a real password typed into the app is
therefore not run and is listed in §5 for the checking agent: the correct-password sign-in, the
strong-password reset, and everything behind a signed-in browser session. The owner was asked for
the one sign-in that would have opened the rest, and chose to have this report written instead.

## 4. Verification — the joint check

Against the API restarted from the round-4 build (port 5001, the process started by round 4's
phase 3) and the app's Vite server (port 5173, HMR), on the seeded database, in the in-app browser.
Requests were read from the browser's network log.

### 4.1 Every public form, refused and then corrected (T-008)

| Form | Refused with | Corrected | Requests | Result |
|---|---|---|---|---|
| `/sign-in` as `toms.rudzitis@` (the tester's steps) | `WrongPassword1!` → 401, the invalid-credentials message | a second wrong password, clicked; then the form's own submit again (as Enter does, §4.5) | 3 `POST /api/auth/login`, all 401 | **the form stays alive after each refusal**; the real password is §5.1 |
| `/sign-in`, three submits in one tick | — | — | 1 | **T-004 kept** |
| `/reset-password` (request) | `toms.rudzitis@` → 400, message under Email | `toms.rudzitis@rwrent.example` | 2 | 204, "Check your email" |
| the reset link from Mailpit, opened into the tab showing "Check your email" | `short` → 400, "…at least 12 characters. You entered 5" under New password | `alsoshort`, still refused | 2 `POST …/password-reset/complete`, both 400 | **the second request is sent**; the link replaced the finished screen (T-005 holds) and left the address bar; the strong password is §5.2 |
| `/confirm-registration-email?resend=1` | `toms.rudzitis@` → 400 under Email | the full address (a made-up password: the API answers the same for any) | 2 | 202, the registration-submitted screen |
| `/register` | first name left empty → 400, "'First Name' must not be empty." under First name | first name filled; an existing address, so the API's no-op branch runs and nothing is created | 2 | 202, "Confirm your email" |
| `/accept-administrator-transfer`, a link from Mailpit after an API resend | `WrongPassword1!` → 400 `transfer_not_usable` → the dead-link screen | the same link reopened in the same tab (form back); `WrongPassword2!` | 2 `POST …/transfers/accept`, both 400 | **the second request is sent; the screen then dead-ends again**: §3.1; the right password is §5.7 |
| `/confirm-email-change` | — | — | — | not run: needs a signed-in session, §5.6 |

### 4.2 T-009 and the other prefilled-instant dialogs

Not run in the browser: they need the System Administrator's session (§5.3, §5.4). What is
established:

- the unit tests of §2.3;
- the seeded instants really have the shape the tests use. After the final re-seed, assignment
  `2d7b5c86-0007-42d7-92d7-000000000007` reads `2026-08-09T05:01:10.839886+00:00` for its planned
  start and actual start, and `2026-09-08T05:01:10.839886+00:00` for its planned end and closure. The
  values move with each re-seed, because the seed counts from its own instant; the tester's
  `…17.422987` were from their seed.

### 4.3 T-004 on the phone and interruption dialogs

Not run: they need a session (§5.5). The dialogs now reach the gate through `useGatedMutation`
instead of their own `useSubmitGate`, with the same timing, and test 5 of §2.3 covers the turned-away
second submit. The live proof is still owed.

### 4.4 T-007, the backend's acceptance, once more

The tester's exact steps, released through a barrier 25 more times against the running API and the
seeded database: two Fleet Manager sessions, a new driver born 1996-09-27, a business customer, a
vehicle, and a Planned assignment from 2026-09-27T10:00Z per release; the update to 2009-09-27 and
the named authorization released together. **0 of 25 left a violating pair.** 23× the update lost
(`409 drivers.concurrency_conflict` · 201) and 2× the authorization lost
(`200` · `409 assignment_authorizations.concurrency_conflict`). The run in round 4 itself: 25
releases, 0 violating (`round4_report.md` §9.2).

"Once through two browser sessions if the app can produce them": it cannot. One browser profile
holds one session, and a person cannot release two requests at the same instant through the
interface. The barrier at the API is the check that can.

### 4.5 How it was run

- Injected Enter keys do not trigger a form's implicit submission in the in-app browser, as
  Follow-up 5 found. Enter's effect was driven with `form.requestSubmit()`, the call the browser
  itself makes for an Enter.
- The transfer link came from an API-level resend as the System Administrator (the password from
  the environment, in a script). The reset link came from the forgotten-password request in the
  table.
- **End state:** re-seeded with `--replace true`, exit 0, with the documented counts: companies 1,
  application_users 12 (11 human + the system account), identity_accounts 11, role assignments 8,
  sessions 15, email-confirmation challenges 5, security audit entries 13, transfers 1, vehicles 10,
  customers 8, drivers 7, assignments 12, authorizations 6, interruptions 4. This removed the 25
  joint-check T-007 records and reset the failed sign-ins. Afterwards Toms and the System
  Administrator sign in (API), the API answers 200 on 5001 and the app 200 on 5173, and both are
  left running. The browser pane was left on `/sign-in`.

## 5. For the checking agent: what to run with the seed password

Everything below needs a real password in the app, which the implementing agent may not type. Run
on a fresh seed. Where a step changes a credential or the administrator, re-seed afterwards
(`seed-development-data --replace true`, the owner's password, from the environment).

1. **T-008 on `/sign-in`, the tester's own steps.** `toms.rudzitis@rwrent.example`,
   `WrongPassword1!`, Sign in → 401 and the message. Replace only the password with the real one,
   Sign in → a **second** `POST /api/auth/login` → 200 → Overview.
2. **T-008 on the reset link.** Request a reset for Toms, open the Mailpit link, `short` → 400 under
   New password. Then a strong password → a **second** `POST /api/auth/password-reset/complete` →
   204 → "Password changed". This changes Toms's password; re-seed afterwards.
3. **T-009, the tester's own steps.** As System Administrator, assignment
   `2d7b5c86-0007-42d7-92d7-000000000007`, Corrections → Correct timeline. Touch no date; note `Run 2
   corrected assignment note`; a valid reason; Save. Expect the `PUT …/corrections/timeline` body to
   carry the four instants **exactly as `GET` returned them** (microseconds and `+00:00`), a 200, and
   the note reading back. Then once with one date changed: only that instant is converted (UTC,
   `:00.000Z`), and the three others still go back as stored.
4. **Every other prefilled-instant dialog, saved untouched on a seeded record, then once with one
   date changed:** Edit assignment on a Planned assignment (the planned dates); Correct
   authorization; Edit interruption; Correct interruption; and Change expiry on Dita Smite's expiring
   role. Untouched instants must go back byte-identical, and a changed one converted. One thing to
   know: a *privileged correction* saved with nothing changed at all now reaches the API's
   `400 corrections.no_changes`, shown above the footer ("A privileged correction must change at
   least one approved field."). The old rounding always sent a change, so this refusal was
   unreachable from the app; it is the right answer. Change the note or one date to get a 200.
5. **T-004 on the dialogs.** Profile → Update phone: two submits in one tick (`requestSubmit()`
   twice, §4.5) → one `PUT`, and the stored phone reads back. The interruption dialog: two Enters and
   a click → one `POST`, one record.
6. **Email-change confirmation, refused then corrected.** Signed in, open
   `/confirm-email-change#not-a-real-token` → refused with its code. Then request a real change from
   Profile (current password) and open its Mailpit link in the same tab → confirmed.
7. **The transfer acceptance, last** (it suspends `sysadmin@`). As System Administrator, Resend the
   transfer (current password). Open the Mailpit link; a wrong password → today the dead-link screen
   (§3.1); reopen the link; Liga Brice's password (the seed password) → accepted. Re-seed afterwards.
8. **The backend** (`round4_report.md` §9): the 22 race cases are in `dotnet test`
   (`Concurrency/…`). The tester's T-007 pair can be released again at the API: two sessions, one
   barrier, 25 releases, and the table read back after each.

## 6. Decisions needed

1. **After a wrong password on the transfer acceptance, should the screen keep its form?** Today a
   mistyped password ends on "This transfer link cannot be used", although the link still works
   (§3.1). Keeping the form would show one message that names both causes and lets the person try
   again. Recommendation: yes, keep the form.

## 7. Deviations

1. **The gate hook reaches beyond the public forms.** Every dialog (through `useActionMutation`) and
   sign-out now use `useGatedMutation`, and `useSubmitGate` is no longer exported. The follow-up
   asked for every public form; making the one hook the only owner of a gate is what makes
   forgetting impossible everywhere. The dialogs' behaviour is unchanged: they already reopened in
   `onSettled`. The sign-in page's resend link, a button in the alert rather than a form, goes
   through the hook as well.
2. **The instant rule reaches one dialog beyond F6-2's list:** Change expiry, whose untouched date
   used to move a seeded expiry to the end of that local day. It is one line to revert
   (`UserDialogs.tsx`).
3. **The joint check is partial** (§3.2, §5). The correct-password step on `/sign-in` was replaced by
   a second wrong password. That proves the second request, which was the defect; the success path
   itself was never broken.
4. `Context/wiring_followups.md` was not edited.

## 8. Open risks

1. **The lifecycle tests run in node, with no page rendered.** They prove the gate against TanStack's
   own observer. That the pages call the hook is proven by the type system (there is no other way
   to get a gate) and by the joint check: done for the public forms, owed for the dialogs (§5.4,
   §5.5).
2. **The transfer acceptance** (§3.1) until the owner decides.
3. **The scripts behind the live checks** (the T-007 barrier, the API sessions, the Mailpit link
   reader) are in the implementing session's scratchpad, not in a repository. §4 and §5 describe the
   method well enough to redo it.
