# RW-Rent independent test report — run 1

## 1. Summary

**Status:** Complete. Testing ran 2026-09-16 from 11:39 to 13:05 UTC, with replacement seeds between destructive scripts and a final replacement seed.

Coverage: all 82 live OpenAPI operations across System Administrator, Company Principal, Fleet Manager, Viewer and anonymous; every current catalogue rule id plus the explicitly merged legacy ASSIGN-003 id; 480 signed-in route/role/width/theme combinations and 42 public combinations; all §9 scenario bullets. Direct suites completed 95/97 domain checks (the two failures are T-003), 92/92 account/security checks and 29/29 administrator-transfer checks. Important app workflows were read back through the API and audit log.

Findings: **5 Defects** (1 Major, 4 Minor), **1 Question** (Info), 0 Blockers, 0 Gaps and 0 Prototype findings. The API's authorization boundaries held in direct testing; no unauthorized write, secret leakage, data loss or unexpected 500 was found.

The owner should look first at:

1. **T-001** — the hidden System Administrator deep link tells three ordinary roles that they are the current administrator and offers a transfer action.
2. **T-005** — a spent registration/reset link reopened in the same tab falsely keeps showing success instead of checking the single-use token again.
3. **T-003** — VIN normalization occurs after length validation, so a valid spaced 17-character VIN cannot be entered as promised.

## 2. Findings

| ID | Class | Severity | Side | Area | Rule | Title |
|---|---|---|---|---|---|---|
| T-001 | Defect | Major | Frontend | System Administrator | ROLE-011, SYSTEM-010 | Deep link falsely presents any signed-in user as the System Administrator and offers transfer |
| T-002 | Defect | Minor | Backend | Live OpenAPI contract | — | Every validation-problem response violates the documented `oneOf` schema |
| T-003 | Defect | Minor | Backend | Vehicles | VEHICLE-002 | A valid 17-character VIN with surrounding spaces is rejected before normalization |
| T-004 | Defect | Minor | Frontend | Dialog submission | — | Pressing Enter twice sends the same phone update twice |
| T-005 | Defect | Minor | Frontend | Emailed account links | REGISTRATION-004, PASSWORD-008 | Reopening a spent link in the same tab leaves the old success screen in place |
| T-006 | Question | Info | Both | Drivers | DRIVER-004 | A person born today can be created and authorized as a driver |

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

### T-004 · Defect · Minor · Frontend · no rule id (§9.11 dialog checks)
**Title**: Pressing Enter twice sends the same phone update twice

**Steps**: At 402 px in the light theme, sign in as Dita Smite and open **Your account** › **Profile**. Click **Update phone**, replace the value with `+371 20 123 456`, then press Enter twice in quick succession while the input still has focus. Observe the browser network and read `GET /api/me` after the dialog closes.

**Expected**: Enter submits the primary action once. The submit control becomes busy synchronously enough that the second key press cannot start a duplicate request, as required by the dialog checks in §9.11.

**Actual**: The app sends two identical `PUT /api/me/phone` requests. Both return `200`; the final stored phone is correct, but the operation ran twice.

**Evidence**: `/Users/zulf/rw-rent-api/testing-scratch/accessibility-checks.json` records `updateRequests: 2`, `updateResponses: [200, 200]`, and the successful readback. The same run confirms focus initially lands on the phone input and Escape closes the dialog.

**Role**: Company Principal · **Where**: Profile › Update phone · **Seen**: 2 of 2 double-Enter attempts

### T-005 · Defect · Minor · Frontend · REGISTRATION-004, PASSWORD-008
**Title**: Reopening a spent link in the same tab leaves the old success screen in place

**Steps**: (registration) Register `browser.flow.20260916@example.com` in the app, open the Mailpit confirmation link in a tab, wait for **Email confirmed**, then open the exact same link again in that same tab. (password reset) Request a reset for Toms, open the Mailpit reset link, successfully set a new password, wait for **Password changed**, then open that exact reset link again in the same tab. Watch the network in both cases. Finally open each spent link in a fresh tab.

**Expected**: A second visit consumes the fragment again, calls the API, and shows **This confirmation/reset link cannot be used**, because the tokens are single-use. The result must not depend on whether the link opens in a new or already-used tab.

**Actual**: In the already-used tab the address changes to the fragment link, but the component retains its prior completed state. It sends no second request and continues to show **Email confirmed** or **Password changed**. Opening the same link in a fresh tab sends the request; the API correctly returns `400` and the app then shows the unusable-link outcome.

**Evidence**: `/Users/zulf/rw-rent-api/testing-scratch/public-flows-ui.json`: both same-tab repetitions record `sameTabStillShowsSuccess: true` and `sameTabRepeatRequests: 0`; both fresh-tab repetitions are refused. The first visits removed their token fragments and completed successfully (`202/204` as applicable).

**Role**: Public account flow · **Where**: `/confirm-registration-email` and `/reset-password` fragment links · **Seen**: 2 of 2 link types

### T-006 · Question · Info · Both · DRIVER-004
**Title**: A person born today can be created and authorized as a driver

**Steps**: Sign in as Fleet Manager. Send `POST /api/drivers` with required contact/licence fields and `dateOfBirth: "2026-09-16"`; send the same valid shape for a person born `2009-09-16` (exactly 17 on the test date). Then send `POST /api/rental-assignments/2d7b5c86-0004-42d7-92d7-000000000004/authorizations` naming the first driver's returned id and the assignment's planned start.

**Expected**: The catalogue currently says only that birth date may not be in the future, so acceptance follows DRIVER-004. From the rental counter, however, a minimum driving age or an explicit decision that licence possession is the sole eligibility check is needed.

**Actual**: Both drivers are created with `201`, including the person born on the test date, and the same-day newborn driver is accepted for a named authorization with `201`.

**Evidence**: `/Users/zulf/rw-rent-api/testing-scratch/age-boundary-tests.json` contains the three request readbacks and statuses. No minimum-age validation exists in the live contract or rule catalogue.

**Role**: Fleet Manager · **Where**: `POST /api/drivers`, assignment authorization · **Seen**: 1 of 1 today case; 1 of 1 age-17 case

## 3. Coverage

### 3.1 Rule matrix

The result is against the running API first and the app wherever the rule has an app surface. “Partial” means the enforceable boundary was inspected but the wall-clock duration was not allowed to elapse.

| Rule | Result | What was tried |
|---|---|---|
| `DRIVER-001` | Pass | Drivers are deactivated rather than physically deleted, and the API exposes no delete operation. Direct API required/unique/date/lifecycle/deactivation cases plus UI driver creation/readback. |
| `DRIVER-002` | Pass | A newly created driver is always active. Direct API required/unique/date/lifecycle/deactivation cases plus UI driver creation/readback. |
| `DRIVER-003` | Pass | A driver must have at least one of personal ID or date of birth. Direct API required/unique/date/lifecycle/deactivation cases plus UI driver creation/readback. |
| `DRIVER-004` | Question — T-006 | A driver's date of birth, when provided, must not be in the future. Future DOB was refused; DOB today and age 17 were accepted, and the today-DOB driver could be authorized. |
| `DRIVER-005` | Pass | A driver's email, phone number, and driver licence number must each be unique across all drivers (comp… Direct API required/unique/date/lifecycle/deactivation cases plus UI driver creation/readback. |
| `DRIVER-006` | Pass | A driver's personal ID, when provided, must be unique across all drivers. Direct API required/unique/date/lifecycle/deactivation cases plus UI driver creation/readback. |
| `DRIVER-007` | Pass | A driver cannot be deactivated while they have an open named-Driver authorization on any active assign… Direct API required/unique/date/lifecycle/deactivation cases plus UI driver creation/readback. |
| `DRIVER-008` | Pass | Deactivating a driver never automatically stops an authorization or ends, cancels, interrupts, or othe… Direct API required/unique/date/lifecycle/deactivation cases plus UI driver creation/readback. |
| `DRIVER-009` | Pass | Updating a driver's administrative details never changes the driver's active state. Direct API required/unique/date/lifecycle/deactivation cases plus UI driver creation/readback. |
| `DRIVER-010` | Pass | An inactive driver's details may still be corrected through an update. Direct API required/unique/date/lifecycle/deactivation cases plus UI driver creation/readback. |
| `DRIVER-011` | Pass | A driver requires a first name, last name, address, email, phone number, and driver licence number. Direct API required/unique/date/lifecycle/deactivation cases plus UI driver creation/readback. |
| `VEHICLE-001` | Pass | A vehicle's plate number must be unique across all vehicles. Direct API normalization/year/enum/lifecycle/availability/overlap cases plus list/record UI. |
| `VEHICLE-002` | Fail — T-003 | A vehicle's VIN code must be unique across all vehicles. Create/update/duplicate with a trimmed-valid 17-character VIN failed before normalization. |
| `VEHICLE-003` | Pass | A vehicle's manufacturing year must be 1900 or later. Direct API normalization/year/enum/lifecycle/availability/overlap cases plus list/record UI. |
| `VEHICLE-004` | Pass | A vehicle has an active/inactive state and is active when created. Direct API normalization/year/enum/lifecycle/availability/overlap cases plus list/record UI. |
| `VEHICLE-005` | Pass | A vehicle's body type, gearbox type, and fuel type must each be one of the defined categories. Direct API normalization/year/enum/lifecycle/availability/overlap cases plus list/record UI. |
| `VEHICLE-006` | Pass | Vehicles are deactivated rather than physically deleted, and the API exposes no Vehicle delete operation. Direct API normalization/year/enum/lifecycle/availability/overlap cases plus list/record UI. |
| `VEHICLE-007` | Pass | An inactive Vehicle cannot be selected for a new Assignment or used to activate a planned Assignment. Direct API normalization/year/enum/lifecycle/availability/overlap cases plus list/record UI. |
| `VEHICLE-008` | Pass | A Vehicle cannot be deactivated while it has a Planned or Active Assignment. Every such Assignment mus… Direct API normalization/year/enum/lifecycle/availability/overlap cases plus list/record UI. |
| `VEHICLE-009` | Pass | A Vehicle's availability is derived at read time and never stored: Retired when the Vehicle is inactiv… Direct API normalization/year/enum/lifecycle/availability/overlap cases plus list/record UI. |
| `ASSIGN-001` | Pass | An assignment links exactly one customer to exactly one vehicle. A planned assignment may temporarily … Direct API lifecycle/timestamp/overlap/final-state cases plus complete UI business and wrong-car flows. |
| `ASSIGN-002` | Pass | A Planned assignment requires PlannedStartAtUtc. An assignment created directly as Active may omit Pla… Direct API lifecycle/timestamp/overlap/final-state cases plus complete UI business and wrong-car flows. |
| `ASSIGN-003` | N/A | Merged into ASSIGN-002; no independent current rule. Legacy id is explicitly merged into ASSIGN-002. |
| `ASSIGN-004` | Pass | A vehicle may have at most one active assignment at any time. Authorizing multiple drivers under that … Direct API lifecycle/timestamp/overlap/final-state cases plus complete UI business and wrong-car flows. |
| `ASSIGN-005` | Pass | An assignment's status is one of Planned, Active, Ended, or Cancelled. Direct API lifecycle/timestamp/overlap/final-state cases plus complete UI business and wrong-car flows. |
| `ASSIGN-006` | Pass | Assignments are historical records and are not physically deleted. Direct API lifecycle/timestamp/overlap/final-state cases plus complete UI business and wrong-car flows. |
| `ASSIGN-007` | Pass | A new assignment may be created as Planned or may start directly as Active when the vehicle is handed … Direct API lifecycle/timestamp/overlap/final-state cases plus complete UI business and wrong-car flows. |
| `ASSIGN-008` | Pass | An assignment ends when the vehicle is returned to the office, and renting the same vehicle again — ev… Direct API lifecycle/timestamp/overlap/final-state cases plus complete UI business and wrong-car flows. |
| `ASSIGN-009` | Pass | A vehicle with no active assignment is unassigned and is considered to be resting / in the company's o… Direct API lifecycle/timestamp/overlap/final-state cases plus complete UI business and wrong-car flows. |
| `ASSIGN-010` | Pass | PlannedStartAtUtc and PlannedEndAtUtc store the current expected dates when they are known and may be … Direct API lifecycle/timestamp/overlap/final-state cases plus complete UI business and wrong-car flows. |
| `ASSIGN-011` | Pass | One vehicle may have several non-final planned assignments only when their planned ranges do not overl… Direct API lifecycle/timestamp/overlap/final-state cases plus complete UI business and wrong-car flows. |
| `ASSIGN-012` | Pass | Creating an assignment directly as Active or moving a Planned assignment to Active requires an eligibl… Direct API lifecycle/timestamp/overlap/final-state cases plus complete UI business and wrong-car flows. |
| `ASSIGN-013` | Pass | An assignment activated by mistake may move from Active to Cancelled only when no physical handover oc… Direct API lifecycle/timestamp/overlap/final-state cases plus complete UI business and wrong-car flows. |
| `ASSIGN-014` | Pass | A cancellation records its explanation in the assignment's own CancellationNote and never alters the a… Direct API lifecycle/timestamp/overlap/final-state cases plus complete UI business and wrong-car flows. |
| `ASSIGN-015` | Pass | Every cancellation of an assignment, Planned or Active, records one security audit event of type Renta… Direct API lifecycle/timestamp/overlap/final-state cases plus complete UI business and wrong-car flows. |
| `AUTH-001` | Pass | An assignment Driver authorization is an explicit historical record whose authorization type is either… Direct API coverage/exclusivity/replacement/stop cases plus UI atomic driver replacement. |
| `AUTH-002` | Pass | A NamedDriver authorization requires one active Driver. A BusinessCustomerDrivers authorization has no… Direct API coverage/exclusivity/replacement/stop cases plus UI atomic driver replacement. |
| `AUTH-003` | Pass | Open NamedDriver authorizations and an open BusinessCustomerDrivers authorization are mutually exclusi… Direct API coverage/exclusivity/replacement/stop cases plus UI atomic driver replacement. |
| `AUTH-004` | Pass | Starting an authorization records AuthorizedFromUtc. Stopping it records StoppedAtUtc and a StopReason… Direct API coverage/exclusivity/replacement/stop cases plus UI atomic driver replacement. |
| `AUTH-005` | Pass | Authorization records are never physically deleted or reopened. Reauthorizing the same Driver or the s… Direct API coverage/exclusivity/replacement/stop cases plus UI atomic driver replacement. |
| `AUTH-006` | Pass | The same Driver may have open named authorizations on several active assignments simultaneously, but m… Direct API coverage/exclusivity/replacement/stop cases plus UI atomic driver replacement. |
| `AUTH-007` | Pass | A standalone stop on an active assignment may not remove its final authorization coverage. Another nam… Direct API coverage/exclusivity/replacement/stop cases plus UI atomic driver replacement. |
| `AUTH-008` | Pass | Stopping an authorization never silently changes the assignment. Temporary non-use, vacation, or sickn… Direct API coverage/exclusivity/replacement/stop cases plus UI atomic driver replacement. |
| `AUTH-009` | Pass | BusinessCustomerDrivers is forbidden for a Private Customer. If the Private Customer personally replac… Direct API coverage/exclusivity/replacement/stop cases plus UI atomic driver replacement. |
| `AUTH-010` | Pass | The allowed authorization stop reasons are CustomerRequest, DriverNoLongerEligible, Replaced, Assignme… Direct API coverage/exclusivity/replacement/stop cases plus UI atomic driver replacement. |
| `INTERRUPT-001` | Pass | An interruption belongs to exactly one assignment. Direct API reason/impact/timeline/overlap/closure cases plus two-overlap UI flow. |
| `INTERRUPT-002` | Pass | An interruption may be open-ended (no end time). Direct API reason/impact/timeline/overlap/closure cases plus two-overlap UI flow. |
| `INTERRUPT-003` | Pass | When an interruption has an end time, it must be later than its start time. Direct API reason/impact/timeline/overlap/closure cases plus two-overlap UI flow. |
| `INTERRUPT-004` | Pass | Every interruption has a reason from the defined set of interruption reasons. Direct API reason/impact/timeline/overlap/closure cases plus two-overlap UI flow. |
| `INTERRUPT-005` | Pass | Every interruption has a billing impact from the defined set (fully billable, not billable, 50%, 25%, … Direct API reason/impact/timeline/overlap/closure cases plus two-overlap UI flow. |
| `INTERRUPT-006` | Pass | Every interruption must have a note. Direct API reason/impact/timeline/overlap/closure cases plus two-overlap UI flow. |
| `INTERRUPT-007` | Pass | Two interruptions on the same assignment may overlap in time. (Owner-confirmed; billing is not impleme… Direct API reason/impact/timeline/overlap/closure cases plus two-overlap UI flow. |
| `INTERRUPT-008` | N/A | Interruption discounts are never stacked. For an overlapping period containing only automatic percenta… Billing calculation is explicitly not implemented; overlapping records and impacts were still persisted/read. |
| `INTERRUPT-009` | Pass | An interruption is a manually recorded assignment-level billing-impact period. It never belongs to an … Direct API reason/impact/timeline/overlap/closure cases plus two-overlap UI flow. |
| `INTERRUPT-010` | Pass | Driver circumstances may justify an assignment interruption when the agreed billing treatment is affec… Direct API reason/impact/timeline/overlap/closure cases plus two-overlap UI flow. |
| `INTERRUPT-011` | Pass | An assignment cannot be Ended while any interruption remains open. Every open interruption must be rev… Direct API reason/impact/timeline/overlap/closure cases plus two-overlap UI flow. |
| `INTERRUPT-012` | Pass | An interruption may be entered or corrected retroactively when it does not begin before the assignment… Direct API reason/impact/timeline/overlap/closure cases plus two-overlap UI flow. |
| `INTERRUPT-013` | Pass | When InterruptionReason is Other, the required Note must explain the specific reason that is not repre… Direct API reason/impact/timeline/overlap/closure cases plus two-overlap UI flow. |
| `USER-001` | Pass | A human Application User may have several role-assignment records. Effective permissions are the union… Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-002` | Pass | A human Application User requires an email that is normalized and unique across all Application Users … Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-003` | Pass | The fixed technical system actor is not a human System Administrator. It has no Identity account, pass… Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-004` | Pass | A human Application User begins in PendingActivation. It may become Active, RegistrationRejected, or e… Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-005` | Pass | Every auditable business record records the real human creator and latest updater after authentication… Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-006` | Pass | A human Domain Application User and their ASP.NET Core Identity credential account use the same Guid b… Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-007` | Pass | A human Application User requires independently trimmed first and last names of at most 100 characters… Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-008` | Pass | A Company-scoped human Application User requires CompanyId. The dedicated human System Administrator a… Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-009` | Pass | A pending, rejected, or expired user cannot hold an active session or exercise a role. A pending user … Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-010` | Pass | An Active user may authenticate, and their business permissions are the union of all unrevoked and une… Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-011` | Pass | A Suspended user cannot authenticate or continue an existing session, and all of their role assignment… Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-012` | Pass | Restoring a Suspended user makes only their existing unrevoked and unexpired role assignments effectiv… Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-013` | Pass | A human Application User may be Active while having no effective business role. Such a user may use on… Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-014` | Pass | IsSystemAccount is true only for the fixed technical actor and is not a human role or permission. Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-015` | Pass | An Active user may change their own required phone number but may not change their own first or last n… Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-016` | Pass | Company Principal may correct the first and last name of an ordinary user in its Company, and System A… Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-017` | Pass | No ordinary endpoint physically deletes a human Application User because its identifier may be referen… Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-018` | Pass | SecurityVersion starts at 1 and advances atomically whenever a credential, login email, lifecycle stat… Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-019` | Pass | Changing a phone number, first or last name, or ordinary business data does not advance SecurityVersion. Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-020` | Pass | Registration assigns no Company. Ordinary activation resolves the singleton Company and fixes CompanyI… Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `USER-021` | Pass | The user directory may be filtered by several effective statuses at once (Statuses, a comma-separated … Security API lifecycle/directory/name/session cases plus role-specific app screens. |
| `CUSTOMER-001` | Pass | A customer is the party responsible for rentals and may be either a private individual or a business. Direct API identity/type/unique/lifecycle cases plus UI business customer workflow. |
| `CUSTOMER-002` | Pass | A customer may hold many assignments. Direct API identity/type/unique/lifecycle cases plus UI business customer workflow. |
| `CUSTOMER-003` | Pass | Each assignment belongs to exactly one customer and concerns exactly one vehicle. A planned assignment… Direct API identity/type/unique/lifecycle cases plus UI business customer workflow. |
| `CUSTOMER-004` | Pass | A driver and a customer are separate concepts even though the same person may be both — a driver is an… Direct API identity/type/unique/lifecycle cases plus UI business customer workflow. |
| `CUSTOMER-005` | Pass | Authorizing multiple named Drivers to use a vehicle does not create separate assignments; all named au… Direct API identity/type/unique/lifecycle cases plus UI business customer workflow. |
| `CUSTOMER-006` | Pass | Collective BusinessCustomerDrivers coverage is available only to a Business Customer and never to a Pr… Direct API identity/type/unique/lifecycle cases plus UI business customer workflow. |
| `CUSTOMER-007` | Pass | Customer responsibility does not itself grant driving permission. When a Private Customer personally d… Direct API identity/type/unique/lifecycle cases plus UI business customer workflow. |
| `CUSTOMER-008` | Pass | A Customer's type is either PrivateIndividual or Business and does not change after creation. Direct API identity/type/unique/lifecycle cases plus UI business customer workflow. |
| `CUSTOMER-009` | Pass | Every Customer requires an address, email, and phone number. Address stores the private contact addres… Direct API identity/type/unique/lifecycle cases plus UI business customer workflow. |
| `CUSTOMER-010` | Pass | A PrivateIndividual Customer requires first name, last name, and at least one of personal ID or date o… Direct API identity/type/unique/lifecycle cases plus UI business customer workflow. |
| `CUSTOMER-011` | Pass | A Business Customer requires company name and registration code. Private first name, last name, person… Direct API identity/type/unique/lifecycle cases plus UI business customer workflow. |
| `CUSTOMER-012` | Pass | To use a Private Customer as a Driver, a separate Driver record must be created with the same applicab… Direct API identity/type/unique/lifecycle cases plus UI business customer workflow. |
| `CUSTOMER-013` | Pass | Customers are active when created and are deactivated rather than physically deleted. An inactive Cust… Direct API identity/type/unique/lifecycle cases plus UI business customer workflow. |
| `CUSTOMER-014` | Pass | A Customer cannot be deactivated while responsible for a Planned or Active Assignment. Every such Assi… Direct API identity/type/unique/lifecycle cases plus UI business customer workflow. |
| `CUSTOMER-015` | Pass | A Private Customer's DriverId link cannot be changed or cleared while the linked Driver has an open na… Direct API identity/type/unique/lifecycle cases plus UI business customer workflow. |
| `CUSTOMER-016` | Pass | Customer email and phone number are each unique across Customers after normalization. Uniqueness is en… Direct API identity/type/unique/lifecycle cases plus UI business customer workflow. |
| `COMPANY-001` | Pass | Company represents the operating company using RWRent and is a different concept from a Business Custo… Valid UI update and shell refresh; invalid update, duplicate create, referenced delete and role policy direct calls. |
| `COMPANY-002` | Pass | V5 supports exactly one operating Company. Driver, Customer, Vehicle, Rental Assignment, Driver Author… Valid UI update and shell refresh; invalid update, duplicate create, referenced delete and role policy direct calls. |
| `COMPANY-003` | Pass | A Company requires a name, registration number, legal address, and email. VAT number and phone number … Valid UI update and shell refresh; invalid update, duplicate create, referenced delete and role policy direct calls. |
| `COMPANY-004` | Pass | Registration number and a supplied VAT number are normalized before persistence and must each be uniqu… Valid UI update and shell refresh; invalid update, duplicate create, referenced delete and role policy direct calls. |
| `COMPANY-005` | Pass | Only the human System Administrator may create the operating Company, and creation fails when a Compan… Valid UI update and shell refresh; invalid update, duplicate create, referenced delete and role policy direct calls. |
| `COMPANY-006` | Pass | System Administrator, Company Principal, and Fleet Manager may read and update the Company. Viewer may… Valid UI update and shell refresh; invalid update, duplicate create, referenced delete and role policy direct calls. |
| `COMPANY-007` | Pass | Changes to Company identity fields, including name, registration number, and VAT number, record meanin… Valid UI update and shell refresh; invalid update, duplicate create, referenced delete and role policy direct calls. |
| `COMPANY-008` | Pass | Company activation and deactivation do not exist in V5. Valid UI update and shell refresh; invalid update, duplicate create, referenced delete and role policy direct calls. |
| `COMPANY-009` | Pass | Only the human System Administrator may delete a mistakenly created Company, and only while it has no … Valid UI update and shell refresh; invalid update, duplicate create, referenced delete and role policy direct calls. |
| `COMPANY-010` | Pass | A Company may be deleted only when no record references it. Company deletion never automatically delet… Valid UI update and shell refresh; invalid update, duplicate create, referenced delete and role policy direct calls. |
| `COMPANY-011` | Not tested | Company setup is incomplete until an authorized activation grants its first non-expiring Company Princ… The seeded database already had a Company and protected Principal; empty-install setup was not destructively recreated. |
| `ROLE-001` | Pass | The code-owned roles are System Administrator, Fleet Manager, Company Principal, and Viewer. CompanyPr… Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `ROLE-002` | Pass | A human user may have several role-assignment records. Effective permissions are the union of all assi… Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `ROLE-003` | Pass | Role types and permission bundles are defined in code. There is no database/UI role designer and no di… Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `ROLE-004` | Pass | Enum numeric values never imply a privilege hierarchy. Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `ROLE-005` | Pass | Role assignments are historical records and are never physically deleted or reopened. Regranting a rev… Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `ROLE-006` | Pass | A user cannot have two simultaneously effective assignments for the same role. A temporary assignment … Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `ROLE-007` | Pass | Revoking a role requires a meaningful reason and records actor and UTC time. Editing an assignment exp… Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `ROLE-008` | Pass | Viewer may read all non-secret Company and business information and the basic user directory for its C… Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `ROLE-009` | Pass | Fleet Manager has Viewer access plus every ordinary Driver, Customer, Vehicle, Rental Assignment, Driv… Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `ROLE-010` | Pass | Company Principal has every Fleet Manager capability and may additionally activate Company users as Vi… Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `ROLE-011` | Fail — T-001 | Company Principal may never grant, revoke, transfer, or otherwise administer System Administrator. API denied all non-administrators, but the direct app route exposed the administrator identity/action UI. |
| `ROLE-012` | Pass | System Administrator may perform every supported operation and privileged correction, but never bypass… Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `ROLE-013` | Pass | System Administrator assignment is not available through ordinary activation or role-management endpoi… Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `ROLE-014` | Pass | After Company setup, the Company must always have at least one Active, non-expiring Company Principal. Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `ROLE-015` | Not tested | During initial setup, the Company may temporarily have no Principal; it remains under System Administr… Requires an empty first-run Company state; the seeded operational Company was preserved. |
| `ROLE-016` | Pass | A temporary Company Principal cannot be the Company's only Principal. Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `ROLE-017` | Pass | The final protected Principal cannot be revoked, given an expiry, suspended, or left as the only tempo… Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `ROLE-018` | Pass | A Company Principal cannot revoke, expire, or otherwise modify their own Company Principal assignment,… Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `ROLE-019` | Pass | Only the human System Administrator may grant, revoke, set or change the expiry of, replace, or make i… Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `ROLE-020` | Pass | Natural role expiry takes effect at its recorded instant without requiring a background write. Authori… Full API role matrix, grant/revoke/expiry/protection cases, and a real two-minute Viewer expiry in the app. |
| `REGISTRATION-001` | Pass | Public self-registration creates same-id Domain and Identity records with first name, last name, requi… Public API and Mailpit flow, lifecycle outcomes, activation/rejection/reopen constraints, and app confirmation. |
| `REGISTRATION-002` | Pass | Well-shaped registration and resend requests return the same empty 202 Accepted result for new and kno… Public API and Mailpit flow, lifecycle outcomes, activation/rejection/reopen constraints, and app confirmation. |
| `REGISTRATION-003` | Pass | A known email never overwrites profile or credential data. Correct existing-password proof may rotate … Public API and Mailpit flow, lifecycle outcomes, activation/rejection/reopen constraints, and app confirmation. |
| `REGISTRATION-004` | Fail — T-005 | Confirmation accepts only the current unconsumed, unsuperseded, unexpired token hash. The API refused fresh-tab reuse, but same-tab reuse made no request and falsely retained the success result. |
| `REGISTRATION-005` | Pass | An unconfirmed registration becomes effectively RegistrationExpired when its seven-day window elapses,… Public API and Mailpit flow, lifecycle outcomes, activation/rejection/reopen constraints, and app confirmation. |
| `REGISTRATION-006` | Not tested | Confirmation-message failure never rolls back, activates, deletes, or changes the committed account. E… Mailpit delivery succeeded; SMTP delivery failure was not induced. |
| `REGISTRATION-007` | Pass | Fleet Manager, Company Principal, and System Administrator may review and manage pending/rejected/expi… Public API and Mailpit flow, lifecycle outcomes, activation/rejection/reopen constraints, and app confirmation. |
| `REGISTRATION-008` | Pass | Ordinary activation requires confirmed effective PendingActivation, no administrator-transfer reservat… Public API and Mailpit flow, lifecycle outcomes, activation/rejection/reopen constraints, and app confirmation. |
| `REGISTRATION-009` | Pass | Activation atomically assigns Company and roles, changes status to Active, advances security state, an… Public API and Mailpit flow, lifecycle outcomes, activation/rejection/reopen constraints, and app confirmation. |
| `REGISTRATION-010` | Pass | Rejection requires an internal reason, preserves no Company or roles, supersedes current confirmation,… Public API and Mailpit flow, lifecycle outcomes, activation/rejection/reopen constraints, and app confirmation. |
| `REGISTRATION-011` | Pass | Reopening targets only RegistrationRejected, preserves history, and returns to PendingActivation. Conf… Public API and Mailpit flow, lifecycle outcomes, activation/rejection/reopen constraints, and app confirmation. |
| `REGISTRATION-012` | Pass | Registration, confirmation, rejection, reopening, and activation tokens/data are purpose-specific; raw… Public API and Mailpit flow, lifecycle outcomes, activation/rejection/reopen constraints, and app confirmation. |
| `REGISTRATION-013` | Partial | Bounded trusted cleanup may materialize untouched elapsed registrations, but API correctness never dep… Derived expired state and one-time audit behavior passed; background cleanup was not invoked. |
| `SYSTEM-001` | Pass | The existing fixed-id seeded row remains as RWRent System Actor so historical foreign keys remain valid. Transfer stage 1/2, invalid targets/passwords/tokens, sessions/audit, then replacement seed. |
| `SYSTEM-002` | Pass | The technical actor has no Identity account, password, session, Company, or role assignment and cannot… Transfer stage 1/2, invalid targets/passwords/tokens, sessions/audit, then replacement seed. |
| `SYSTEM-003` | Pass | The technical actor is excluded from ordinary user-management results and cannot be modified through h… Transfer stage 1/2, invalid targets/passwords/tokens, sessions/audit, then replacement seed. |
| `SYSTEM-004` | Pass | The technical actor may attribute only an explicitly declared trusted system operation, such as initia… Transfer stage 1/2, invalid targets/passwords/tokens, sessions/audit, then replacement seed. |
| `SYSTEM-005` | Pass | The human System Administrator is a separate self-registered dedicated credential account. The owner u… Transfer stage 1/2, invalid targets/passwords/tokens, sessions/audit, then replacement seed. |
| `SYSTEM-006` | Pass | After bootstrap, exactly one Active human holds the non-expiring System Administrator assignment. Transfer stage 1/2, invalid targets/passwords/tokens, sessions/audit, then replacement seed. |
| `SYSTEM-007` | Not tested | The first human System Administrator is activated only through the one-time deployment command after o… One-time deployment bootstrap was already complete and has no safe repeat path. |
| `SYSTEM-008` | Not tested | Bootstrap accepts runtime email only, requires the exact confirmed dedicated pending registration with… Bootstrap refusal was not rerun against deployment state; ordinary endpoints and transfer protections were tested. |
| `SYSTEM-009` | Pass | Ordinary user, registration, suspension, and role endpoints cannot revoke, expire, suspend, replace, o… Transfer stage 1/2, invalid targets/passwords/tokens, sessions/audit, then replacement seed. |
| `SYSTEM-010` | Fail — T-001 | Only the current human System Administrator may initiate administrator transfer. The API enforced this, but the app offered the administrator identity and initiation UI to all three ordinary roles. |
| `SYSTEM-011` | Pass | Administrator transfer targets an existing confirmed dedicated pending no-Company registration rather … Transfer stage 1/2, invalid targets/passwords/tokens, sessions/audit, then replacement seed. |
| `SYSTEM-012` | Pass | The current administrator remains fully responsible while transfer acceptance is pending. Expiry or ca… Transfer stage 1/2, invalid targets/passwords/tokens, sessions/audit, then replacement seed. |
| `SYSTEM-013` | Pass | Successful transfer atomically activates the new dedicated account, revokes the old System Administrat… Transfer stage 1/2, invalid targets/passwords/tokens, sessions/audit, then replacement seed. |
| `SYSTEM-014` | Not tested | Offline administrator recovery is an operator/deployment action, not a public bypass endpoint. It may … Offline recovery is an operator/deployment action with no public endpoint. |
| `SYSTEM-015` | N/A | MFA and MFA-based step-up are outside V6; their absence is an accepted limitation. MFA absence is an accepted limitation. |
| `SYSTEM-016` | Pass | Transfer resend requires current-administrator permission and password proof, rotates the same unused … Transfer stage 1/2, invalid targets/passwords/tokens, sessions/audit, then replacement seed. |
| `SYSTEM-017` | Pass | An administrator transfer's status is derived at read time and never stored: Accepted when it was acce… Transfer stage 1/2, invalid targets/passwords/tokens, sessions/audit, then replacement seed. |
| `LOGIN-001` | Pass | Human credentials are managed by ASP.NET Core Identity. RWRent does not implement custom password hash… Known/unknown parity, lifecycle outcomes, lockout and exact rate limits; app 429 outcome. |
| `LOGIN-002` | Pass | The browser frontend authenticates with a protected server cookie. V6 issues no JWT access token, refr… Known/unknown parity, lifecycle outcomes, lockout and exact rate limits; app 429 outcome. |
| `LOGIN-003` | Pass | Login verifies password and lockout before account-specific lifecycle handling. Only a confirmed, stru… Known/unknown parity, lifecycle outcomes, lockout and exact rate limits; app 429 outcome. |
| `LOGIN-004` | Pass | Registration, authentication, reset, and recovery responses do not disclose whether an email exists be… Known/unknown parity, lifecycle outcomes, lockout and exact rate limits; app 429 outcome. |
| `LOGIN-005` | Pass | Five consecutive failed password attempts lock the human account for 15 minutes. A successful login re… Known/unknown parity, lifecycle outcomes, lockout and exact rate limits; app 429 outcome. |
| `LOGIN-006` | Pass | Account lockout applies to every human account, including System Administrator. Endpoint rate limiting… Known/unknown parity, lifecycle outcomes, lockout and exact rate limits; app 429 outcome. |
| `LOGIN-007` | Pass | V6 uses exactly one persistent authentication cookie and no JWT or refresh token. A separate HttpOnly … Known/unknown parity, lifecycle outcomes, lockout and exact rate limits; app 429 outcome. |
| `LOGIN-008` | Pass | Correct password proof returns stable coded 403 outcomes for unconfirmed, confirmed-pending, rejected,… Known/unknown parity, lifecycle outcomes, lockout and exact rate limits; app 429 outcome. |
| `PASSWORD-001` | Pass | A password contains at least 12 characters and at least one uppercase letter, one number, and one non-… Policy boundaries, blocklist/history/reset/reuse and app reset flow. |
| `PASSWORD-002` | Pass | Spaces and passphrases are allowed, but whitespace does not satisfy the symbol requirement. No separat… Policy boundaries, blocklist/history/reset/reuse and app reset flow. |
| `PASSWORD-003` | Pass | The system accepts otherwise valid passwords of at least 64 characters. Any defensive request-size cei… Policy boundaries, blocklist/history/reset/reuse and app reset flow. |
| `PASSWORD-004` | Pass | A maintained common/compromised-password blocklist rejects known weak passwords without logging, persi… Policy boundaries, blocklist/history/reset/reuse and app reset flow. |
| `PASSWORD-005` | Pass | Passwords do not expire periodically. Policy boundaries, blocklist/history/reset/reuse and app reset flow. |
| `PASSWORD-006` | Pass | A new password cannot match any of the five most recently used passwords, including the current passwo… Policy boundaries, blocklist/history/reset/reuse and app reset flow. |
| `PASSWORD-007` | Pass | Password-history enforcement applies to authenticated password changes and password resets. The initia… Policy boundaries, blocklist/history/reset/reuse and app reset flow. |
| `PASSWORD-008` | Fail — T-005 | A reset token becomes unusable after success. The API refused fresh-tab reuse, but same-tab reuse made no request and falsely retained success; configured one-hour expiry was inspected but not elapsed. |
| `PASSWORD-009` | Pass | Successful password reset advances Identity security state and SecurityVersion, revokes every existing… Policy boundaries, blocklist/history/reset/reuse and app reset flow. |
| `PROFILE-001` | Pass | Changing login email begins from an authenticated session and requires current-password confirmation p… Phone/email/password API flows and app profile/dialog readbacks. |
| `PROFILE-002` | Partial | A pending email-change link expires one hour after generation; completing it updates the Domain and Id… Replacement and single use passed; the one-hour expiry was inspected but not waited. |
| `PROFILE-003` | Pass | Successful self-service password or email change revokes other sessions and may retain only the initia… Phone/email/password API flows and app profile/dialog readbacks. |
| `SESSION-001` | Pass | Every successful login creates one server-tracked session and one protected cookie containing at least… Cookie flags, own/admin scope, revoke/logout/security-version behavior and app mid-form revocation. |
| `SESSION-002` | Pass | The authentication cookie is HttpOnly, Secure in production, host-only to the API, scoped to /, and pe… Cookie flags, own/admin scope, revoke/logout/security-version behavior and app mid-form revocation. |
| `SESSION-003` | Partial | A session expires after two hours without a genuine authenticated API interaction. Stored idle deadlines were exactly 2 h; live expiry was substituted with administrator revocation. |
| `SESSION-004` | Partial | Genuine authenticated activity may move the inactivity deadline, but a heartbeat whose only purpose is… Authenticated requests moved last-seen/idle deadlines; no heartbeat client exists to observe over two hours. |
| `SESSION-005` | Partial | Every session has an absolute lifetime of 12 hours from its original login. Cookie renewal and continu… Stored absolute deadlines were exactly 12 h; the full window was not elapsed. |
| `SESSION-006` | Partial | All tabs in one browser profile share the same cookie and session. Closing all RWRent tabs does not lo… Two tabs shared a session; tab-close/reopen persistence was not elapsed in a persistent-profile browser. |
| `SESSION-007` | Not tested | Closing the whole browser does not log the user out. Reopening the same browser profile normally resum… Whole-browser persistent-profile restart needs a 12-hour-capable manual run. |
| `SESSION-008` | Pass | Every authenticated request rejects a missing, revoked, idle-expired, absolute-expired, suspended, tec… Cookie flags, own/admin scope, revoke/logout/security-version behavior and app mid-form revocation. |
| `SESSION-009` | Pass | Logout is idempotent, best-effort revokes the identifiable current server session, expires both authen… Cookie flags, own/admin scope, revoke/logout/security-version behavior and app mid-form revocation. |
| `SESSION-010` | Pass | A user may list their own sessions, revoke one of them, or revoke every other session while retaining … Cookie flags, own/admin scope, revoke/logout/security-version behavior and app mid-form revocation. |
| `SESSION-011` | Pass | Revoking selected sessions does not increment SecurityVersion; this permits retaining the current sess… Cookie flags, own/admin scope, revoke/logout/security-version behavior and app mid-form revocation. |
| `SESSION-012` | Pass | Company Principal may revoke sessions of an ordinary user in its own Company who does not hold Company… Cookie flags, own/admin scope, revoke/logout/security-version behavior and app mid-form revocation. |
| `SESSION-013` | Pass | Password reset, suspension, administrator transfer, and security-sensitive role changes revoke all aff… Cookie flags, own/admin scope, revoke/logout/security-version behavior and app mid-form revocation. |
| `SESSION-014` | Pass | Session device/browser metadata is for user recognition only and is never accepted as proof of identity. Cookie flags, own/admin scope, revoke/logout/security-version behavior and app mid-form revocation. |
| `SESSION-015` | Partial | Expired and revoked session rows are retained for 90 days for security review and are then eligible fo… Expired/revoked rows and the retention rule were inspected; 90-day cleanup was not elapsed. |
| `AUDIT-001` | Pass | Authenticated HTTP business operations use the real human actor's identifier for creation and update a… Actor/scope/filter/payload/secret scan and app list/detail labels. |
| `AUDIT-002` | Pass | An unauthenticated HTTP request never becomes the technical actor. A business write without an authent… Actor/scope/filter/payload/secret scan and app list/detail labels. |
| `AUDIT-003` | Pass | Registration, role, lifecycle-status, forced-logout, administrator-transfer, Company-identity, email-s… Actor/scope/filter/payload/secret scan and app list/detail labels. |
| `AUDIT-004` | Pass | Role revocation and every privileged correction require a meaningful reason. Actor/scope/filter/payload/secret scan and app list/detail labels. |
| `AUDIT-005` | Pass | Security and correction history is append-only through the API. Ordinary update audit fields do not re… Actor/scope/filter/payload/secret scan and app list/detail labels. |
| `AUDIT-006` | Pass | Audit before/after data includes only meaningful changed values and excludes passwords, cookies, token… Actor/scope/filter/payload/secret scan and app list/detail labels. |
| `AUDIT-007` | Pass | After successful token validation, administrator-transfer acceptance, registration/email confirmation,… Actor/scope/filter/payload/secret scan and app list/detail labels. |
| `AUDIT-008` | Pass | Security audit history may be read by entry within the reader's audit scope (a Company-scoped reader s… Actor/scope/filter/payload/secret scan and app list/detail labels. |
| `CORRECTION-001` | Pass | Ordinary operations continue to enforce each entity's normal lifecycle. Privileged correction exists o… Admin-only typed corrections, invalid FK/state, stale token, Company/PascalCase audit and app history. |
| `CORRECTION-002` | Pass | Only System Administrator may execute a privileged correction. Admin-only typed corrections, invalid FK/state, stale token, Company/PascalCase audit and app history. |
| `CORRECTION-003` | Pass | Every correction loads the target, enforces optimistic concurrency, revalidates foreign keys and all a… Admin-only typed corrections, invalid FK/state, stale token, Company/PascalCase audit and app history. |
| `CORRECTION-004` | Pass | System Administrator permission never permits an invalid state, a foreign-key bypass, a concurrency by… Admin-only typed corrections, invalid FK/state, stale token, Company/PascalCase audit and app history. |
| `CORRECTION-005` | Pass | V5 exposes no generic correction endpoint that accepts an entity name and arbitrary fields. Admin-only typed corrections, invalid FK/state, stale token, Company/PascalCase audit and app history. |
| `CORRECTION-006` | Pass | A typed Rental Assignment correction may repair an incorrect Customer, Vehicle, planned/actual timesta… Admin-only typed corrections, invalid FK/state, stale token, Company/PascalCase audit and app history. |
| `CORRECTION-007` | Pass | A typed Driver Authorization correction may repair authorization type/Driver, authorization period, st… Admin-only typed corrections, invalid FK/state, stale token, Company/PascalCase audit and app history. |
| `CORRECTION-008` | Pass | A typed Interruption correction may repair its period, reason, billing impact, or note only within the… Admin-only typed corrections, invalid FK/state, stale token, Company/PascalCase audit and app history. |
| `CORRECTION-009` | Pass | Driver, Customer, and Vehicle continue to use their existing rule-aware update and activate/deactivate… Admin-only typed corrections, invalid FK/state, stale token, Company/PascalCase audit and app history. |
| `CORRECTION-010` | Pass | Rental Assignments, Driver Authorizations, Interruptions, users, role assignments, and correction audi… Admin-only typed corrections, invalid FK/state, stale token, Company/PascalCase audit and app history. |
| `EMAIL-001` | Pass | Registration confirmation, activation, rejection, administrator-transfer, email-change, and password-r… Mailpit delivery and emailed registration/reset/transfer links. |
| `EMAIL-002` | Pass | Local development uses Mailpit and does not deliver authentication messages to real recipients. Mailpit delivery and emailed registration/reset/transfer links. |
| `EMAIL-003` | N/A | Production uses a specialized transactional-email provider, but the final vendor and API-versus-SMTP c… Production provider choice is explicitly deferred. |
| `EMAIL-004` | Not tested | Production cannot go live until sender-domain verification, SPF, DKIM, DMARC, bounce handling, sender … Production DNS, bounce handling, sender verification and secret storage need a production email environment. |

### 3.2 Endpoint and role matrix

All 82 operations from the live OpenAPI document are below. For write probes, `400`/`404`/`409` means the role passed authorization and reached validation or state handling; `403` means the role was refused. Public endpoints were also called while each role was signed in. Every protected anonymous call returned `401`.

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

### 3.3 Route, role, width and theme matrix

All 20 signed-in routes were rendered for all four roles at 1512, 834 and 402 px in both themes (480 combinations), plus all seven public routes at all width/theme combinations (42). No document-level horizontal overflow, wrong applied theme, page exception or HTTP 500 occurred. The 402 px tab strip is deliberately scrollable. T-001 was reproduced at every size; restricted Security Audit deep links correctly rendered “Not available to you”. Interaction passes additionally covered public links, a complete business-rental lifecycle, mistaken-activation cancellation in desktop/dark and phone/light, session expiry, access pending after the one-minute cache, two-browser stale state and API-unreachable presentation.

Each `6/6` cell is 1512/light, 1512/dark, 834/light, 834/dark, 402/light and 402/dark. “Pass” includes the role-appropriate restricted state; it does not mean the role was granted access.

| Signed-in route | System Administrator | Company Principal | Fleet Manager | Viewer |
|---|---|---|---|---|
| `/overview` | 6/6 Pass | 6/6 Pass | 6/6 Pass | 6/6 Pass |
| `/needs-attention` | 6/6 Pass | 6/6 Pass | 6/6 Pass | 6/6 Pass |
| `/rental-assignments` | 6/6 Pass | 6/6 Pass | 6/6 Pass | 6/6 Pass |
| `/rental-assignments/{id}` | 6/6 Pass | 6/6 Pass | 6/6 Pass | 6/6 Pass |
| `/vehicles` | 6/6 Pass | 6/6 Pass | 6/6 Pass | 6/6 Pass |
| `/vehicles/{id}` | 6/6 Pass | 6/6 Pass | 6/6 Pass | 6/6 Pass |
| `/customers` | 6/6 Pass | 6/6 Pass | 6/6 Pass | 6/6 Pass |
| `/customers/{id}` | 6/6 Pass | 6/6 Pass | 6/6 Pass | 6/6 Pass |
| `/drivers` | 6/6 Pass | 6/6 Pass | 6/6 Pass | 6/6 Pass |
| `/drivers/{id}` | 6/6 Pass | 6/6 Pass | 6/6 Pass | 6/6 Pass |
| `/users` | 6/6 Pass | 6/6 Pass | 6/6 Pass | 6/6 Pass |
| `/users/{id}` | 6/6 Pass | 6/6 Pass | 6/6 Pass | 6/6 Pass |
| `/registrations` | 6/6 Pass | 6/6 Pass | 6/6 Pass | 6/6 Pass (restricted) |
| `/company` | 6/6 Pass | 6/6 Pass | 6/6 Pass | 6/6 Pass |
| `/system-administrator` | 6/6 Pass | 6/6 **Fail T-001** | 6/6 **Fail T-001** | 6/6 **Fail T-001** |
| `/security-audit` | 6/6 Pass | 6/6 Pass | 6/6 Pass (restricted) | 6/6 Pass (restricted) |
| `/security-audit/{id}` | 6/6 Pass | 6/6 Pass | 6/6 Pass (restricted) | 6/6 Pass (restricted) |
| `/profile` | 6/6 Pass | 6/6 Pass | 6/6 Pass | 6/6 Pass |
| `/profile?tab=security` | 6/6 Pass | 6/6 Pass | 6/6 Pass | 6/6 Pass |
| `/profile?tab=sessions` | 6/6 Pass | 6/6 Pass | 6/6 Pass | 6/6 Pass |

| Public route | 1512 | 834 | 402 |
|---|---|---|---|
| `/sign-in` | light/dark Pass | light/dark Pass | light/dark Pass |
| `/register` | light/dark Pass | light/dark Pass | light/dark Pass |
| `/confirm-registration-email` | light/dark Pass | light/dark Pass | light/dark Pass |
| `/confirm-registration-email?resend=1` | light/dark Pass | light/dark Pass | light/dark Pass |
| `/reset-password` | light/dark Pass | light/dark Pass | light/dark Pass |
| `/confirm-email-change` | light/dark Pass | light/dark Pass | light/dark Pass |
| `/accept-administrator-transfer` | light/dark Pass | light/dark Pass | light/dark Pass |

### 3.4 Scenario catalogue

| Scenario | Result | Evidence / note |
|---|---|---|
| 9.1-1 Sign-in variants and lifecycle outcomes | Pass | Valid, wrong, unknown, confirmed-pending, unconfirmed, rejected, expired, suspended, empty, whitespace and upper-case cases were checked on API and outcome screens. |
| 9.1-2 Lockout | Partial | Five-failure lockout, correct-password refusal and coded parity passed. The 15-minute release was not elapsed. |
| 9.1-3 Rate limits | Pass | Exact account limits: authentication 11th=`429`, registration 9th=`429`, recovery 6th=`429`, administrator security 6th=`429`; app showed **Too many attempts** and `HTTP 429`. |
| 9.1-4 Registration | **Fail T-005** | Validation, safe duplicate `202`, Mailpit, fragment stripping, first confirmation, fresh-tab reuse refusal and stored 24 h challenge passed; same-tab reuse is misleading. |
| 9.1-5 Forgotten password | **Fail T-005** | Known/unknown parity, Mailpit, weak password, success, history, fresh-tab reuse refusal and sign-in passed; same-tab reuse is misleading. |
| 9.1-6 Public routes while signed in | Pass | Public routes remain public and render their forms/outcomes while a session exists; they do not disclose session data. |
| 9.1-7 Outcome-screen actions | Partial | Main Back/Sign in again/Try again actions were followed. Every rare failure outcome was not regenerated solely to click its duplicate navigation action. |
| 9.2-1 Expiry/revoke/sign-out | Pass | Another browser revoked a session while its phone dialog was open: mutation `401`, **Session expired**, then successful return to `/vehicles`; logout/cookie/401 passed directly. |
| 9.2-2 Session lists and administration scope | Pass | Current marking, no self-revoke action, selected/all-other revocation, Principal/System Administrator scope and protected-person refusals passed. |
| 9.2-3 Password change | Partial | All policy/current/history/session rules passed directly; profile screens were rendered, but the successful change was completed through reset rather than the signed-in dialog. |
| 9.2-4 Email change | Partial | Replacement, old-token refusal, new-email sign-in and existing-address conflict passed directly; the full Mailpit click was not repeated in the browser. |
| 9.2-5 Phone and permissions | **Fail T-004** | Validation/readback and exact permission bundles passed; double Enter duplicates the request. |
| 9.2-6 Access pending | Pass | Toms's final Viewer role was revoked, cache allowed to expire, then all three direct routes showed the same empty-navigation screen and API returned `403`. |
| 9.3-1 Full role/protection matrix | **Fail T-001** | 82 operations × roles + anonymous and every route × role were checked. The API is correct; the hidden System Administrator route is not. |
| 9.3-2 Grant/change/revoke/expiry | Pass | Past/duplicate/protected/self cases passed. A Viewer grant expiring exactly two minutes ahead was observed as API `200` before and Access pending/API `403` after. |
| 9.3-3 Suspend/restore | Pass | Ordinary lifecycle and stale-session behavior passed; protected Principal, administrator and self constraints were refused. |
| 9.3-4 Name correction and registration review | Partial | API cases and audits passed for roles/none/reject/reopen/expired/active; list/record/dialog surfaces rendered, but every permutation was not clicked again in the UI. |
| 9.4-1 Administrator transfer | Pass | Initiate/resend/cancel/re-initiate/accept, invalid targets/passwords/token/reuse, sessions, roles and audits passed; replacement seed followed. |
| 9.4-2 Offline recovery transfer | N/A | `is_recovery` semantics are an offline operator/deployment path, not a running public endpoint. |
| 9.5-1 Company singleton | Pass | Valid UI update refreshed shell name; bad fields, correct roles, valid duplicate create `409`, and referenced delete `409` with app refusal passed. |
| 9.6-1 Vehicle validation/normalization | **Fail T-003** | Plate, duplicate, year, enum, colour and unspaced VIN cases passed; spaced 17-character VIN fails before trim. |
| 9.6-2 Vehicle lifecycle against assignments | Pass | Planned/Active retirement refusals, post-final retirement and planning/activation against retired vehicles passed. |
| 9.6-3 Vehicle availability/list/filter/paging | Pass | All ten list, record and overview values agreed; available/in-use/reserved/retired and upcoming cases plus API filters/paging passed. |
| 9.7-1 Customer/driver rules | **Question T-006** | All defined requirements, uniqueness, future DOB, inactive use and search passed. Today and age 17 are accepted; owner decision requested. |
| 9.7-2 Driver record/history/audit | Pass | History endpoint, record rendering, links and authorization/audit relationship agreed. |
| 9.8-1 Assignment creation/overlap/eligibility | Pass | Missing/ordered times, active coverage, future/past handover, inactive parties, overlap, exact touch and open-ended cases passed. |
| 9.8-2 Activation | Pass | No coverage, competing active use, inactive customer, double/final-state and valid activation were checked. |
| 9.8-3 Coverage | Pass | Private/collective, mixed modes, duplicate, multi-assignment driver, last-stop, atomic replacement, time and Other-note cases passed. |
| 9.8-4 Interruptions | Pass | Every enum was contract-checked; required note/times/bounds/overlap/open-closure behavior passed, including two overlapping interruptions through the UI. |
| 9.8-5 End | Pass | Pre-handover/double/Planned refusals and valid end after closing interruptions passed. |
| 9.8-6 Cancel | Pass | Planned and mistaken-Active cases, confirmation, required field-level note, final-state refusal, separate stored note and one Company-scoped audit passed in desktop/dark and phone/light. |
| 9.8-7 Updates/corrections | Partial | Direct admin-only party/timeline/authorization/interruption corrections, invalid states/FK/stale token and audits passed; all correction dialogs rendered but not every mutation was repeated through UI. |
| 9.8-8 Lists and Needs attention | Partial | Server filters/combinations/search/paging and five seeded links/counts passed; not every filter combination was manually selected at all three widths. |
| 9.9-1 Security audit | Pass | Expected audited/non-audited actions, actor/entity/Company/reason/payload, no duplicates, filters/scope/detail pages and all present event labels passed. |
| 9.10-1 Business customer day | Pass | Entire flow ran in the app with API readback: customer, two drivers, plan, authorize/activate, atomic swap, overlapping accident/repair, blocked end, both closes, final end, vehicle Available. |
| 9.10-2 Private customer day | Partial | All coverage/link/replacement rules passed directly; the entire sequence was not repeated through the app. |
| 9.10-3 Wrong car | Pass | Ran in desktop/dark and 402/light; wrong-order `409`, missing-note `400` under the field, valid correction, stored reason, audit and Available vehicle agreed. |
| 9.10-4 Double booking | Partial | API overlap/exact-touch/open-ended/retire/replan sequence passed; only the stale-retire half was repeated in the app. |
| 9.10-5 Vacation cover / wrong order | Partial | State-order refusals were exhaustive at API level and sampled across dialogs; no 500/stuck dialog observed. |
| 9.10-6 New staff member | Partial | Browser register/confirm/pending and real two-minute Viewer expiry passed; promotion and suspension were API-only. |
| 9.10-7 Account under attack | Pass | Lockout/rate limit/reset reuse/old antiforgery/session-revoked-mid-form passed; the app showed the coded outcomes. |
| 9.10-8 Platform handover | Partial | Full transfer passed against API and Mailpit semantics; initiation dialog was checked in app, but the accept sequence was not executed through the app before the mandated re-seed. |
| 9.10-9 Two people at once | Partial | Two browsers handled final-state assignment `409`, vehicle-retired-before-submit `409`, and role/session revocation clearly. The first race cancelled rather than ended the record. |
| 9.10-10 Phone day | Partial | Wrong-car script ran fully at 402/light. The longer business-customer script ran desktop/dark and its phone screens/actions were covered separately, not as one uninterrupted phone run. |
| 9.11-1 Routes/responsiveness/themes | **Fail T-001** | 522 combinations; no document overflow, wrong theme, exception or 500. Art appears at 1512 and not 834/402. System Administrator route fails authorization presentation. |
| 9.11-2 Loading/empty/missing/500 | Partial | Empty/filter/error and API-unreachable cards remained usable. The already-known offset-instant 500 was not re-reported; the missing-record retry was not exercised for every record type. |
| 9.11-3 Dialogs | **Fail T-004** | Focus, Escape, busy state, field/server placement and retained filters passed; double Enter can submit twice. |
| 9.11-4 Navigation | Partial | Current item, queue counts, deep links, return-after-login and stale-page recovery passed; exhaustive browser back/forward was not repeated on every route. |
| 9.11-5 Accessibility basics | Pass | Axe WCAG A/AA found zero violations on the 402/light phone dialog; controls were labelled, focus trapped, and primary contrast measured 16.61:1. The known `block`+primary combination is not instantiated in the current app. |

### 3.5 Known accepted items checked

- The app emitted UTC instants throughout captured assignment/cancellation workflows; the already-known hand-written offset-instant API 500 was not re-reported.
- Seeded `passwordChangedAtUtc`, Company-less real registration events, Company-less Company create/delete semantics and the seed-only Company mismatch were observed as documented.
- The one-minute `/api/me`/permission cache was visible in the role-revocation and timed-expiry tests; access converged correctly after the window.
- The single bundle and three open-work queue requests were visible on shell loads; they were not classified as findings.
- Transfer acceptance/resend fields matched the API rather than the two known prototype mistakes.
- The `block`+primary button combination is not currently instantiated. The actual 402 px light-theme primary sheet button measured 16.61:1 contrast.
- Access pending was reached by revoking Toms's only role and behaved as documented.

## 4. Not tested and why

- The real two-hour idle, 12-hour absolute-session and 15-minute lockout-release windows were not allowed to elapse. Stored deadlines were exact; remote revocation exercised the same app exit/return path.
- Whole-browser restart with a persistent real user profile was not run. Two tabs sharing one cookie/session were exercised.
- One-hour password-reset/email-change expiry and 24-hour confirmation expiry were not waited. Stored confirmation expiry was exactly 24 hours; purpose, alteration, replacement and single-use boundaries were tested.
- Ninety-day session cleanup and bounded expired-registration cleanup were not elapsed. Derived expiry behavior was tested from seeded elapsed records.
- SMTP failure was not induced; Mailpit delivery succeeded. Production provider, DNS/SPF/DKIM/DMARC, bounce handling, TLS/origins/cookie domains and secret storage require the production environment and are explicitly out of scope.
- One-time administrator bootstrap, empty-install first Company/Principal setup and offline administrator recovery were not destructively recreated against the already-operational seed.
- Performance/load was not tested. Tasks, Insurance cases and billing calculation were not tested because the brief excludes them.
- The complete business day-in-life was not repeated as one uninterrupted 402 px run; its phone layouts/actions were covered separately, and the complete wrong-car script did run at 402/light.
- Not every list-filter permutation or browser back/forward sequence was clicked at every width; server combinations and representative UI filters/deep links were covered.

## 5. Questions for the owner

- **T-006:** Should RWRent enforce a minimum driver age (and, if so, what age/jurisdiction rule), or is possession of a manually entered licence number intentionally the only eligibility check? Today the rules deliberately reject only future birth dates, so a driver born today can be created and authorized.

## 6. Environment

- Test date: 2026-09-16; workstation zone Europe/Tallinn.
- Run duration: approximately 1 hour 25 minutes, excluding report consolidation.
- API worktree: `/Users/zulf/rw-rent-api/RWRentApi-wiring`, branch `feature/backend-wiring`, commit `15bb871cbea95ec59831a08dde617ef264425354` (`Backlog: the testing phase and where its findings arrive`).
- App worktree: `/Users/zulf/rw-rent-api/rw-rent-web-wiring`, branch `feature/backend-wiring`, commit at start `28858c1281e4e86a347cc1b6bc2a3363731af1e1` (`Testing brief: only the wiring folders, both sides, recent changes as the risk map, tools and scratch folder for an outside model`).
- API process verified listening on port 5001 with working directory under `RWRentApi-wiring/src/RWRentApi.Api`.
- App process verified listening on port 5173 with working directory `rw-rent-web-wiring`.
- Initial replacement seed completed at 2026-09-16 11:39:51 UTC with the documented counts (12 application users including the technical actor, 10 vehicles, 8 customers, 7 drivers, 12 assignments, 6 authorizations, 4 interruptions, 13 audit entries, 1 administrator transfer).
- Browser: Playwright Chromium 153.0.8010.12, headless, at 1512×982, 834×1112 and 402×874 in forced light and dark themes; macOS 26.4.1.
- API/toolchain: .NET SDK 10.0.203; Node 25.9.0; npm 11.12.1; direct Python cookie-jar harness; Draft 2020-12 JSON Schema validation; PostgreSQL readbacks; Mailpit REST API; Axe WCAG A/AA scan.
- Primary evidence and scripts are kept outside both worktrees in `/Users/zulf/rw-rent-api/testing-scratch/`.

## 7. Dataset state at the end

Replacement seed completed at **2026-09-16 13:05:18 UTC** with the baseline counts (12 application users including the technical actor, 10 vehicles, 8 customers, 7 drivers, 12 assignments, 6 authorizations, 4 interruptions, 13 audit entries and 1 administrator transfer). Mailpit was cleared. `/health` answered healthy. The API remains running from `RWRentApi-wiring/src/RWRentApi.Api` on port 5001 and the app from `rw-rent-web-wiring` on port 5173.
