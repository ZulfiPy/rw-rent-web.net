# RW-Rent independent test report — run 2

## 1. Summary

**Status:** Complete. Run 2 was performed on 2026-09-17 from 06:24 to 09:45 UTC (3 h 21 min) against the two wiring worktrees and their live processes only.

Run 2 found **three defects, all Major**: one backend concurrency hole and two frontend workflow failures. There were **no Blockers, Critical defects, Minor defects, data loss, unauthorized writes, unexpected 500 responses, or process crashes**. All three defects are repeatable and leave a safe refusal or a persisted rule violation described below.

Every run-1 reproduction was attacked again. T-001, T-002, T-003 and T-005 are fixed. T-004's original double-Enter dialog reproduction is fixed, but the replacement public-form submit gate introduces T-008. The owner decision behind T-006 is implemented on ordinary paths, but its two independent checks can be defeated concurrently as T-007.

The empty-database first start completed from database creation through migrations, the first administrator, Company, staff, rental and offline recovery. The 82-operation API surface, all four roles plus anonymous access, all 215 catalogue rules, every guarded route spelling, the end-to-end app workflows, 522 responsive page states, and the unchanged automated/live regressions were covered. The final replacement seed is restored and both wiring applications remain healthy.

**Owner priorities:** (1) prevent T-007's cross-aggregate race before relying on the age rule; (2) restore corrected retries on public account forms in T-008; (3) preserve seconds in the timeline correction UI in T-009. The most surprising result is that 658 automated tests pass while all three Major defects remain live.

## 2. Findings

### 2.1 Run-1 findings under retest

| Run-1 id | Former result | Run-2 result | Run-2 evidence |
|---|---|---|---|
| T-001 | Major frontend defect: guarded route exposed System Administrator page | **Fixed** | 540 live browser combinations covered every guarded list/record destination as all four roles, with canonical, upper/mixed-case, percent-encoded, trailing-slash, query, fragment, doubled-slash and extra-segment addresses. All 540 landed correctly; all 56 forbidden matched-route cases showed the lock, rendered no page content and made no protected page request. |
| T-002 | Minor backend defect: validation responses failed documented `oneOf` | **Fixed** | All 142 documented `400` media types use `anyOf`; 97 live validation samples across 42 operations produced zero schema failures. |
| T-003 | Minor backend defect: spaced valid VIN failed before normalization | **Fixed** | Create and update accepted a spaced 17-character VIN and stored the trimmed, upper-case value; a spaced lower-case existing VIN reached the normalized `409 vehicles.vin_code_conflict`; trimmed 100/101-character boundaries also passed. |
| T-004 | Minor frontend defect, later rated Major: rapid submission sent duplicate writes | Dialog path fixed; public-form fix regressed as T-008 | The original 402 px double-Enter phone reproduction sent exactly one `PUT` and read back the stored phone. Shared action dialogs and INTERRUPT-014 duplicate protection passed. The public-form gate never reopens after a refused request, producing T-008. |
| T-005 | Minor frontend defect: same-tab link arrival retained stale success | **Fixed** | In the same browser tab, registration and reset links were opened valid, then altered, spent and replaced by a second valid token. Each arrival remounted to the right state: valid tokens completed, altered/spent tokens were refused, and no stale success survived navigation. The final reset-spent request was deliberately the sixth request in the rate-limit window and returned the documented `429`, rather than a stale screen. |
| T-006 | Owner question: under-age drivers could be authorized | **Decision implemented, but concurrency defect T-007 remains** | All ordinary standalone, initial, replacement and correction paths enforce the new age rule at the authorization date; DRIVER-012 protects relied-on birth dates sequentially. A simultaneous birth-date change and authorization defeats both checks. |

### 2.2 New run-2 findings

| ID | Class | Severity | Side | Area | Rule | Title |
|---|---|---|---|---|---|---|
| T-007 | Defect | Major | Backend | Driver authorization concurrency | AUTH-011, DRIVER-012 | Concurrent birth-date lowering and authorization create persist an open authorization for a 17-year-old driver |
| T-008 | Defect | Major | Frontend | Public account forms | — | A refused public-form request permanently disables all corrected retries until the page is reloaded |
| T-009 | Defect | Major | Frontend | Assignment corrections | CORRECTION-006 | Correct-timeline dialog silently removes seconds and makes unchanged seeded history impossible to save |

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

### T-009 · Defect · Major · Frontend · CORRECTION-006
**Title**: Correct-timeline dialog silently removes seconds and makes unchanged seeded history impossible to save

**Steps**: Sign in as System Administrator and open seeded ended assignment `2d7b5c86-0007-42d7-92d7-000000000007` (**Skoda Octavia / 400 NDP**). Open **Corrections** → **Correct timeline**. Do not change any of the four dates; change only **Assignment note** to `Run 2 corrected assignment note`, enter a valid audit reason, and click **Save correction**. Inspect the `PUT /api/rental-assignments/{id}/corrections/timeline` request, response, visible fields and record readback.

**Expected**: The correction succeeds and changes only the intended note. Values prefilled from an existing record must preserve the stored instants, or the dialog must submit equivalent instants. If the request is invalid, the responsible controls must identify what needs correction.

**Actual**: All four date-time controls display only minute precision (`2026-08-08T12:10`, `2026-08-08T12:10`, `2026-09-07T12:10`, `2026-09-07T12:10`) although the stored values all include `17.422987` seconds. The unchanged controls therefore submit `:00` seconds. The API returns `409 corrections.timeline_invalid` because the rounded assignment history no longer aligns with its authorization and interruption history. The dialog shows only the generic refusal and marks zero controls invalid; the note is not saved. Repeating the same correction directly with the exact stored timestamps succeeds, and the parties, authorization, interruption and user-name correction dialogs all return `200` and read back correctly.

**Evidence**: `/Users/zulf/rw-rent-api/testing-scratch/run2/timeline-precision-ui.json` contains the stored assignment, the four prefilled control values, `409` response, complete dialog text and `invalid: 0`. `/Users/zulf/rw-rent-api/testing-scratch/run2/corrections-ui.json` independently reproduces the timeline `409` while the other four correction requests return `200` with successful readback.

**Role**: System Administrator · **Where**: `/rental-assignments/2d7b5c86-0007-42d7-92d7-000000000007`, Corrections tab · **Seen**: 2 of 2 UI attempts; exact-timestamp API control passed

## 3. Coverage

### 3.1 Run-2 focus and regression ledger

| Layer | Status | Evidence / next boundary |
|---|---|---|
| Run-1 fixes attacked | Complete | T-001, T-002, T-003 and T-005 are fixed. T-006's normal paths are fixed, but its deliberate cross-aggregate race fails as T-007. T-004's original dialog path is fixed, but its public-form extension causes T-008. |
| Empty-database first start | Complete | All six migrations applied to a recreated database; the public registration/bootstrap/Company/staff/first-rental/recovery path completed, wrong orders were refused, and the documented sample seed restored successfully afterward. |
| App-only completion scenarios | Complete | Business and private customer days, double booking, wrong-car cancellation, staff lifecycle, administrator-transfer acceptance, password/email changes, Company, all correction types, every list-filter combination, browser history and the full phone day were exercised. Timeline correction exposed T-009. |
| API endpoint × role regression | Complete | All 82 operations called as four roles and anonymous; authorization reached the expected boundary, every protected anonymous call was `401`, and public operations remained public while signed in. |
| Rule regression | Complete | All 215 catalogue ids are indexed in §3.2 and supported by the detailed matrix in §3.5. The unchanged 96-case live domain suite passed; targeted AUTH-011/DRIVER-012/INTERRUPT-014 testing passed 64/65 checks, with T-007 the one failure. T-009 is the app-side CORRECTION-006 failure. |
| Route × role × width × theme regression | Complete | 540 adversarial guarded-route combinations passed. A separate 480 authenticated plus 42 public responsive states at 1512/834/402 px in both themes had no document overflow, theme failure, runtime error or HTTP 500. |
| Automated regression | Complete | App unit tests 149/149, API integration tests 370/370 and business-rule tests 139/139 passed; the production app build/typecheck passed. These suites do not detect T-007, T-008 or T-009. |

### 3.2 Rule-result index

This index is the one-line result for every current catalogue id; §3.5 records what was tried on each family.

| Rule ids | Result |
|---|---|
| `DRIVER-001`–`DRIVER-011` | Pass |
| `DRIVER-012` | **Fail — T-007** |
| `VEHICLE-001`–`VEHICLE-009` | Pass |
| `ASSIGN-001`–`ASSIGN-002`, `ASSIGN-004`–`ASSIGN-015` | Pass; `ASSIGN-003` is merged and is not a catalogue row |
| `AUTH-001`–`AUTH-010` | Pass |
| `AUTH-011` | **Fail — T-007** |
| `INTERRUPT-001`–`INTERRUPT-014` | Pass; billing calculation in `INTERRUPT-008` is explicitly future scope |
| `USER-001`–`USER-021` | Pass |
| `CUSTOMER-001`–`CUSTOMER-016` | Pass |
| `COMPANY-001`–`COMPANY-011` | Pass |
| `ROLE-001`–`ROLE-020` | Pass |
| `REGISTRATION-001`–`REGISTRATION-005`, `REGISTRATION-007`–`REGISTRATION-013` | Pass |
| `REGISTRATION-006` | Automated/fallback pass; live delivery failure not injected |
| `SYSTEM-001`–`SYSTEM-014`, `SYSTEM-016`–`SYSTEM-017` | Pass |
| `SYSTEM-015` | N/A — accepted absence of MFA |
| `LOGIN-001`–`LOGIN-008` | Catalogue outcomes pass; related public-form retry defect T-008 |
| `PASSWORD-001`–`PASSWORD-009` | Catalogue outcomes pass; related public-form retry defect T-008 |
| `PROFILE-001`–`PROFILE-003` | Pass |
| `SESSION-001`–`SESSION-015` | Pass; long elapsed windows limited as stated in §4 |
| `AUDIT-001`–`AUDIT-008` | Pass |
| `CORRECTION-001`–`CORRECTION-005`, `CORRECTION-007`–`CORRECTION-010` | Pass |
| `CORRECTION-006` | **Fail in app — T-009; API passes exact timestamps** |
| `EMAIL-001`–`EMAIL-002` | Pass |
| `EMAIL-003`–`EMAIL-004` | N/A — production preparation |

### 3.3 Endpoint and role matrix

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

Contract checks also covered success/error response schemas, pagination and filter boundaries, content types, unsupported methods and CORS. The only harness mismatch was its use of a rental-assignment id in the role-assignment path while probing malformed content; the API correctly returned that nonexistent role assignment as `404`. This is not a product finding.

### 3.4 Empty-database first-start rehearsal

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

### 3.5 Detailed business-rule matrix

Every one of the 215 rule ids in the 2026-09-17 catalogue is accounted for below. “App” means the live React action and its API/readback witness; rules with no app action were exercised directly. A family row includes every id shown, not a sample.

| Rule ids | API attack and result | App attack and result | Outcome |
|---|---|---|---|
| `DRIVER-001`–`DRIVER-011` | Required fields, identity alternatives, future/today DOB, normalization/uniqueness, inactive updates, deactivation with relied-on coverage and non-delete surface in the 96-case domain suite. | Create/update/activate/deactivate, private-customer link and history screens; wrong-order deactivation refused in place. | Pass |
| `DRIVER-012` | Clear/lower DOB with open named coverage was refused sequentially; the simultaneous update/authorization pair both committed. | Ordinary authorized-driver paths enforce the rule; the cross-session race is not preventable in the UI. | **Fail — T-007** |
| `VEHICLE-001`–`VEHICLE-009` | Normalized plate/VIN uniqueness, spaced VIN, 1899/1900, enums, active state, deactivation blockers, activation eligibility and derived availability/upcoming assignment. | Create/edit/retire, wrong-car cancellation, double booking, list/record/Overview availability and all six list filters alone/combined. | Pass |
| `ASSIGN-001`–`ASSIGN-002`, `ASSIGN-004`–`ASSIGN-015` | Coverage, lifecycle, overlap/touching/open-ended ranges, eligibility, wrong order, final-state immutability, cancellation note and exactly-one cancellation audit. (`ASSIGN-003` is intentionally merged and is not a catalogue row.) | Business/private day, double booking, cancel/activate/end/refusal flows, coverage/interruption chips, filter/date boundaries and audit readback. | Pass |
| `AUTH-001`–`AUTH-010` | Type/driver shapes, collective-private refusal, exclusivity, time ordering, duplicate/open history, final coverage, replacement and stop reasons. | Named/collective add, stop-with-replacement, active/end flows and record history. | Pass |
| `AUTH-011` | Standalone, initial, replacement and privileged-correction age 17/exact-18/adult cases pass sequentially; the simultaneous DOB lowering and authorization both commit. | Field refusal and adult paths pass; the independent-session race remains. | **Fail — T-007** |
| `INTERRUPT-001`–`INTERRUPT-014` | Reason/impact/note/time/final bounds, allowed overlap, open-end blocker, retroactive correction and sequential plus simultaneous duplicate identity. Targeted round-3 suite passes every INTERRUPTION-014 case. Billing calculation under `INTERRUPT-008` is explicitly future scope. | Two overlapping interruptions were recorded, blocked assignment end, then closed; correction read back; duplicate refusal maps to the dialog field. | Pass / `INTERRUPT-008` calculation N/A by rule |
| `USER-001`–`USER-021` | Same-id Domain/Identity, system actor exclusion, lifecycle, multi-role union/expiry/revoke, profile limits, Company assignment, security version, statuses union/filter conflicts and non-delete surface. | New staff registration through activation, role expiry, promotion, suspension, Access pending, name correction, directory filters and direct links. | Pass |
| `CUSTOMER-001`–`CUSTOMER-016` | Private/business exclusive shapes, required/unique fields, private Driver link, eligibility/deactivation blockers and immutable type. | Business and private complete rental days, create/update/deactivate refusals, linked-driver coverage, search/type/status filters. | Pass |
| `COMPANY-001`–`COMPANY-011` | Singleton, normalization, role boundaries, reference-protected delete, setup/principal constraints. | Empty-start first Company, update reflected in shell, second create/delete refused, Viewer read-only and first-Principal protection. | Pass |
| `ROLE-001`–`ROLE-020` | Every policy through the 82-operation × four-role matrix; duplicate/expiry/revoke, final Principal and System Administrator protections, permission union and stale-session invalidation. | Four personas, every guarded route spelling, registration activation, grant/expiry/revoke, suspension and Access pending. | Pass |
| `REGISTRATION-001`–`REGISTRATION-005`, `REGISTRATION-007`–`REGISTRATION-013` | Enumeration, known-account branches, token rotation/use/alteration, effective expiry, role boundaries, atomic activation/reject/reopen, purpose separation and cleanup semantics. | Registration, Mailpit confirmation, same/altered/spent/second-valid links, empty-start staff, pending/rejected/expired screens and queue filters. | Pass |
| `REGISTRATION-006` | Delivery succeeded through Mailpit and the committed account/challenge were read; a live SMTP delivery failure was not injected. Automated application/integration coverage passed. | Resend recovery path succeeded. | Not live-failure-tested; see §4 |
| `SYSTEM-001`–`SYSTEM-014`, `SYSTEM-016`–`SYSTEM-017` | Technical/human separation, one-time bootstrap wrong/correct order, transfer initiation/resend/cancel/accept/expiry/read model and offline recovery. Transfer direct suite passed 29/29. | Empty-start bootstrap handoff, transfer resend/Mailpit accept, new administrator readback, old-session revocation and all guarded-address attacks. | Pass |
| `SYSTEM-015` | Rule explicitly accepts absence of MFA in this version. | No MFA surface exists, as specified. | N/A — accepted limitation |
| `LOGIN-001`–`LOGIN-008` | Cookie-only login, lifecycle/lockout/enumeration outcomes, antiforgery separation, rate limits and no-session-on-failure. | Every seeded lifecycle outcome, session return path and signed-in public routes. A refused public form cannot submit a corrected retry, an app defect outside the catalogue's backend outcomes. | Rules pass; **T-008 app defect** |
| `PASSWORD-001`–`PASSWORD-009` | Length/composition/64-character/blocklist/history, authenticated change/reset, token reuse/alteration and all-session revocation. | Weak-password fields, corrected signed-in change, reset links and old/new credential checks. Refused public reset cannot retry without reload. | Rules pass; **T-008 app defect** |
| `PROFILE-001`–`PROFILE-003` | Own phone/password/email only; privileged name correction; email pending/confirmation/session effects. | Phone double-Enter, password weak→corrected retry, email request/Mailpit confirm, old-email 401, new-email 200 and audit. | Pass |
| `SESSION-001`–`SESSION-015` | Cookie/session storage, idle/absolute/retention values, current/other revocation, security-version invalidation and role changes. | Administrator revoked an open-form session (next write 401), session-expired outcome returned to Vehicles; profile session list and Access pending passed. | Pass; elapsed wall-clock limits noted in §4 |
| `AUDIT-001`–`AUDIT-008` | Event inclusion/exclusion, actor/Company/entity, append-only behavior, PascalCase payloads, filtering/paging/detail and catalogue labels. | Cancellation/corrections/security/account events read from list/detail; event and target filters alone/combined. | Pass |
| `CORRECTION-001`–`CORRECTION-005`, `CORRECTION-007`–`CORRECTION-010` | Permission, typed endpoints, optimistic concurrency, rule revalidation, atomic audit and preserved history. Exact-timestamp timeline control succeeds. | Parties, authorization, interruption and user-name correction each returned `200` and read back; role guards passed. | Pass |
| `CORRECTION-006` | Exact stored timestamps plus a note correction return `200`; invalid lifecycle/timeline shapes are refused. | Prefilled timeline inputs round away seconds, so an otherwise unchanged seeded timeline returns `409`. | **Fail — T-009** |
| `EMAIL-001`–`EMAIL-002` | Focused email operations delivered to Mailpit only; token, recipient and persisted state were checked. | Registration, reset, email change, activation/rejection and administrator-transfer messages were consumed locally. | Pass |
| `EMAIL-003`–`EMAIL-004` | Production provider/vendor, sender-domain, bounce and deliverability preparation are explicitly deferred and outside this environment. | No production delivery surface. | N/A — production preparation |

Primary rule evidence: `/Users/zulf/rw-rent-api/testing-scratch/domain-api-tests.json`, `security-api-tests.json`, `run2/fixes-api.json`, `transfer-api-tests.json`, `run2/corrections-ui.json`, `run2/account-security-ui.json`, and the workflow files named in §3.6.

### 3.6 End-to-end app and consistency scenarios

| Scenario | Live result and API/audit witness |
|---|---|
| Public registration and recovery | New/known registration enumeration, Mailpit confirmation, resend, lifecycle outcomes, reset, altered/spent links and rate limiting behaved as documented. Same-tab stale success is fixed; refused-then-corrected submission fails as T-008. |
| Signed-in account security | Weak signed-in password attempt returned `400` with one marked field, corrected retry returned `200`; normalized pending email was shown, confirmation returned `200`, `/api/me` showed the new address and no pending value, old login returned `401`, new login `200`, and both audit events exist. |
| Company and staff | Company update changed the shell; referenced delete returned `409`. A new registration was confirmed, activated as Viewer, expired into Access pending after the real cache boundary, promoted, then suspended; role/user API state and audit agreed. |
| Administrator transfer | Resend returned `200`; Mailpit link acceptance returned `204`; target became the current administrator, prior administrator's session ended, and `SystemAdministrator.TransferAccepted` exists. |
| Business customer day | At 402 px/light: create business customer and two drivers, plan tomorrow, authorize/activate today, replace driver, create two overlapping interruptions, observe disabled End with its reason, close both, end, read back Ended/no open coverage/no open interruptions, and vehicle Available. All writes returned `201`/`204`. |
| Private customer day | Create linked private customer/Driver coverage, plan, authorize, activate and end through the app; every response and final Ended readback passed. |
| Double booking and wrong car | First planned assignment stored; overlapping second returned `409 rental_assignments.planned_range_overlap` and only one remained. Cancellation without valid handover/note was refused under the correct field, valid cancellation returned `204`, and vehicle availability returned to Available. |
| Corrections | Parties, authorization, interruption and legal-name corrections returned `200`, read back and audited. Timeline correction is T-009. Viewer/Manager/Principal correction permissions were refused by API and guarded UI. |
| Session loss and role loss | Revoked session made the already-open mutation return `401` and show Session expired; re-login returned to `/vehicles`. Revoking the only role led to Access pending on list and record deep links with no business navigation; direct API returned `403`. |
| List filters and history | 36 live cases covered every app filter alone and all filters combined for assignments, vehicles, customers, drivers, users, registrations and audit, plus paging beyond the end. Seven combined list states × six width/theme combinations had no overflow. Browser Back/Forward never resurrected a dialog; Cancel closed normally. |
| API unavailable and recovery | With the wiring API process genuinely stopped, Vehicles displayed **The API did not answer** and kept the route. After the same wiring API restarted, reloading the same browser recovered the list. |
| Accountant checks | Overview totals, lists, record chips, open coverage/interruption counts and vehicle availability were compared after workflows. Every write was followed by record/list readback; security/correction/cancellation writes were matched to their audit entries. No unexplained duplicate audit was found. |

Evidence: `/Users/zulf/rw-rent-api/testing-scratch/run2/business-day-ui.json`, `run2/private-day-ui.json`, `run2/double-booking-ui.json`, `wrong-car-ui.json`, `run2/staff-lifecycle-ui.json`, `run2/suspend-restore-ui.json`, `run2/transfer-accept-ui.json`, `run2/corrections-ui.json`, `run2/account-security-ui.json`, `run2/filters-navigation-ui.json`, `session-access-ui.json`, and `degraded-ui.json`.

#### §9 scenario-catalogue disposition

| Brief scenario | Result |
|---|---|
| §9.1 Public screens and registration | **Fail — T-008**. All lifecycle, enumeration, validation, Mailpit, token, link, lockout/rate and outcome cases passed except corrected retry after a refused public request. Long elapsed windows are limited in §4. |
| §9.2 Session and account | Pass. Session revocation/return, own/admin session operations, signed-in password and email changes, phone, permissions and Access pending passed. |
| §9.3 Roles, permissions, protection | Pass. Four-role endpoint/route/action matrices, grant/expiry/revoke, suspend/restore, protected principals/administrator, corrections and registration decisions passed. |
| §9.4 System Administrator | Pass. Initiate/target/password/token/cancel/resend/accept/expiry/recovery paths and post-accept session/audit state passed; baseline was restored. |
| §9.5 Company | Pass. Singleton, validation, update/cache, permissions and referenced-delete cases passed. |
| §9.6 Vehicles | Pass. Normalization/boundaries/enums, eligibility, retire blockers, derived availability, ten seeded rows, filters and paging passed. |
| §9.7 Customers and drivers | **Fail — T-007**. All ordinary customer/driver cases, record/history/search and age paths pass; the DOB/authorization race violates the approved age rule. |
| §9.8 Assignments, authorizations, interruptions, corrections | **Fail — T-007, T-009**. Lifecycle/coverage/interruption/cancellation/list cases pass; the age race and timeline-dialog precision failure remain. |
| §9.9 Security audit | Pass. Inclusion/exclusion, actor/target/Company/entity/reason/PascalCase payload, labels, permissions, filter and detail cases passed without unexplained duplicates. |
| §9.10.1 Business customer | Pass, including the complete 402 px/light run. |
| §9.10.2 Private customer | Pass, including linked Driver, collective refusal, named coverage and closure. |
| §9.10.3 Wrong car | Pass at desktop/dark and phone/light; invalid then valid cancellation and audit/availability agreed. |
| §9.10.4 Double booking | Pass: overlapping refused, exact-touch allowed, open-ended collision, retire/cancel/retire/post-retire plan semantics passed across direct and app cases. |
| §9.10.5 Vacation cover / wrong order | **Fail — T-008, T-009**. Ordinary refusal placement/recovery passed; these two dialogs/forms can remain unusable after the refused action. No 500 occurred. |
| §9.10.6 New staff | Pass. Register/confirm/pending/activate/real expiry/Access pending/promote/suspend-mid-session and a separate live app suspend→restore readback passed. |
| §9.10.7 Account under attack | **Fail — T-008**. Lockout, rate limits, spent reset, antiforgery replay and session revocation passed at the API and their normal screens; the public form cannot make the repeated corrected submissions without reload. |
| §9.10.8 Platform handover | Pass. Initiate/resend/cancel/re-initiate/accept semantics were covered by 29 direct cases plus the live app acceptance; re-seeded. |
| §9.10.9 Two people at once | Pass except the distinct T-007 race. Stale assignment, role and vehicle actions were refused and recovered; no lost update or 500 appeared. |
| §9.10.10 Phone day | Pass for the requested business and wrong-car days at 402 px/light. |
| §9.11 App in general | **Fail — T-008, T-009**. Route/layout/theme/loading/empty/error/unreachable/navigation/accessibility basics passed; the two workflow defects remain. Physical mobile keyboard/screen reader limits are in §4. |

### 3.7 Route, responsive, accessibility and duplicate-action coverage

- The guarded-route attack made **540/540** role/address checks pass: all guarded list and record destinations, every role, canonical/upper/mixed case, percent encoding, trailing slash, query, fragment, doubled slash and extra segment. All 56 forbidden matched-route cases rendered the lock, no protected page content and no protected page request.
- The layout sweep captured **480 authenticated states** (20 destinations × four roles × three widths × two themes) and **42 public states** (seven routes × three widths × two themes). There were zero document horizontal overflows, theme mismatches, runtime errors, HTTP 500s or public art-panel breakpoint errors. The raw geometry scanner intentionally sees the translated off-canvas navigation and scrollable phone tab strip outside the viewport; visual evidence confirms they remain contained and reachable.
- Action dialogs were exercised across desktop, tablet and 402 px phone layouts in light and dark during the scenario suite. The original 402 px rapid double-Enter phone update emitted one `PUT` and stored one value. INTERRUPT-014's sequential and barrier-controlled duplicate submissions left one record. Dialog focus, labels, marked fields, Cancel/Close, bottom sheets and keyboard Enter paths were checked; no unexpected duplicate write survived.
- The public submit gate does suppress an in-flight duplicate, but its failure path never reopens; that is T-008, not a duplicate persisted write.

Evidence: `/Users/zulf/rw-rent-api/testing-scratch/run2/route-guard-ui.json`, `/Users/zulf/rw-rent-api/testing-scratch/responsive-matrix/matrix.json`, `/Users/zulf/rw-rent-api/testing-scratch/accessibility-checks.json`, and `/Users/zulf/rw-rent-api/testing-scratch/run2/fixes-api.json`.

### 3.8 Contract, security and automated regression totals

| Check | Result |
|---|---|
| Live OpenAPI | 82 operations, 103 component schemas; every protected anonymous request `401`; role boundary matrix in §3.3. |
| Response contract | 142 documented `400` media types use `anyOf`; 97 live validation payloads produced zero schema failures. |
| Direct live domain suite | 96/96 passed. |
| Direct live security suite | 92/92 passed. |
| Round-3 targeted live suite | 64/65 passed; the one failure is T-007. |
| Administrator-transfer live suite | 29/29 passed. |
| Rate limits | Registration: eight `202`, then `429`; recovery: five `204`, then `429`; administrator security: five `409`, then `429`. |
| App unit suite | 149/149 passed across 15 files. |
| API integration suite | 370/370 passed. |
| Business-rule unit suite | 139/139 passed. |
| Production app build/typecheck | Passed; the known single-bundle size warning remains accepted in §3 of the brief. |

Malformed JSON/body/type/unknown-id/conflict probes returned documented problem JSON, not 500. Pagination limits, filter conflicts, unsupported methods, antiforgery binding, evil-origin CORS, cookie attributes, public operations while signed in and cross-role writes were included. The 658 passing automated tests do not cover the three live Major defects.

## 4. Not tested and why

- Production topology and provider behavior (TLS, deployed origins/cookie domains, real transactional-email credentials, sender-domain/SPF/DKIM/DMARC/bounces) are outside the brief's local environment. `EMAIL-003`/`EMAIL-004` and a real SMTP delivery failure for `REGISTRATION-006` are therefore not claimed as live passes. Mailpit success and automated failure-path tests passed.
- MFA is absent by the accepted `SYSTEM-015` decision; no MFA test is possible.
- The two-hour idle, twelve-hour absolute, 90-day retention, one-hour reset, 24-hour challenge and seven-day registration windows were not awaited in real time. Exact expiry instants, just-before/at/after logic, materialized/effective state and invalidation were tested through APIs, persisted readback and automated tests.
- A headless browser cannot raise a real mobile software keyboard or run a screen reader. Phone bottom-sheet geometry, focusable labels, keyboard Enter/Tab paths, field errors and scroll containment were checked, but physical-keyboard occlusion and assistive-technology narration require a device/manual accessibility pass.
- Per the assignment, Tasks, Insurance cases, interruption billing calculation, production performance/load and the accepted single-bundle architecture were not tested or reported as defects.

## 5. Questions for the owner

None. Run 1's minimum-driver-age question is now answered by AUTH-011/DRIVER-012; T-007 is an implementation defect in that approved decision, not a new policy question.

## 6. Environment

- Test date: 2026-09-17; workstation zone Europe/Tallinn.
- API worktree: `/Users/zulf/rw-rent-api/RWRentApi-wiring`, branch `feature/backend-wiring`, commit `184e4566f2056d3a73fa14b66f84350ec0c24caf` (`Backlog: round 3 reviewed, its live checks run by the reviewer; the birth-date race recorded for the next round`).
- App worktree: `/Users/zulf/rw-rent-api/rw-rent-web-wiring`, branch `feature/backend-wiring`, commit at start `ab5cec13b7c60981589c54ad6794fe22ca39cd68` (`Follow-up 5 verified and implemented; next is testing run 2`).
- Initial replacement seed completed at 2026-09-17 06:24:41 UTC with 12 application users including the technical actor, 11 identity accounts, 8 role assignments, 15 sessions, 5 confirmation challenges, 13 audit entries, 1 administrator transfer, 10 vehicles, 8 customers, 7 drivers, 12 assignments, 6 authorizations and 4 interruptions. Mailpit was cleared.
- API and app processes were verified running from the two wiring worktrees on ports 5001 and 5173 before testing.
- The live OpenAPI 3.1.1 contract contains 82 operations and 103 component schemas.
- Browser: Playwright 1.63.0 with Chrome for Testing 153.0.8010.12, headless, at 1512×982/950, 834×1112/1050/1000 and 402×874 in light and dark themes.
- Runtime/tools: .NET SDK 10.0.203, Node 25.9.0, npm 11.12.1, `curl`/Python direct-API harnesses, Mailpit HTTP API and read-only PostgreSQL checks. The empty-database exception used the exact §13 PostgreSQL commands.
- Final automated suites: app 149/149, API 370/370, business rules 139/139; production app build/typecheck passed.
- Run-1 scripts and evidence are retained outside the worktrees under `/Users/zulf/rw-rent-api/testing-scratch/`; run-2 evidence is under its `run2/` and named regression files.

## 7. Dataset state at the end

Final replacement seed completed successfully at 2026-09-17 09:45 UTC after all tests: 1 Company, 12 Application Users (11 human plus technical actor), 11 Identity accounts, 8 role assignments, 15 sessions, 5 confirmation challenges, 13 audit entries, 1 administrator transfer, 10 vehicles, 8 customers, 7 drivers, 12 assignments, 6 authorizations and 4 interruptions. Mailpit contains zero messages.

The API is listening on port 5001 from `/Users/zulf/rw-rent-api/RWRentApi-wiring/src/RWRentApi.Api` and `GET /health` returns `200`. The app is listening on port 5173 from `/Users/zulf/rw-rent-api/rw-rent-web-wiring` and returns `200`. No process from either main checkout was started or tested.
