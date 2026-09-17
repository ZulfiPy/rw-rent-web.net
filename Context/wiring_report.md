# Frontend Wiring — Follow-up 4 report

> Created anew for this run, as F4-6 asks: the phase's earlier report was removed when the wiring
> phase closed and its content now lives in the code, in `Context/wiring_followups.md` and in the
> backend's own documents. This report covers Follow-up 4 only — the frontend findings of the
> independent testing run of 2026-09-16 (`Context/testing_report.md`: T-001, T-004, T-005) and the
> three refusals the backend's round 3 added. Worktree
> `/Users/zulf/rw-rent-api/rw-rent-web-wiring`, branch `feature/backend-wiring`. Written 2026-09-17.
> A later run rewrites this file.

## 1. Summary

F4-1 to F4-5 are built, in one commit, `9127ea1` "Wiring 14: route guards, one submission at a time,
link pages that start over", against the API rebuilt from the backend's round 3 with its migration
applied.

`npm run typecheck` is clean. `npx vitest run` is green: **119 tests across 14 files**, up from the
102 of the baseline. `npm run build` is green with the one pre-existing chunk-size warning (backlog
item 4). Reviewed screens keep their markup and CSS, and no runtime dependency was added.

Two things were verified live while building, against the round-3 API and needing no seeded session:
the app boots clean on every public route, and T-005's repeat now reaches the API where the tester
recorded silence — two POSTs to the confirmation endpoint, the second from a fragment that arrived
after the screen had already finished.

**The joint check is not done, and it needs the owner.** Every step of it signs in as a seeded
account, and the seed password is the owner's. §5 records it with the reason and what to run when the
password is available.

## 2. Implemented

### 2.1 F4-1 — every route is guarded by permission, not only the menu (T-001, Major)

The finding: every route was reachable by typing its address, and `/system-administrator` then told a
Company Principal, a Fleet Manager or a Viewer that they were the current System Administrator and
offered them an enabled **Initiate transfer**. The full dialog opened and accepted the fields; only
the API's `403` refused the operation, after which the dialog said "Not permitted".

Two causes, and both are fixed.

**The permission each destination needs now lives in one place.** `src/permissions/routeAccess.ts`
holds `ROUTE_PERMISSIONS`, and both the navigation and the new guard read it. Before, the navigation
carried the permission and the router carried none, so the two could not disagree in only one
direction: a hidden menu item always had a reachable page behind it. `AppShell`'s `NAV` no longer
spells the permission out at all — it asks `routePermission(item.to)` — so the menu and the guard
cannot drift apart again.

**One guard wraps the whole workspace.** A single layout route in `src/App.tsx` renders
`GuardedOutlet`, which is written once and applies to every route inside it. The guarded page is
never rendered when the persona lacks the permission, so no request goes out and no content sits
behind the lock. The `AppShell` itself was not touched, which keeps the reviewed port intact.

A record route takes its list's permission, because a record is the list's own row: `/vehicles/x`
asks for `Vehicles.Read` exactly as `/vehicles` does. That is what the first path segment is for.
An address belonging to no section needs none, because the router already redirects it to the
Overview and a lock there would replace that redirect with something nobody can act on.
`/overview`, `/needs-attention`, `/tasks`, `/insurance-cases` and `/profile` need no permission, as
in the prototype's `perm: null`.

The refused state is the one a refused list already shows, inside the shell: the lock icon, "Not
available to you", and the permission it would take.

**And the System Administrator page no longer names the reader.** It resolved the administrator from
the user directory and fell back to the signed-in person when it could not — which is how the page
came to show a Viewer their own name and email under "Current System Administrator". It now shows
the app's dash, because naming the reader was a claim the app had no grounds for and the wrong claim
for everyone except the one account that really holds the role.

### 2.2 F4-2 — every submission happens once (T-004, rated Major by the reviewer)

The finding: Enter pressed twice in quick succession sent the same phone update twice, and both
answered `200`.

Every guard the app had was a rendered one — a disabled button, a `busy` prop, an `isPending` check
— and every one of them reads state that React has not re-rendered yet when the second key press
arrives. The window between the two is real, and the second submit walked straight through it. A
rendered flag cannot close a gap that exists *because* rendering has not happened.

So the guard is a ref: `src/app/submitOnce.ts` holds a gate that closes inside the first call,
before anything re-renders, and opens again when that submission settles — settles, not succeeds,
or a refused dialog could never retry.

Where it applies:

- **`useActionMutation`** carries it, which covers **all 35 dialog submissions** in one place. (F4-2
  says 42; the count in the code today is 35 across seven files. The point stands either way: one
  hook is the chokepoint for every one of them.)
- **`Dialog`** also ignores a submit while busy. This second layer matters because of how the dialog
  is built: its footer action lives *outside* the `<form>` and is a plain button, so the form has no
  submit button of its own and Enter in a field submits the form directly — straight past the
  disabled button that everyone would expect to have stopped it.
- **The account pages** use the same gate, replacing their own `isPending` checks, which had the
  same gap: sign in, register, and the four emailed-link screens through `AuthLayout`'s
  `ResetScreen`.
- **Sign out** too. Its rail button is never disabled, so repeated clicks sent repeated logouts.
  Harmless — logout is idempotent (SESSION-009) — but it is a submission like any other.

The consequence that made the reviewer raise this from Minor to Major: the interruption dialog
created two identical permanent records, and an interruption is never deleted. As of the backend's
round 3 the API refuses that pair itself (INTERRUPT-014), so this is now the first of two locks
rather than the only one.

### 2.3 F4-3 — an emailed-link page starts over when a new link arrives (T-005)

The finding: after a link had been used, opening a link again in the same tab kept the finished
screen and sent nothing. The same link in a fresh tab was correctly refused. The result must not
depend on which tab it lands in.

All four pages read the fragment once, at mount, and three of them froze it in a `useState`
initializer that could never change. One hook now does it for all four,
`src/pages/account/useLinkToken.ts`, and it watches both ways a fragment can arrive:

- the router's `location.hash`, for a change the app itself navigated;
- the window's `hashchange`, for a link opened into the address bar of a tab that is already here.
  This one is necessary, not belt-and-braces: `stripHash` uses `history.replaceState`, which the
  router never hears about, so the router's own `hash` cannot be relied on for it.

Both paths read the live fragment rather than the value that triggered them, and both strip it
immediately, which makes a duplicate trigger a no-op without having to remember which token was seen
last. That last point matters: **the same token arriving again is a real event**, not a repeat to be
filtered out. Only the API knows whether a single-use token is still good, so the page must send it
and let the refusal produce the unusable-link screen — which is exactly what the tester expected.

Each page clears what its finished screen is made of, and no more. The reset is not conditional on a
token having been used before, because the case where the page had no fragment at all — someone
asked for the link with this tab open and then clicked it — needs the same restart. `/reset-password`
keeps the email address, because the API needs it with the completing call and it is the same
person's; `/accept-administrator-transfer` clears the password, because a second invitation may be
for a different account.

### 2.4 F4-4 — the round-3 refusals are shown where they belong

| Code | Where it appears | Operations |
|---|---|---|
| `assignment_authorizations.driver_birth_date_required` | under the driver field | the new-assignment form, the start dialog, the replace dialog inside a stop, the authorization correction |
| `assignment_authorizations.driver_underage` | under the driver field | the same four |
| `drivers.birth_date_breaks_open_authorization` | under the date of birth | the driver dialog, creating and editing |
| `assignment_interruptions.duplicate` | under the start field | the interruption create, update and correction dialogs |

The messages are the API's own.

One mechanism had to change for this. All three refusals are **conflicts**, and a 409 never reached
a field: `toFailure` consulted the code-to-field table only for a coded `400`. It now consults it for
a 409 as well, which is what the `assignment_authorizations.driver_inactive` entry already sitting in
that table always meant — a refusal that names one input belongs under that input, whatever status
carried it. A conflict whose code names no input is still the banner it was.

`dto.ts` needed no change. A diff of the live OpenAPI document before and after round 3 shows the
same 82 operations and byte-identical schemas; only the `400`'s composition keyword differs.

### 2.5 F4-5 — tests

17 new, 102 → 119, in four files, all pure modules as the suite requires (`src/**/*.test.ts`, node
environment, no DOM):

- `src/permissions/routeAccess.test.ts`, 11 tests — the guard's decision as a pure function over a
  route and a permission list: the ungated pages, each gated destination and the permission it
  takes, a record route taking its list's permission, a trailing slash and a deeper path, an unknown
  address needing none, and every permission in the table being one the API really returns. Then
  T-001 itself, driven as all three ordinary roles: none of them may open the System Administrator
  page while the administrator may, a Viewer keeps the fifteen destinations a Viewer reads and is
  refused the four it does not, a Fleet Manager gains the registrations queue and no more, a Company
  Principal gains the audit and still not the administrator page, and an account with no permission
  at all reaches only the five ungated pages.
- `src/app/submitOnce.test.ts`, 7 tests — two synchronous submits producing one call; the gate shut
  *during* the first action, which is the only moment that matters; reopening on settle; settling
  after a refusal; a stray settle being harmless; not staying shut when an action throws; and two
  gates never blocking each other.
- `src/pages/account/token.test.ts`, +5 tests — the arrival decision: nothing to do without a
  fragment, the fragment the page was opened with, a later fragment, the same token twice (still
  "start over", because only the API knows), and a later fragment decoded the same way as the first.
- `src/api/problem.test.ts`, +5 tests — the three codes' field mapping on every operation that can
  raise them, plus the two boundaries: the same conflict without an `op` stays a banner because no
  table was selected, and a concurrency conflict is still the stale banner whatever table is
  selected.

## 3. Not implemented or partial

**The joint check of §6 of `wiring_followups.md`.**

*What is missing.* The whole of it: the tester's T-001 steps as each of the three ordinary roles,
every guarded address typed as a Viewer, T-004 on the phone dialog and on the interruption dialog,
T-005 for the confirmation and the reset link including a second valid reset link in the same tab,
an authorization for a driver without a birth date and for one aged 17, the same interruption
entered twice by hand, and every route once as each role to prove nothing else moved. The re-seed
with `--replace true` was not run either.

*Why.* Every step signs in as a seeded account, and the seed command itself takes `--password`. The
seed password is the owner's: it is not in the environment (`RWRENT_DEV_SEED_PASSWORD` is unset) and
the owner had not supplied it when the run reached this point. Registering a new account would not
help — a fresh registration has no permissions and no seeded records to act on — and re-seeding with
a password of this run's own choosing would have locked the owner out of their own accounts before
their manual check, so neither was done.

*Which side has to change.* Neither: no code is missing. The owner supplies the password once, or
exports `RWRENT_DEV_SEED_PASSWORD` in the shell the next run starts from.

*Proposed option.* Run §6's joint check then, together with the backend's four outstanding live
checks (`RWRentApi-wiring/Context/round3_report.md` §3) — they use the same session, so one sign-in
covers both — and record the outcomes in §4 of this report. Until then, treat §4's table as what was
proven without a session rather than as the joint check.

*Everything in F4-1 to F4-5 is built*; nothing was cut, and nothing was built differently from what
§6 specifies. The two count corrections worth naming are in §6 of this report.

## 4. Verification

What was verified, and how. Nothing in this section needed a seeded session; §3 says what is
therefore still outstanding.

| What | How | Result |
|---|---|---|
| The app boots with the guard wrapping every route | `/sign-in` loaded in the browser against the round-3 API | **Pass** — the prototype's sign-in screen renders whole: both fields, "Forgot password?" on the password label row, the black Sign in with its arrow, "No account yet? Create one", the footer line and the art panel |
| No JavaScript errors on the public routes | console read on `/sign-in`, `/reset-password`, `/confirm-registration-email` | **Pass** — the only console errors are the expected `401` from `GET /api/me`, which is how the app learns it is signed out |
| `/reset-password` still renders after being rewired | loaded in the browser | **Pass** — the email field with its note "The reset must be completed with the address the link was sent to", "Send reset link", "Back to sign in" |
| A link page reads its token and strips the fragment | `/confirm-registration-email#<token>` loaded | **Pass** — the checking state appears, and the address bar is back to `/confirm-registration-email` with no fragment |
| The token reaches the API and its refusal renders | the same visit, allowed to complete | **Pass** — "This confirmation link cannot be used" with the API's own code, `registrations.email_confirmation_not_usable`, and the 24-hour note |
| **T-005: a second link in the same tab** | with the screen already showing the unusable-link state, a second, different fragment was set on the live page — the tester's own step, no reload | **Pass** — the fragment was consumed and stripped again, and the network log shows **two** POSTs to `/api/registrations/email-confirmation/complete`, both refused. The tester recorded `sameTabRepeatRequests: 0`; the second request is the fix |
| The contract the app is wired against did not move under it | the live OpenAPI document diffed before and after round 3 | **Pass** — same 82 operations, byte-identical schemas; only the `400`'s composition keyword changed, so `dto.ts` needs nothing |
| Typecheck | `npm run typecheck` | **Pass** — clean, under `noUncheckedIndexedAccess`, `noUnusedLocals`, `verbatimModuleSyntax` |
| Tests | `npx vitest run` | **Pass** — 119 across 14 files |
| Build | `npm run build` | **Pass** — green; one pre-existing warning, the single chunk at about 564 kB (backlog item 4) |
| Reviewed screens keep their markup and CSS | the diff | **Pass** — no `.module.css` file changed; `AppShell.tsx` changed only in its `NAV` data and the one line that filters it; `SystemAdministrator.tsx` changed only where it resolved the administrator |
| **§6's joint check** | — | **Not run** — needs the owner's seed password (§3) |

## 5. Decisions needed

None. Every decision this follow-up rested on was taken by the owner on 2026-09-17 and is recorded
in §6 of `wiring_followups.md`.

One matter needs the owner's hand rather than a decision: the seed password, so the joint check can
run (§3).

## 6. Deviations

1. **35 dialog submissions, not 42.** F4-2 says all 42 dialog submissions go through
   `useActionMutation`. The count in the code today is 35, across seven files. The number does not
   change the fix — the hook is the single chokepoint for every one of them — but the report should
   not repeat a figure it did not find.

2. **A 409 can now reach a field, which brings one existing mapping to life.** F4-4 needed the three
   new conflict codes to appear under their fields, and no conflict could reach a field at all: the
   code-to-field lookup was inside the `400` branch only. Extending it to 409 is the smallest change
   that does what F4-4 asks, and it also activates `assignment_authorizations.driver_inactive`,
   which was already in that table and is itself a conflict. That is a UI change beyond the three
   codes, so it is named here: a named authorization refused because the driver is inactive now
   shows its message under the driver field instead of in the banner. It is what the table always
   declared and it matches the three new refusals beside it, which is why it was allowed to stand
   rather than being suppressed.

3. **The guard is a layout route, not a wrapper per route.** F4-1 says one guard "wraps every
   route". A layout route around the whole workspace achieves that with the guard written once and,
   more importantly, without touching `AppShell` — which is a reviewed prototype port. Wrapping each
   route individually, or putting the guard inside the shell around its `<Outlet />`, would both have
   worked; this way the reviewed file keeps its markup.

4. **`AppShell`'s `NAV` no longer carries a permission field.** F4-1 says the guard is "fed from the
   same permission the navigation already carries". Feeding it from the navigation's own table would
   have left the permission written in two places once record routes were added, and two places is
   what produced T-001. The table moved to `routeAccess.ts` and the navigation reads it, so the
   direction of the dependency is reversed from the literal wording while the single source of truth
   the instruction is after is achieved.

## 7. Open risks

1. **Some entries in the code-to-field table name codes the backend does not send.** Reading the
   backend's authoritative error catalogue while wiring F4-4 showed that `src/api/codes.ts` lists
   `assignment_authorizations.driver_already_open`, `.collective_requires_business`,
   `.collective_already_open`, `.named_and_collective_exclusive` and `.from_required`, none of which
   exists in `AuthorizationErrors`; the real codes are `duplicate_open_named`,
   `collective_requires_business_customer`, `duplicate_open_collective` and `mixed_open_modes`, and
   there is no `from_required` at all. The file's own comment says entries are added only for codes
   the backend actually returns, so these are drift. The effect is not new damage — those messages
   land in the banner instead of under their field, which is where they land today — but now that a
   409 consults the table, correcting the names would move five real refusals under their fields.
   F4-4 says nothing else in the UI changes, so this was left alone rather than fixed quietly.
   Proposed option: a small follow-up that corrects the five names and drops `from_required`, driven
   from the backend catalogue, with one live check per code. Frontend only.

2. **The `hashchange` listener is the only signal for a fragment typed into the address bar.** It is
   the right signal and it is tested live (§4), but it is a window-level listener rather than
   something the router owns, and a future change to `stripHash` — using the router's `navigate`
   instead of `replaceState`, say — would make the two paths overlap in a way the current
   strip-first-then-read design absorbs silently. The design note is in the hook; anyone changing
   `stripHash` should read it.

3. **The guard trusts `GET /api/me`, which is cached for a minute.** Backlog item 3 already records
   that a role granted or revoked while someone is signed in reaches them at the next reload or
   after that minute. The guard inherits exactly that: for up to a minute after a revocation, a
   persona can still open a page whose permission they have just lost — and the API will refuse the
   page's requests, which is the state the app already renders. Unchanged by this follow-up, and
   worth knowing now that a route decision rests on the same cache.

4. **Nothing has driven the guard as a real signed-in persona yet.** The pure function is tested
   across all four personas and every destination, but the wiring between it and the shell — that
   the lock renders inside the shell, that the navigation and the guard agree on screen, that no
   request goes out — is exactly what §6's joint check exists to prove, and that is outstanding
   (§3). This is the largest single gap in the follow-up.
