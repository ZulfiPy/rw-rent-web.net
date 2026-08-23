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
  format/         datetime.ts (Europe/Tallinn + UTC), labels.ts (labels by raw value)
  permissions/    permission strings, can(), actionState(), AccessProvider
  mock/           in-memory store, route table, audit writer, failure simulator
  dev/            PROTOTYPE panel state (dev-only)
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
- Overview summary counts (four `PageSize=1` probes stand in, routed through `api/overview.ts`)
- `upcomingCustomerDisplayName` / `upcomingPlannedStartAtUtc` on the vehicles list projection

## State of the port

Deliverable A (this commit) is the api, error, formatting, permission and mock layers, plus a smoke
screen at `/`. Deliverable B ports the pages and dialogs screen by screen; the mock's fleet
handlers and the full version-tagged seed land with them.
