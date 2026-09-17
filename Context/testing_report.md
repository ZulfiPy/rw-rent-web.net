# RW-Rent independent test report — run 2

## 1. Summary

**Status:** In progress. Run 2 began on 2026-09-17. This report is being written during the run and is the continuation record if the testing session restarts.

The run covers the full standing brief plus §13: adversarial retesting of every run-1 fix, a first-start rehearsal on an empty developer database, browser completion of workflows that run 1 exercised only through the API, and the unchanged run-1 regression suites.

Finding counts and the owner's three priorities will be finalized after all layers and the final replacement seed.

## 2. Findings

### 2.1 Run-1 findings under retest

| Run-1 id | Former result | Run-2 result | Run-2 evidence |
|---|---|---|---|
| T-001 | Major frontend defect: guarded route exposed System Administrator page | **Fixed** | 540 live browser combinations covered every guarded list/record destination as all four roles, with canonical, upper/mixed-case, percent-encoded, trailing-slash, query, fragment, doubled-slash and extra-segment addresses. All 540 landed correctly; all 56 forbidden matched-route cases showed the lock, rendered no page content and made no protected page request. |
| T-002 | Minor backend defect: validation responses failed documented `oneOf` | **Fixed** | All 142 documented `400` media types use `anyOf`; 97 live validation samples across 42 operations produced zero schema failures. |
| T-003 | Minor backend defect: spaced valid VIN failed before normalization | **Fixed** | Create and update accepted a spaced 17-character VIN and stored the trimmed, upper-case value; a spaced lower-case existing VIN reached the normalized `409 vehicles.vin_code_conflict`; trimmed 100/101-character boundaries also passed. |
| T-004 | Minor frontend defect, later rated Major: rapid submission sent duplicate writes | Dialog path fixed; public-form fix regressed as T-008 | The original 402 px double-Enter phone reproduction sent exactly one `PUT` and read back the stored phone. The shared public-form gate never reopens after a refused request, producing T-008; further dialog gesture coverage continues. |
| T-005 | Minor frontend defect: same-tab link arrival retained stale success | Retest pending | Same, altered, spent and second-valid link sequences are scheduled. |
| T-006 | Owner question: under-age drivers could be authorized | **Decision implemented, but concurrency defect T-007 remains** | All ordinary standalone, initial, replacement and correction paths enforce the new age rule at the authorization date; DRIVER-012 protects relied-on birth dates sequentially. A simultaneous birth-date change and authorization defeats both checks. |

### 2.2 New run-2 findings

| ID | Class | Severity | Side | Area | Rule | Title |
|---|---|---|---|---|---|---|
| T-007 | Defect | Major | Backend | Driver authorization concurrency | AUTH-011, DRIVER-012 | Concurrent birth-date lowering and authorization create persist an open authorization for a 17-year-old driver |
| T-008 | Defect | Major | Frontend | Public account forms | — | A refused public-form request permanently disables all corrected retries until the page is reloaded |

### T-007 · Defect · Major · Backend · AUTH-011, DRIVER-012
**Title**: Concurrent birth-date lowering and authorization create persist an open authorization for a 17-year-old driver

**Steps**: Sign in twice as Fleet Manager and obtain a fresh antiforgery token in each session. Create an active driver born `1996-09-27`, a business customer, an active vehicle and a Planned assignment starting `2026-09-27T10:00:00Z`. Release these two requests at the same instant from the two sessions: (1) `PUT /api/drivers/e86658b8-6668-4ae8-803c-6452c513ac98` with the driver's unchanged required fields and `"dateOfBirth":"2009-09-27"`; (2) `POST /api/rental-assignments/cbf7ceb2-4591-419a-9895-2004b1e5cfba/authorizations` with `{"authorizationType":1,"driverId":"e86658b8-6668-4ae8-803c-6452c513ac98","authorizedFromUtc":"2026-09-27T10:00:00Z","note":"Run 2 age rule"}`. Then read `GET /api/drivers/{id}` and `GET /api/rental-assignments/{id}/authorizations?PageSize=100`.

**Expected**: The pair is serialized or one request is refused. AUTH-011 requires a named driver to be at least 18 on the authorization date, and DRIVER-012 forbids changing a relied-on birth date so the authorization would violate AUTH-011. It must be impossible to commit both writes into an invalid final state.

**Actual**: Both requests succeed. The driver update returns `200` and stores `2009-09-27`; the authorization returns `201`. Readback shows the 17-year-old birth date and one open named authorization beginning on `2026-09-27`, when that driver is exactly 17. The authorization was created at `06:45:30.274294Z` and the driver update committed at `06:45:30.276479Z`, demonstrating the interleaving. The two equivalent checks both pass against stale state and leave the rule violation persisted.

**Evidence**: `/Users/zulf/rw-rent-api/testing-scratch/run2/fixes-api.json`, `race[0]`, contains both exact request bodies, responses and the post-write readback. The controlled start barrier reproduced the invalid state on its first attempt. Sequential no-birth-date, age-17, exact-18 and adult paths all behaved correctly, isolating this to concurrency rather than the basic validation.

**Role**: Fleet Manager in two simultaneous sessions · **Where**: `PUT /api/drivers/{id}` racing `POST /api/rental-assignments/{id}/authorizations` · **Seen**: 1 of 1 barrier-controlled attempts

### T-008 · Defect · Major · Frontend · public account forms
**Title**: A refused public-form request permanently disables all corrected retries until the page is reloaded

**Steps**: Open `/sign-in`. Enter `toms.rudzitis@rwrent.example` with `WrongPassword1!` and click **Sign in**; wait for the `POST /api/auth/login` response and the invalid-credentials message. Replace only the password with the correct current password and click **Sign in** again, then press Enter. Watch requests and the address. A second reproduction reached `/reset-password` through a valid Mailpit link, submitted new password `short`, received its field-validation response, replaced it with a valid strong password, and clicked **Change password** again.

**Expected**: The synchronous duplicate-submit gate blocks only submissions already in flight. Once a response—success or failure—settles, the corrected form can be submitted again without reloading. The corrected sign-in should make a second login request and reach Overview; the corrected reset should make a second completion request.

**Actual**: The first sign-in request returns `401` and the form remains visible. After correcting the password, neither click nor Enter sends another request: the count stays at one and the page remains on `/sign-in`. In the password-reset reproduction, the weak-password response is shown, but the corrected **Change password** action sends no request and the unchanged run-1 browser suite times out waiting for it. Reloading/remounting the page is the only way to obtain a new gate.

**Evidence**: `/Users/zulf/rw-rent-api/testing-scratch/run2/public-retry-ui.json` contains the exact sign-in request count, URL and page text before and after the corrected click/Enter. The unchanged `/Users/zulf/rw-rent-api/testing-scratch/public_flows_ui.js` stopped at its corrected post-validation retry after 30 seconds with no second `/api/auth/password-reset/complete` request.

**Role**: Public visitor/account holder · **Where**: `/sign-in` and token-bearing `/reset-password`; the same shared public form pattern also fronts reset request and transfer acceptance · **Seen**: 2 of 2 refused-then-corrected flows

## 3. Coverage

### 3.1 Run-2 focus and regression ledger

| Layer | Status | Evidence / next boundary |
|---|---|---|
| Run-1 fixes attacked | In progress | T-001, T-002 and T-003 are fixed. T-006's normal paths are fixed, but its deliberate cross-aggregate race fails as T-007. T-004's original dialog path is fixed, but its public-form extension causes T-008. Link attacks continue. |
| Empty-database first start | Complete | All six migrations applied to a recreated database; the public registration/bootstrap/Company/staff/first-rental/recovery path completed, wrong orders were refused, and the documented sample seed restored successfully afterward. |
| App-only completion scenarios | Pending | Private customer, double booking, staff lifecycle, transfer acceptance, corrections, password/email changes, filters/navigation and uninterrupted phone day. |
| API endpoint × role regression | Complete | All 82 operations called as four roles and anonymous; authorization reached the expected boundary, every protected anonymous call was `401`, and public operations remained public while signed in. |
| Rule regression | In progress | The unchanged 96-case domain suite passed. Targeted AUTH-011/DRIVER-012/INTERRUPT-014 testing passed 64/65 checks; the one failure is T-007. |
| Route × role × width × theme regression | Pending | 1512, 834 and 402 px in light and dark. |

### 3.2 Endpoint and role matrix

Status codes are the exact live responses. For write probes, `400`/`404`/`409` means authorization passed and validation or state handling was reached; `403` means the role was refused.

| Operation | System Administrator | Company Principal | Fleet Manager | Viewer | Anonymous |
|---|---:|---:|---:|---:|---:|
| `GET /health` | 200 | 200 | 200 | 200 | 200 |
| `GET /api/users` | 200 | 200 | 200 | 200 | 401 |
| `GET /api/users/{userId}` | 200 | 200 | 200 | 200 | 401 |
| `PUT /api/users/{userId}/name` | 400 | 400 | 403 | 403 | 401 |
| `POST /api/users/{userId}/activate` | 400 | 400 | 400 | 403 | 401 |
| `POST /api/users/{userId}/reject-registration` | 400 | 400 | 400 | 403 | 401 |
| `POST /api/users/{userId}/reopen-registration` | 400 | 400 | 400 | 403 | 401 |
| `POST /api/users/{userId}/suspend` | 404 | 404 | 403 | 403 | 401 |
| `POST /api/users/{userId}/restore` | 404 | 404 | 403 | 403 | 401 |
| `GET /api/users/{userId}/sessions` | 200 | 200 | 403 | 403 | 401 |
| `DELETE /api/users/{userId}/sessions/{sessionId}` | 404 | 404 | 403 | 403 | 401 |
| `POST /api/users/{userId}/sessions/revoke-all` | 404 | 404 | 403 | 403 | 401 |
| `GET /api/rental-assignments/{assignmentId}/authorizations` | 200 | 200 | 200 | 200 | 401 |
| `POST /api/rental-assignments/{assignmentId}/authorizations` | 400 | 400 | 400 | 403 | 401 |
| `POST /api/rental-assignments/{assignmentId}/authorizations/{authorizationId}/stop` | 400 | 400 | 400 | 403 | 401 |
| `PUT /api/rental-assignments/{assignmentId}/authorizations/{authorizationId}/correction` | 400 | 403 | 403 | 403 | 401 |
| `GET /api/rental-assignments/{assignmentId}/interruptions` | 200 | 200 | 200 | 200 | 401 |
| `POST /api/rental-assignments/{assignmentId}/interruptions` | 400 | 400 | 400 | 403 | 401 |
| `PUT /api/rental-assignments/{assignmentId}/interruptions/{interruptionId}` | 400 | 400 | 400 | 403 | 401 |
| `PUT /api/rental-assignments/{assignmentId}/interruptions/{interruptionId}/correction` | 400 | 403 | 403 | 403 | 401 |
| `POST /api/rental-assignments/{assignmentId}/interruptions/{interruptionId}/end` | 400 | 400 | 400 | 403 | 401 |
| `GET /api/auth/antiforgery` | 200 | 200 | 200 | 200 | 200 |
| `POST /api/auth/login` | 401 | 401 | 401 | 401 | 400 |
| `POST /api/auth/logout` | 204 | 204 | 204 | 204 | 204 |
| `POST /api/auth/password-reset/request` | 204 | 204 | 204 | 204 | 400 |
| `POST /api/auth/password-reset/complete` | 400 | 400 | 400 | 400 | 400 |
| `POST /api/companies` | 400 | 403 | 403 | 403 | 401 |
| `GET /api/companies` | 200 | 200 | 200 | 200 | 401 |
| `PUT /api/companies/{id}` | 400 | 400 | 400 | 403 | 401 |
| `DELETE /api/companies/{id}` | 404 | 403 | 403 | 403 | 401 |
| `GET /api/customers` | 200 | 200 | 200 | 200 | 401 |
| `POST /api/customers` | 400 | 400 | 400 | 403 | 401 |
| `GET /api/customers/{id}` | 200 | 200 | 200 | 200 | 401 |
| `PUT /api/customers/{id}` | 400 | 400 | 400 | 403 | 401 |
| `POST /api/customers/{id}/activate` | 404 | 404 | 404 | 403 | 401 |
| `POST /api/customers/{id}/deactivate` | 404 | 404 | 404 | 403 | 401 |
| `GET /api/drivers` | 200 | 200 | 200 | 200 | 401 |
| `POST /api/drivers` | 400 | 400 | 400 | 403 | 401 |
| `GET /api/drivers/{id}` | 200 | 200 | 200 | 200 | 401 |
| `PUT /api/drivers/{id}` | 400 | 400 | 400 | 403 | 401 |
| `GET /api/drivers/{id}/authorizations` | 200 | 200 | 200 | 200 | 401 |
| `POST /api/drivers/{id}/activate` | 404 | 404 | 404 | 403 | 401 |
| `POST /api/drivers/{id}/deactivate` | 404 | 404 | 404 | 403 | 401 |
| `GET /api/interruptions` | 200 | 200 | 200 | 200 | 401 |
| `GET /api/me` | 200 | 200 | 200 | 200 | 401 |
| `PUT /api/me/phone` | 400 | 400 | 400 | 400 | 401 |
| `POST /api/me/password` | 400 | 400 | 400 | 400 | 401 |
| `POST /api/me/email-change` | 400 | 400 | 400 | 400 | 401 |
| `POST /api/me/email-change/confirm` | 400 | 400 | 400 | 400 | 401 |
| `GET /api/me/sessions` | 200 | 200 | 200 | 200 | 401 |
| `DELETE /api/me/sessions/{sessionId}` | 404 | 404 | 404 | 404 | 401 |
| `POST /api/me/sessions/revoke-others` | 200 | 200 | 200 | 200 | 401 |
| `GET /api/overview/summary` | 200 | 200 | 200 | 200 | 401 |
| `POST /api/registrations` | 400 | 400 | 400 | 400 | 400 |
| `POST /api/registrations/email-confirmation/resend` | 202 | 202 | 202 | 202 | 400 |
| `POST /api/registrations/email-confirmation/complete` | 400 | 400 | 400 | 400 | 400 |
| `GET /api/rental-assignments` | 200 | 200 | 200 | 200 | 401 |
| `POST /api/rental-assignments` | 400 | 400 | 400 | 403 | 401 |
| `GET /api/rental-assignments/{id}` | 200 | 200 | 200 | 200 | 401 |
| `PUT /api/rental-assignments/{id}` | 400 | 400 | 400 | 403 | 401 |
| `PUT /api/rental-assignments/{id}/corrections/parties` | 400 | 403 | 403 | 403 | 401 |
| `PUT /api/rental-assignments/{id}/corrections/timeline` | 400 | 403 | 403 | 403 | 401 |
| `POST /api/rental-assignments/{id}/activate` | 400 | 400 | 400 | 403 | 401 |
| `POST /api/rental-assignments/{id}/end` | 400 | 400 | 400 | 403 | 401 |
| `POST /api/rental-assignments/{id}/cancel` | 400 | 400 | 400 | 403 | 401 |
| `GET /api/users/{userId}/roles` | 200 | 200 | 403 | 403 | 401 |
| `POST /api/users/{userId}/roles` | 400 | 400 | 403 | 403 | 401 |
| `PUT /api/users/{userId}/roles/{assignmentId}/expiry` | 404 | 404 | 403 | 403 | 401 |
| `POST /api/users/{userId}/roles/{assignmentId}/revoke` | 400 | 400 | 403 | 403 | 401 |
| `GET /api/security-audit` | 200 | 200 | 403 | 403 | 401 |
| `GET /api/security-audit/{id}` | 200 | 200 | 403 | 403 | 401 |
| `GET /api/system-administrator/transfers` | 200 | 403 | 403 | 403 | 401 |
| `POST /api/system-administrator/transfers` | 400 | 403 | 403 | 403 | 401 |
| `POST /api/system-administrator/transfers/{transferId}/resend` | 400 | 403 | 403 | 403 | 401 |
| `POST /api/system-administrator/transfers/{transferId}/cancel` | 400 | 403 | 403 | 403 | 401 |
| `POST /api/system-administrator/transfers/accept` | 400 | 400 | 400 | 400 | 400 |
| `GET /api/vehicles` | 200 | 200 | 200 | 200 | 401 |
| `POST /api/vehicles` | 400 | 400 | 400 | 403 | 401 |
| `GET /api/vehicles/{id}` | 200 | 200 | 200 | 200 | 401 |
| `PUT /api/vehicles/{id}` | 400 | 400 | 400 | 403 | 401 |
| `POST /api/vehicles/{id}/activate` | 404 | 404 | 404 | 403 | 401 |
| `POST /api/vehicles/{id}/deactivate` | 404 | 404 | 404 | 403 | 401 |

The final report will replace the remaining in-progress ledger rows with the complete rule, route and §9 scenario matrices.

Contract checks also covered success/error response schemas, pagination and filter boundaries, content types, unsupported methods and CORS. The only harness mismatch was its use of a rental-assignment id in the role-assignment path while probing malformed content; the API correctly returned that nonexistent role assignment as `404`. This is not a product finding.

### 3.3 Empty-database first-start rehearsal

The developer database was dropped with forced connection closure, recreated under the documented owner and migrated from nothing through `InitialCreate`, V4, V5, V6, V7 and V8. The API was then restarted from the wiring worktree and the app remained on the wiring dev server.

| First-start checkpoint | Result | Evidence |
|---|---|---|
| Visitor before any account | Pass | Protected destinations redirected to Sign in; the first `/overview` sample was observed in its transient `Loading…` state and redirected once session discovery completed. Public registration remained available. |
| Dedicated administrator registration | Pass | App registration returned `202`; Mailpit confirmation returned `204` and removed the fragment. Sign-in before bootstrap returned `403` and showed **Awaiting activation**. |
| Bootstrap wrong order | Pass | The command refused the unconfirmed known account and an unknown email with `system_administrator.target_not_eligible`. |
| Bootstrap exactly once | Pass | The confirmed pending account was activated; the second command returned `system_administrator.already_exists`. The audit contains `SystemAdministrator.Bootstrapped` by the technical actor. |
| Empty signed-in pages | Pass | Overview and Needs attention showed zero work; fleet lists and registration queue showed reviewed empty states; available create controls appeared; Company showed the explicit **First-run setup** sequence; Administrator and Profile were usable. |
| Singleton Company | Pass | The System Administrator created **Run 2 Empty Start Rentals** in the app (`201`) and read it back. A second `POST /api/companies` returned `409 companies.already_exists`. |
| First Principal, Manager and Viewer | Pass | Three people registered and confirmed through the app, then were activated through the Registrations page with exactly Company Principal, Fleet Manager and Viewer respectively (`200` each). All three appeared in the directory and activation audit. |
| Sole-Principal protection | Pass | Revoke and future-expiry attempts returned `409 roles.final_company_principal`; suspension returned `409 users.final_company_principal`; readback kept the person Active and the non-expiring Principal grant effective. |
| First operational records | Pass | At 402 px/light, the new Fleet Manager created the first vehicle, business customer and adult driver (`201` each), planned the first assignment (`201`), added named coverage (`201`), activated it (`204`) and returned it (`204`). Readback showed Ended with no open authorization. A same-minute first end attempt correctly stayed in the dialog until **Closed at** was later than **Started at**. |
| Offline recovery | Pass | The documented direct recovery command restored the existing administrator, revoked existing sessions and wrote `SystemAdministrator.OfflineRecovery` with reason `Run 2 empty-database recovery rehearsal R2-REC-001`; a fresh sign-in and audit read succeeded. |
| Restore sample baseline | Pass | `seed-development-data --replace true` restored the documented 12 users, 8 roles, 15 sessions, 13 audit entries, 1 transfer, 10 vehicles, 8 customers, 7 drivers, 12 assignments, 6 authorizations and 4 interruptions. Mailpit was cleared and both wiring processes were healthy. |

Evidence is under `/Users/zulf/rw-rent-api/testing-scratch/run2/empty-*.json`; the command refusals and recovery output were also captured during the run. No first-start defect was found.

## 4. Not tested and why

Testing is in progress. Final limitations will be recorded here without treating unrun work as a pass.

## 5. Questions for the owner

None yet.

## 6. Environment

- Test date: 2026-09-17; workstation zone Europe/Tallinn.
- API worktree: `/Users/zulf/rw-rent-api/RWRentApi-wiring`, branch `feature/backend-wiring`, commit `184e4566f2056d3a73fa14b66f84350ec0c24caf` (`Backlog: round 3 reviewed, its live checks run by the reviewer; the birth-date race recorded for the next round`).
- App worktree: `/Users/zulf/rw-rent-api/rw-rent-web-wiring`, branch `feature/backend-wiring`, commit at start `ab5cec13b7c60981589c54ad6794fe22ca39cd68` (`Follow-up 5 verified and implemented; next is testing run 2`).
- Initial replacement seed completed at 2026-09-17 06:24:41 UTC with 12 application users including the technical actor, 11 identity accounts, 8 role assignments, 15 sessions, 5 confirmation challenges, 13 audit entries, 1 administrator transfer, 10 vehicles, 8 customers, 7 drivers, 12 assignments, 6 authorizations and 4 interruptions. Mailpit was cleared.
- API and app processes were verified running from the two wiring worktrees on ports 5001 and 5173 before testing.
- The live OpenAPI 3.1.1 contract contains 82 operations and 103 component schemas.
- Run-1 scripts and evidence are retained outside the worktrees under `/Users/zulf/rw-rent-api/testing-scratch/`; run-2 evidence will remain there.

## 7. Dataset state at the end

Not final. A replacement seed is required after every destructive phase and again at the end; both wiring applications must remain running.
