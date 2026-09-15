# RW-Rent frontend — design coverage against `swagger.json`

Design artifact: `RW-Rent.dc.html` (interactive prototype, mock data isolated in one `DB` constant + one `ROLE_PERMS` fixture).

**Phase order:** responsive pass (in review) → dialog mutations (brief pending) → Registrations + Security audit review → React + Vite source package (last, not started).

## 1. Page and navigation inventory

Sidebar, permission-filtered. Groups with no permitted destination are hidden entirely.

| Group | Destination | Gate |
|---|---|---|
| Overview | Overview | authenticated |
| Operations | Rental assignments → assignment detail | `RentalAssignments.Read` |
| Fleet | Vehicles | `Vehicles.Read` |
| Business relationships | Customers | `Customers.Read` |
| Business relationships | Drivers | `Drivers.Read` |
| Users & access | User directory → user detail | `Users.ReadDirectory` |
| Users & access | Registrations | `Users.ReviewRegistrations` |
| Users & access | Security audit | `SecurityAudit.ReadCompany` |
| Administration | Company profile (or first-run setup) | `Company.Read` / `Company.Create` |
| Administration | System Administrator | `SystemAdministration.Transfer` |

Sidebar utilities (pinned, always reachable): account → Your account, theme, sign out, collapse. Expanded/collapsed state and theme persist in `localStorage`.

Not in the sidebar: **Your account** (`profile`, tabs Profile / Sign-in & security / Your sessions) and **Access pending** (`noaccess`), both reached from the account button.

Authentication family (16 states): sign in · create account · registration submitted · confirming email · email confirmed · confirmation link unusable · resend confirmation · awaiting activation · forgotten password · reset requested · set a new password · reset link unusable · registration rejected · registration expired · account suspended · session expired · too many attempts · accept administrator transfer.

## 2. Role-specific views

Capability checks read a permission list only — the frontend never infers from role names. `ROLE_PERMS` mirrors the mapping you supplied and stands in for `GET /api/me.permissions`.

- **Viewer** — Overview, assignments, vehicles, customers, drivers, user directory, Company profile. All read-only: no create buttons, no row actions, no lifecycle actions; panels carry an explicit read-only note naming the missing policy.
- **Fleet Manager** — adds create/edit/activate/deactivate on vehicles, customers, drivers; full assignment lifecycle, driver coverage and interruptions; Registrations queue with activate (Viewer only) and reject/reopen; Company profile edit.
- **Company Principal** — adds activation as Fleet Manager, name correction, suspend/restore, role history + grant/expiry/revoke, session administration for other users, Security audit.
- **System Administrator** — adds Company create/delete, Company Principal activation, privileged corrections (the assignment **Corrections** tab only appears with `PrivilegedCorrections.Execute`), System Administrator transfer. The protected account is visually separated: a warning banner on its user record, ordinary suspend/restore/role actions withheld, and it is never offered as an activation role.
- **Active with no permissions** — routed to Access pending; navigation is empty; only account self-service is available.

## 3. Screen → endpoint coverage

| Screen / action | Endpoints |
|---|---|
| Sign in | `POST /api/auth/login`, `GET /api/auth/antiforgery` |
| Session bootstrap / resume | `GET /api/me` |
| Sign out | `POST /api/auth/logout` |
| Create account | `POST /api/registrations` |
| Resend confirmation | `POST /api/registrations/email-confirmation/resend` |
| Confirm email (`/confirm-registration-email#token`) | `POST /api/registrations/email-confirmation/complete` |
| Forgotten password / reset (`/reset-password#token`) | `POST /api/auth/password-reset/request`, `.../complete` |
| Accept transfer (`/accept-administrator-transfer#token`) | `POST /api/system-administrator/transfers/accept` |
| Overview metric cards | `GET /api/rental-assignments`, `/api/vehicles`, `/api/users` with filters + `PageSize=1`, reading `totalCount` |
| Overview queue | `GET /api/users?Status=1`, `GET /api/rental-assignments`, `GET /api/rental-assignments/{id}/interruptions` |
| Vehicles list / drawer / create / edit / activate / deactivate | `GET,POST /api/vehicles`, `GET,PUT /api/vehicles/{id}`, `POST /api/vehicles/{id}/activate|deactivate` |
| Customers (same shape) | `/api/customers` family |
| Drivers (same shape) | `/api/drivers` family |
| Assignments list / drawer | `GET /api/rental-assignments` (Search, Status, CustomerId, VehicleId, planned/started date bounds, SortBy, paging) |
| Assignment · Summary | `GET /api/rental-assignments/{id}`, `PUT /api/rental-assignments/{id}` |
| Assignment · lifecycle | `POST .../activate`, `.../end`, `.../cancel` |
| Assignment · Driver coverage | `GET,POST /api/rental-assignments/{id}/authorizations`, `POST .../{authId}/stop` (with optional replacement) |
| Assignment · Interruptions | `GET,POST .../interruptions`, `PUT .../{id}`, `POST .../{id}/end` |
| Assignment · Corrections | `PUT .../corrections/parties`, `.../corrections/timeline`, `PUT .../authorizations/{id}/correction`, `PUT .../interruptions/{id}/correction` |
| User directory / Registrations | `GET /api/users` (Search, Status, Role, paging; SortBy documented as ignored, so no sort affordance is offered) |
| User · Account | `GET /api/users/{userId}`, `PUT /api/users/{userId}/name` |
| User · lifecycle | `POST .../activate`, `.../reject-registration`, `.../reopen-registration`, `.../suspend`, `.../restore` |
| User · Roles | `GET,POST /api/users/{userId}/roles`, `PUT .../{id}/expiry`, `POST .../{id}/revoke` |
| User · Sessions | `GET /api/users/{userId}/sessions`, `DELETE .../{sessionId}`, `POST .../revoke-all` |
| Security audit | `GET /api/security-audit` (CompanyId, TargetUserId, EventType, paging) |
| Company profile / first-run setup | `GET,POST /api/companies`, `PUT,DELETE /api/companies/{id}` |
| System Administrator | `POST /api/system-administrator/transfers`, `.../{id}/resend`, `.../{id}/cancel` |
| Your account · Profile | `GET /api/me`, `PUT /api/me/phone` |
| Your account · Sign-in & security | `POST /api/me/password`, `POST /api/me/email-change`, `POST /api/me/email-change/confirm` |
| Your account · Sessions | `GET /api/me/sessions`, `DELETE /api/me/sessions/{id}`, `POST /api/me/sessions/revoke-others` |

Endpoints with no UI: `GET /health` (infrastructure probe).

Documented outcomes designed: field validation (inline, per field, preserving valid input), business conflict, 401 → session-expired screen, 403 → restricted list/panel states, 404, 429, 415/413, 500. Concurrency tokens are surfaced on every privileged correction.

## 4. Intentionally absent, because the API does not support it

Maps and live tracking · telemetry · incident management · financial analytics, invoicing, payments · notification centre · global search · CSV/PDF export · bulk row actions · client-side-only filters or sorts beyond the documented whitelists · vehicle imagery from the reference screenshots · invitation registration in any form · "Remember me" · sorting on the users and audit lists (both documented as ignored) · a multi-row Company list · offline System Administrator recovery, bootstrap and registration-expiry cleanup (operator commands, not browser workflows).

## 5. Settled contract decisions

All former open items are answered. Recorded here because the design depends on them.

1. **Suspension reasons.** `POST /api/users/{userId}/suspend` and `/restore` take no body and audit no reason. Suspend/Restore stay plain confirmation dialogs with no reason field in v1; a reason field is a backend follow-up.
2. **Permission source.** `GET /api/me` returns `permissions: string[]` (plus `roles`) and includes all seven strings missing from Swagger — `Users.ActivateViewer` from Fleet Manager up, `Users.ActivateFleetManager` from Company Principal up, and `Users.ActivateCompanyPrincipal`, `Users.SuspendRestoreCompanyPrincipal`, `Roles.ManageCompanyPrincipal`, `Sessions.ManageAnyUser`, `SecurityAudit.ReadAll` for System Administrator only. They are enforced in service code rather than policy attributes. The UI gates on the `/me` array exclusively.
3. **`isCurrent` is self-view-only.** The "Current session" marker appears on Your account only. Administrators viewing another user's sessions see no such column, chip, or device note — the concept is omitted rather than shown as false.
4. **Overview counts.** The 3–4 `PageSize=1` probes stay for v1 (constant work). They are routed through one function, `metricsModel()`, so a summary endpoint swaps in with a one-file change.
5. **Audit payload shape.** `beforeJson`/`afterJson` are flat `{ "FieldName": scalar-or-null }` objects, changed fields only, identical keys on both sides; a create has an empty before and renders as *Recorded values* instead of a before → after pair. `Registration.Activated` is the one after-only payload with a nested value, `Roles: [{ Role, ExpiresAtUtc }]`, rendered one grant per line. `null` reads as "—". Non-conforming payloads fall through to the raw-JSON note.
6. **Internal rejection reason on the user record.** The record page keeps its "Internal rejection reason" footer, but it depends on a backend follow-up: *expose the latest registration-decision reason on the user read model for reviewers*. Today that reason is stored only in the audit log, which Fleet Managers cannot read, so a reviewer without `SecurityAudit` access has no way to see why a registration was rejected.

7. **The Overview's activity card.** The prototype's card is the audit store's first five rows in stored order, which the paged, time-ordered `GET /api/security-audit` cannot express. v1 reads it through one function (`api/overview.ts`), served by the mock, and the wiring phase repoints that function at whatever the backend exposes for the card.
8. **Reading System Administrator transfers.** Swagger has initiate, resend, cancel and accept, but no read. The System Administrator screen lists every transfer with its state, so v1 reads it through `listTransfers()` — mock-only, one function to repoint. Transfer writes themselves are contractual and audited (`SystemAdministrator.TransferInitiated` / `TransferConfirmationRotated` / `TransferCancelled`).

Closed without work: the authentication panel's monogram pattern is final art (no photograph). Insurance ships in v1 as a stub carrying its "under development" tag.
