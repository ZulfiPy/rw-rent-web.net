# Frontend Wiring — Follow-ups

> **The running ledger of everything decided or left open after each implementation report.** One
> file for the whole phase: a new follow-up is appended as a new top-level section, a finished one
> keeps its section with its status changed to "implemented". The report itself is the single file
> `Context/wiring_report.md`, rewritten completely at the end of every run. `Context/wiring_spec.md`
> and `Context/wiring_plan.md` stay the authoritative what and how; this file records the deltas.
>
> Created 2026-09-15.

## Follow-up 1 — 2026-09-15 — the account screens are ports of the prototype, not new designs

> **Status: OWNER-CONFIRMED — IMPLEMENTATION AUTHORIZED (plan Phase 8).**

### 1. What went wrong

The specification (§8–§10) told the agent that the sign-in and account screens "have no prototype"
and asked for new screens in the app's vocabulary. That was the reviewer's error, not the agent's:
the reviewer searched the delivered app folder for a sign-in screen and never opened the prototype
file itself, `RW-Rent.dc.html`, which the delivery zip carried at its root. The prototype contains
the whole account area — an authentication family of sixteen states, a "Your account" screen with
three tabs, and an "Access pending" screen — designed and reviewed by the owner. The agent built
exactly what the specification asked for; the specification was wrong.

Consequence: every screen the agent created under `src/pages/account/` is replaced by a port of the
prototype's screens, under the porting rule of the whole conversion: **port, don't recreate** —
transcribe the prototype's markup and styles, do not design.

### 2. Decisions (owner, 2026-09-15)

| # | Decision |
|---|---|
| 1 | The sign-in and every other account screen must look exactly like the prototype's. The prototype is the design source; the coding agent ports it. |
| 2 | The prototype file lives in this repository from now on, `Context/prototype/RW-Rent.dc.html`, together with the prototype's own coverage notes `Context/prototype/COVERAGE.md`, because Claude Design is no longer used and the file must not be lost. |
| 3 | The two open questions of the report (the reset form's email field; the activity card's routine events) stay open until the owner returns to them; they do not block this follow-up. Until decided, the reset form keeps the email field the API requires, laid out in the prototype's field style. |

### 3. Change required now — F1, port the prototype's account area

**Where the screens are in `Context/prototype/RW-Rent.dc.html`.** The file is a single-page
prototype: templated HTML with `<sc-if value="{{ … }}">` blocks and inline styles built on the same
design tokens the app already has (`--canvas`, `--fg`, `--fg-3`, `--accent`, `--font-display`,
`--font-mono`, …), plus one script (the third `<script>`) holding the state and the copy.

- The authentication family is the `<sc-if value="{{ showAuth }}">` block that precedes
  `<sc-if value="{{ showApp }}">`. Inside it: the header (logo, theme toggle), the form column with
  four sub-screens `scSignin` (sign in), `scRegister` (create account), `scMessage` (the generic
  outcome screen: icon, colour, title, body, optional facts, optional meta line, actions) and
  `scReset` (forgotten password, and set a new password with a token — variants `resetHasToken`,
  `resetNeedsPw`, `resetNeedsCurrentPw`), the footer line ("RW-Rent operations platform · v1.0.0 ·
  Sessions expire after 2 h idle, 12 h absolute") and the art panel `showAuthArt` (46 % width,
  monogram pattern, gradient, the line "Track · Manage · Grow" and "Control at every turn.").
- The states and their copy are in the script: the `authScreen` values (`signin`, `register`,
  `register-submitted`, `forgot`, `forgot-sent`, `resend`, …) and the outcome definitions keyed by
  state (search for `'forgot-sent'`, `'reset-bad'`, `rejected:`, `expired:`), each with `icon`,
  `color`, `title`, `body`, `facts`, `meta`, `actions`. `COVERAGE.md` lists the sixteen states:
  sign in · create account · registration submitted · confirming email · email confirmed ·
  confirmation link unusable · resend confirmation · awaiting activation · forgotten password ·
  reset requested · set a new password · reset link unusable · registration rejected · registration
  expired · account suspended · session expired · too many attempts · accept administrator transfer.
- "Your account" is the app route `profile` (search `r === 'profile'` in the script): three tabs
  Profile, Sign-in & security, Your sessions (with the active-session count), panels per tab.
  "Access pending" is the app route `noaccess`. Both are reached from the account button in the
  sidebar's utilities in the prototype.

**What to do.**

1. Port the layout: the split page (form column + art panel), the header with the logo and the
   theme toggle, the footer line, the responsive behaviour the prototype's styles define (read them;
   the art panel and the columns collapse the way the prototype says, not the way the current cards
   do), both themes. The theme toggle uses the app's existing `rwrent.theme` preference and applies
   the saved theme on a cold load of any public page.
2. Port every state of the family onto the app's existing routes and flows, keeping the API
   behaviour the current screens already have (the calls, the antiforgery handling, the session
   signal, the return path, the token reader):
   sign in → `/sign-in`; create account → `/register`; registration submitted → after `/register`;
   confirming email, email confirmed, confirmation link unusable, resend confirmation →
   `/confirm-registration-email` (and the resend form); awaiting activation, registration rejected,
   registration expired, account suspended → the coded 403 outcomes on `/sign-in`, rendered as the
   prototype's outcome screens; session expired → `/sign-in` reached through the session signal;
   too many attempts → the 429 outcome; forgotten password and reset requested → `/reset-password`
   without a token; set a new password and reset link unusable → `/reset-password` with a token;
   accept administrator transfer → `/accept-administrator-transfer`. Where the API needs a field
   the prototype's state does not show (the email on the reset form until the owner decides), add it
   in the prototype's field style and note it in the report.
3. Port "Your account" onto `/profile` with the three tabs and their panels exactly as the
   prototype lays them out (the current four-panel page is replaced), and "Access pending" onto the
   existing access-pending state, reached from the account button as in the prototype.
4. Copy is the prototype's, word for word, including titles, helper lines, button labels and the
   outcome bodies; the app's current wording goes.
5. Remove what the port makes obsolete under `src/pages/account/` (the generic card layout, its
   CSS module) and keep the tests that still describe behaviour (failure mapping, token reader);
   add tests where the port introduces logic (state → outcome mapping).

**Self-check before the report.** For sign in, create account, one outcome screen, forgotten
password, set a new password, Your account (each tab) and Access pending: render the app at 1512,
834 and 402 in dark and light and compare with the prototype's markup and styles (padding, widths,
type sizes, gaps, colours, copy). The owner then pair-checks the app on their devices against the
prototype in Claude Design, as in every earlier section; differences found there are fixed in a
further follow-up.

### 4. Acceptance criteria

- Every screen of the family renders from the prototype's markup and styles; no screen keeps the
  card layout the agent created; copy matches the prototype word for word.
- Every flow of spec §12.1 still passes against the seeded API.
- The theme toggle works on the public pages and the saved theme applies on a cold load.
- 1512 / 834 / 402, dark and light: no overflow, no cut text, the art panel behaves as the
  prototype's styles define.
- `npm run typecheck`, `npx vitest run`, `npm run build` green.

### 5. The report

Rewrite `Context/wiring_report.md` completely (both runs, not a delta), in the eleven-section
format of `Context/wiring_plan.md` §9; its §2 must carry the owner's per-screen verification table
extended with the account screens as pairs (prototype screen → app route → what to compare). Commit
as `Wiring 8: …` with the code and push. The agent's final chat message is a plain-language
overview for the owner, without the technical report.

### 6. Definition of done

F1 implemented with its checks; report rewritten; branch pushed; working tree clean.

## Carried forward — living list

1. Owner's open questions from the report (2026-09-15): (a) the reset form's email field — keep, or
   ask the backend to take the address from the token; (b) the Overview's activity card — hide
   routine sign-in and sign-out events, or keep the newest five. Reviewer's recommendations: keep
   the field; hide the routine events (app-side, over a larger page).
2. Small findings from the reviewer's check of the first run: the Button `block` variant with the
   primary tone has poor contrast in the light theme (the agent avoided it on the account screens;
   phone-sized dialogs use it — verify on the phone in light); the cold-load theme on public pages
   (covered by Follow-up 1 F1 step 1).
3. Backend backlog items raised by this phase live in the backend's `Context/backlog.md`
   (`availableVehicles` on the overview summary).
4. Merge gate (owner): both `feature/backend-wiring` branches merge only after the wired app and
   backend have passed the owner's manual check together.
