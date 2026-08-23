# RW-Rent web — Phase 2

React + Vite + TypeScript port of the reviewed prototype (`RW-Rent.dc.html`). The prototype is the
design spec; `uploads/swagger.json` is the contract. Phase 3 wires the real API by changing one
folder.

```
npm install
npm run dev        # VITE_API_MODE=mock by default
npm test           # dto/mock round-trip, formatting, permission gate, error mapping
npm run typecheck
```

## Layout

```
src/
  api/            the only surface pages import
    dto.ts        swagger mirrored: server names, camelCase bodies, numeric enums
    <resource>.ts typed functions returning DTOs and PagedResponse<T>
    problem.ts    ProblemDetails / ValidationProblemDetails → Failure
    codes.ts      code → input table for coded 400s
    transport.ts  the Transport interface + installTransport()
    http.ts       Phase 3 target: cookie auth + antiforgery header
    queryKeys.ts  TanStack Query keys, one factory per resource
  app/            shell, sidebar, bootstrap
  pages/          one folder per screen
  ui/             chips, filters, pagination, empty and problem states
  format/         datetime.ts (Europe/Tallinn + UTC), labels.ts (labels by raw value)
  permissions/    permission strings, can(), actionState(), AccessProvider
  mock/           in-memory store, route table, audit writer, failure simulator
  dev/            PROTOTYPE panel (dev-only)
  styles/         tokens.css ported from the prototype + base resets
```

## The swap point

`src/app/bootstrap.ts` installs a transport once:

```ts
VITE_API_MODE=mock  → createMockTransport()      // src/mock
VITE_API_MODE=http  → createHttpTransport(url)   // src/api/http.ts
```

Both satisfy `Transport.request(method, path, {query, body})`, so `src/api/*.ts` keeps the real
verbs and URLs in mock mode too, and no component or api function changes in Phase 3.

## Rules the code enforces

**Audit payloads.** `beforeJson` / `afterJson` keys are PascalCase as the backend types them; enum
values are PascalCase strings; timestamps carry an explicit `+00:00`. When both sides exist only
changed keys survive, with identical key sets; a one-sided payload passes through; nothing changed
writes no row. Reason is recorded only where the dialog collects one. Session revocations caused by
a security-state change set a revocation reason on the session and write no audit row.

**Time.** Instants are stored with offset. Operational surfaces render Europe/Tallinn in the
humanized style (`23 Aug, 14:57`, year only when not current); Security audit and Sessions render
UTC `yyyy-MM-dd HH:mm`, declared once per panel. A date-only expiry resolves to 23:59:59.999 local
on the chosen day — the chosen date is the last valid day — and the backend's future check applies
to that instant.

**Permissions.** `GET /api/me` is the only capability source. `can(permission)` gates nav, tabs and
actions; an action the persona can never hold is hidden, and only a state-blocked action the persona
could otherwise perform is disabled with its reason (`actionState`). The mock enforces the same
permissions, so an over-offered action returns 403.

**Sessions.** `isActive` and `isCurrent` are computed on every read, never stored: active means not
revoked AND the idle deadline ahead AND the absolute deadline ahead; current means the row is the
session that authenticated the request, and it is self-view-only — an administrator listing another
user's sessions never receives it. The store holds `SessionRecord` (the response minus those two) so
a stale flag cannot disagree with the deadlines. The revoke endpoints take no reason: a single
revocation stamps the session “Revoked by administrator”, a forced sign-out stamps “Forced logout by
administrator”, and both audit entries carry neither a reason nor a payload — single revocation names
the session, forced sign-out names the user.

**Tiers.** Three, as in the prototype: phone below 768 (cards instead of tables, sidebar behind a
menu button), tablet 768–1279 in both orientations (icon rail, folded columns, tighter cells),
desktop from 1280 (expanded rail, every column). Column folding is CSS — `foldTablet` and
`foldNarrow` in `ui/table.module.css`; only the structural switches (table → cards, rail → drawer)
read `useTier()`. No page body is ever wider than the viewport.

**Type.** Mono is for machine values only — identifiers, phone numbers, timestamps, counts, IP
addresses. Emails, names, reasons and sublabels such as “Protected account” are sans secondary text.

**Query types.** Query DTOs are type aliases rather than interfaces, which is what lets `UsersQuery`
reach `Transport.request` with its own property types intact. `AssertQuery` in `api/client.ts` lists
every one of them, so redeclaring one as an interface fails there instead of at each call site. The
mock matches paths and query keys case-insensitively, as ASP.NET binds them.

**Failures.** One envelope module. Two 400 shapes: a filter-level rejection carries `errors` keyed by
FluentValidation's PascalCase property path, indices included (`Reason`, `Roles[0].Role`), normalised
to the JSON names the inputs use; a service-level validation refusal carries `code` + `detail`
(`users.activation_role_expiry_invalid` → the role's expiry input). Both become field errors when the
path or code names an input, otherwise a form-level message above the footer. 409 ending
`.concurrency_conflict` → amber stale banner with Refresh; other 409 → red conflict banner; 403 → the
action should not have been offered; 401 → sign-in. The failure simulator lives at the mock transport
boundary and throws the same envelopes.

**Stale records.** The concurrency refusal is contractual on every audited resource — users, roles,
customers, drivers, vehicles, companies, profile, corrections, rental assignments, authorizations,
interruptions and system administrator — so the banner and its Refresh are wired on all of them. The
token round-trip is separate: only DTOs that expose a `concurrencyToken` send one back.

## Not in swagger (mock-only, marked `// FOLLOW-UP` in dto.ts)

- `registrationDecisionReason` on the user read model
- `createdAtUtc` on the user LIST projection — the Registrations queue's Registered column
- Overview summary counts (four `PageSize=1` probes stand in, routed through `api/overview.ts`)
- `upcomingCustomerDisplayName` / `upcomingPlannedStartAtUtc` on the vehicles list projection
- No `GET /api/security-audit/{id}`: an audit entry is located in the first page of the unfiltered
  list, so a deep link is best-effort
- `GET /api/users` takes one `Status`, so “All lifecycle states” fans out into one request per state
  and pages the merged result client-side

## Seed

`src/mock/seed.ts` is the reviewed prototype's `DB`: the same eleven people, their registration
states, fifteen sessions and thirteen audit rows, with the prototype's identifiers preserved as the
keys of `src/mock/ids.ts` (`u4` is Dita Smite in both). Fleet rows — vehicles, customers, drivers,
assignments, authorizations, interruptions — arrive with their screens; until then those routes 404
rather than serve a half-populated list.

## State of the port

Deliverable A is the api, error, formatting, permission and mock layers. Deliverable B ports the
screens: **user directory**, **user record** (with its eleven actions), **Registrations** and
**Security audit** with its entry page. The sidebar lists only screens that exist.

Every mutation runs through one dialog layer: `ui/Dialog` renders the failure envelope (field
messages under inputs, validation message above the footer, amber stale banner with Refresh — which
disables the primary action until the form is re-seeded — red conflict, forbidden, session ended) and
`app/useActionMutation` maps the rejection, exposes the field messages and invalidates the affected
caches on success. Nothing is validated in the browser: a past role expiry is refused by the api
boundary as `users.activation_role_expiry_invalid` and rendered under that role's expiry input.

Audit payloads are parsed by `format/auditPayload.ts`, which follows the documented shape (flat
PascalCase objects, changed keys only, `Roles` as an array of grants) and returns null for anything
else — the entry page then shows the raw payload instead of guessing.
