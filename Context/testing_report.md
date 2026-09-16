# RW-Rent independent test report — run 1

## 1. Summary

**Status:** In progress. Testing began 2026-09-16 after a full replacement seed at 11:39:51 UTC.

Coverage and finding counts will be finalized at the end of the run. No result is treated as a pass until the API response, app behavior, stored state where relevant, and audit history have been compared.

## 2. Findings

| ID | Class | Severity | Side | Area | Rule | Title |
|---|---|---|---|---|---|---|
| T-001 | Defect | Major | Frontend | System Administrator | ROLE-011, SYSTEM-010 | Deep link falsely presents any signed-in user as the System Administrator and offers transfer |
| T-002 | Defect | Minor | Backend | Live OpenAPI contract | — | Every validation-problem response violates the documented `oneOf` schema |
| T-003 | Defect | Minor | Backend | Vehicles | VEHICLE-002 | A valid 17-character VIN with surrounding spaces is rejected before normalization |

### T-001 · Defect · Major · Frontend · ROLE-011, SYSTEM-010
**Title**: Deep link falsely presents any signed-in user as the System Administrator and offers transfer

**Steps**: (the app) Sign in as Signe Priede (Company Principal), Karlis Zvaigzne (Fleet Manager), or Toms Rudzitis (Viewer); type `http://localhost:5173/system-administrator` directly into the address bar; observe the “Current System Administrator” panel; click **Initiate transfer**; enter `liga.brice@example.com`, the signed-in person's valid current password, and reason `Independent test of forbidden transfer action`; click **Initiate transfer** again. (the API witness) Observe the resulting `POST /api/system-administrator/transfers` response.

**Expected**: The System Administrator route and transfer action are not offered to any of these roles. A deep link should render an access-denied state or redirect to a permitted page, and it must not identify the current signed-in person as the System Administrator. ROLE-011 says a Company Principal cannot administer System Administrator; SYSTEM-010 reserves initiation to the current human System Administrator. The app README says actions a persona can never hold are hidden and the API and app enforce the same permissions.

**Actual**: All three roles receive a complete System Administrator page. “Current System Administrator” shows the signed-in ordinary user's own name and email, `Since —`, and an enabled **Initiate transfer** button. The full transfer dialog opens and accepts the fields. Only after submission does the API protect the operation with `403`, body `{"type":"https://httpstatuses.com/403","title":"Authorization failed.","status":403,"detail":"The authenticated user is not allowed to perform this operation.","code":"authorization.forbidden"}`; the dialog then says “Not permitted”.

**Evidence**: Reproduced independently as all three non-administrator roles. Screenshots: `/Users/zulf/rw-rent-api/testing-scratch/browser-smoke/restricted_system_principal.png`, `restricted_system_manager.png`, and `restricted_system_viewer.png`. The captured page/dialog text and exact response are in `/Users/zulf/rw-rent-api/testing-scratch/browser-smoke/restricted-route.json`. The API made no state change.

**Role**: Company Principal, Fleet Manager, Viewer · **Where**: direct route `/system-administrator` › Current System Administrator › Initiate transfer · **Seen**: 3 of 3 roles, 1 attempt each

### T-002 · Defect · Minor · Backend · no rule id (live contract)
**Title**: Every validation-problem response violates the documented `oneOf` schema

**Steps**: Fetch `GET /openapi/v1.json`. For a concrete example, sign in as any role allowed to correct names, obtain a fresh antiforgery token, then send `PUT /api/users/{tomsUserId}/name` with `Content-Type: application/json` and body `{}`. Validate the returned JSON against the exact schema documented for response `400`: `oneOf` `ProblemDetails` and `ValidationProblemDetails`. Repeat with any request that produces field errors, such as empty activation roles or an empty interruption body.

**Expected**: A response described by an OpenAPI `oneOf` validates against exactly one branch. The field-validation payload should validate as `ValidationProblemDetails` and not as generic `ProblemDetails`.

**Actual**: The API returns a useful `400 application/problem+json`, for example `{"title":"One or more validation errors occurred.","status":400,"errors":{"FirstName":["'First Name' must not be empty."],"LastName":["'Last Name' must not be empty."],"Reason":["Reason must be at least 3 characters."]}}`. In the live schema, generic `ProblemDetails` allows undeclared properties and does not require `code`, so that same payload also validates as `ProblemDetails`. It therefore matches both branches and fails the `oneOf`. Standards-based Draft 2020-12 validation reproduced this on 97 responses across 42 operations; all successful response bodies validated.

**Evidence**: `/Users/zulf/rw-rent-api/testing-scratch/contract-tests.json`, `responseContractFailures`; the validator error is “valid under each of ValidationProblemDetails, ProblemDetails”.

**Role**: System Administrator, Company Principal, Fleet Manager where permitted · **Where**: live `/openapi/v1.json` and every documented `400` field-validation response · **Seen**: 97 of 97 validation-problem responses sampled

### T-003 · Defect · Minor · Backend · VEHICLE-002
**Title**: A valid 17-character VIN with surrounding spaces is rejected before normalization

**Steps**: Sign in as System Administrator or Fleet Manager and obtain a fresh antiforgery token. (Create) `POST /api/vehicles` with `{"plateNumber":" tst 1900 ","vinCode":" tstvin00000001900 ","make":"Test","model":"Model","year":1900,"bodyType":1,"gearboxType":1,"fuelType":1,"color":"Midnight Blue"}`. The VIN between the spaces is exactly 17 characters. (Update) Create the same vehicle with unspaced VIN `TSTVIN00000001900`, then `PUT /api/vehicles/{id}` with all current fields but VIN `" tstvin00000001900 "`. A duplicate check was also tried using an existing 17-character VIN in lower case with one space at each end.

**Expected**: The API trims and upper-cases the VIN before persistence and uniqueness comparison, as required by the vehicle scenario catalogue and used for VEHICLE-002. Create/update should accept the first two requests and store `TSTVIN00000001900`; the existing-VIN request should reach the normalized uniqueness check and return the duplicate conflict.

**Actual**: Create and update both return `400 application/problem+json`: `{"title":"One or more validation errors occurred.","status":400,"errors":{"VinCode":["The length of 'Vin Code' must be 17 characters or fewer. You entered 19 characters."]}}`. The duplicate case returns the same length error rather than the duplicate conflict. Removing the two surrounding spaces makes the create succeed and the response stores the upper-case VIN.

**Evidence**: `/Users/zulf/rw-rent-api/testing-scratch/domain-api-tests.json`, rows “Vehicle duplicate VIN is normalized”, “Create normalized vehicle at year lower boundary”, and the follow-up update response captured during the same run.

**Role**: System Administrator · **Where**: `POST /api/vehicles`, `PUT /api/vehicles/{id}` · **Seen**: 3 of 3 attempts (create, update, duplicate)

## 3. Coverage

### 3.1 Rule matrix

In progress. Every catalogue rule will receive an API result and an app result or an explicit reason why one surface is not applicable.

### 3.2 Endpoint and role matrix

In progress. The live OpenAPI document was captured from the running API after confirming its process directory.

### 3.3 Route, role, width and theme matrix

Desktop/light smoke completed for every in-scope shell route as System Administrator, Company Principal, Fleet Manager and Viewer, including seeded record deep links. No horizontal overflow or HTTP 500 occurred. T-001 was found on the hidden System Administrator route. Restricted Security Audit deep links rendered an explicit “Not available to you” state and the API returned 403. Public account routes and the seeded confirmed-pending, rejected, expired and suspended sign-in outcomes rendered without a 500. Full width/theme and interaction coverage remains in progress.

### 3.4 Scenario catalogue

In progress.

## 4. Not tested and why

In progress.

## 5. Questions for the owner

None recorded yet.

## 6. Environment

- Test date: 2026-09-16; workstation zone Europe/Tallinn.
- API worktree: `/Users/zulf/rw-rent-api/RWRentApi-wiring`, branch `feature/backend-wiring`, commit `15bb871cbea95ec59831a08dde617ef264425354` (`Backlog: the testing phase and where its findings arrive`).
- App worktree: `/Users/zulf/rw-rent-api/rw-rent-web-wiring`, branch `feature/backend-wiring`, commit at start `28858c1281e4e86a347cc1b6bc2a3363731af1e1` (`Testing brief: only the wiring folders, both sides, recent changes as the risk map, tools and scratch folder for an outside model`).
- API process verified listening on port 5001 with working directory under `RWRentApi-wiring/src/RWRentApi.Api`.
- App process verified listening on port 5173 with working directory `rw-rent-web-wiring`.
- Initial replacement seed completed at 2026-09-16 11:39:51 UTC with the documented counts (12 application users including the technical actor, 10 vehicles, 8 customers, 7 drivers, 12 assignments, 6 authorizations, 4 interruptions, 13 audit entries, 1 administrator transfer).
- Primary evidence and scripts are kept outside both worktrees in `/Users/zulf/rw-rent-api/testing-scratch/`.

## 7. Dataset state at the end

Not final yet. The dataset will be replacement-seeded once more after all testing, and both wiring applications will be left running.
