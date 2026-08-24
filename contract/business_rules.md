# Business Rules

> **Status: V4 AND V5 BASELINE CONFIRMED; V6 AUTHENTICATION REFACTOR CONFIRMED AND IMPLEMENTED.**
> The owner approved the V4 domain rules through 2026-07-18, the V5 access baseline through
> 2026-07-23, and the V6 authentication rules through 2026-08-04. The V6 rules below supersede only
> conflicting V5 account-creation, user-lifecycle, authentication, and administrator-lifecycle rules.
> This document does not claim a new comprehensive regression-tested baseline for V6.
>
> Driver, Customer, Vehicle, Rental Assignment, Driver Authorization, Interruption, operating
> Company, human-user, authentication, authorization, session, audit, and privileged-correction
> behavior now have production code and automated coverage at the appropriate Domain, persistence,
> Application, and API boundaries.
>
> A rule explicitly tagged as a future phase remains approved product direction outside the current
> implementation. In particular, interruption billing metadata is stored, but billing calculation,
> rental agreements, invoicing, and payments are not part of the current backend. Updated
> 2026-08-04.

## Driver

- DRIVER-001: Drivers are deactivated rather than physically deleted, and the API exposes no delete operation.
- DRIVER-002: A newly created driver is always active.
- DRIVER-003: A driver must have at least one of personal ID or date of birth.
- DRIVER-004: A driver's date of birth, when provided, must not be in the future.
- DRIVER-005: A driver's email, phone number, and driver licence number must each be unique across all drivers (compared case-insensitively and trimmed).
- DRIVER-006: A driver's personal ID, when provided, must be unique across all drivers.
- DRIVER-007: A driver cannot be deactivated while they have an open named-Driver authorization on any active assignment. An assignment interruption does not stop that authorization and does not remove the deactivation block.
- DRIVER-008: Deactivating a driver never automatically stops an authorization or ends, cancels, interrupts, or otherwise changes an assignment. The named authorization must be stopped explicitly, with replacement coverage when required, before deactivation is retried.
- DRIVER-009: Updating a driver's administrative details never changes the driver's active state.
- DRIVER-010: An inactive driver's details may still be corrected through an update.
- DRIVER-011: A driver requires a first name, last name, address, email, phone number, and driver licence number.

## Vehicle

- VEHICLE-001: A vehicle's plate number must be unique across all vehicles.
- VEHICLE-002: A vehicle's VIN code must be unique across all vehicles.
- VEHICLE-003: A vehicle's manufacturing year must be 1900 or later.
- VEHICLE-004: A vehicle has an active/inactive state and is active when created.
- VEHICLE-005: A vehicle's body type, gearbox type, and fuel type must each be one of the defined categories.
- VEHICLE-006: Vehicles are deactivated rather than physically deleted, and the API exposes no Vehicle delete operation.
- VEHICLE-007: An inactive Vehicle cannot be selected for a new Assignment or used to activate a planned Assignment.
- VEHICLE-008: A Vehicle cannot be deactivated while it has a Planned or Active Assignment. Every such Assignment must first be cancelled, reassigned, or ended through its valid lifecycle; a failed deactivation never changes an Assignment.

## Assignment

- ASSIGN-001: An assignment links exactly one customer to exactly one vehicle. A planned assignment may temporarily have no authorization coverage; an active assignment must be covered either by one or more open named-Driver authorizations or by one open BusinessCustomerDrivers authorization.
- ASSIGN-002: A Planned assignment requires PlannedStartAtUtc. An assignment created directly as Active may omit PlannedStartAtUtc. PlannedEndAtUtc is optional for both Planned and Active assignments. When both planned dates are supplied, PlannedEndAtUtc must be later than PlannedStartAtUtc. The former ASSIGN-003 is merged into this rule.
- ASSIGN-004: A vehicle may have at most one active assignment at any time. Authorizing multiple drivers under that assignment does not create multiple assignments.
- ASSIGN-005: An assignment's status is one of Planned, Active, Ended, or Cancelled.
- ASSIGN-006: Assignments are historical records and are not physically deleted.
- ASSIGN-007: A new assignment may be created as Planned or may start directly as Active when the vehicle is handed over immediately and no planning stage is needed. A Planned assignment may move to Active or Cancelled; an Active assignment may move to Ended or through the narrow mistaken-activation correction in ASSIGN-013 to Cancelled. Ended and Cancelled are final and can never return to Planned or Active.
- ASSIGN-008: An assignment ends when the vehicle is returned to the office, and renting the same vehicle again — even to the same customer with the same authorized drivers — requires a new assignment rather than reopening the old one. *(Owner-confirmed; future phase.)*
- ASSIGN-009: A vehicle with no active assignment is unassigned and is considered to be resting / in the company's own use. *(Owner-confirmed; future phase.)*
- ASSIGN-010: PlannedStartAtUtc and PlannedEndAtUtc store the current expected dates when they are known and may be changed when plans change. StartedAtUtc records actual physical handover and ClosedAtUtc records actual final closure. Actual timestamps are stored separately and never automatically replace the current planned values.
- ASSIGN-011: One vehicle may have several non-final planned assignments only when their planned ranges do not overlap. A range ending exactly when another begins is allowed; an open-ended planned range conflicts with every later planned range until it receives an end or becomes final.
- ASSIGN-012: Creating an assignment directly as Active or moving a Planned assignment to Active requires an eligible customer and vehicle, no other active assignment for the vehicle, at least one valid open authorization coverage record, and the actual handover time.
- ASSIGN-013: An assignment activated by mistake may move from Active to Cancelled only when no physical handover occurred, no interruption exists, and an explanatory note is supplied. The correction clears the erroneous StartedAtUtc, records ClosedAtUtc, and stops open authorizations. If physical handover occurred, the assignment must be Ended when the vehicle is returned and may not be deleted or cancelled merely to correct the record.

## Assignment Driver Authorization

- AUTH-001: An assignment Driver authorization is an explicit historical record whose authorization type is either NamedDriver or BusinessCustomerDrivers. AuthorizationType distinguishes an intentionally unnamed collective authorization from an invalid missing DriverId.
- AUTH-002: A NamedDriver authorization requires one active Driver. A BusinessCustomerDrivers authorization has no DriverId, is allowed only for a Business Customer, and requires a note describing the agreed collective coverage.
- AUTH-003: Open NamedDriver authorizations and an open BusinessCustomerDrivers authorization are mutually exclusive on the same assignment. An active assignment uses one or more named authorizations or one collective Business Customer authorization, never both simultaneously.
- AUTH-004: Starting an authorization records AuthorizedFromUtc. Stopping it records StoppedAtUtc and a StopReason. StoppedAtUtc must be later than AuthorizedFromUtc, and no separate future planned authorization start is stored.
- AUTH-005: Authorization records are never physically deleted or reopened. Reauthorizing the same Driver or the same Business Customer drivers creates a new authorization record and preserves each previous period.
- AUTH-006: The same Driver may have open named authorizations on several active assignments simultaneously, but may not have two open named authorizations on the same assignment.
- AUTH-007: A standalone stop on an active assignment may not remove its final authorization coverage. Another named authorization or BusinessCustomerDrivers authorization must replace it in the same atomic use case. Ending the assignment is the exception and stops every open authorization without replacement.
- AUTH-008: Stopping an authorization never silently changes the assignment. Temporary non-use, vacation, or sickness does not automatically stop permission; any agreed billing impact is recorded through an assignment interruption.
- AUTH-009: BusinessCustomerDrivers is forbidden for a Private Customer. If the Private Customer personally replaces the final authorized Driver, a separate active Driver record representing that Customer must receive a named authorization in the same atomic use case before the previous final authorization is stopped. The system never creates that Driver or grants fallback permission implicitly.
- AUTH-010: The allowed authorization stop reasons are CustomerRequest, DriverNoLongerEligible, Replaced, AssignmentEnded, AssignmentCancelled, and Other. Selecting Other requires a note.

## Interruption

- INTERRUPT-001: An interruption belongs to exactly one assignment.
- INTERRUPT-002: An interruption may be open-ended (no end time).
- INTERRUPT-003: When an interruption has an end time, it must be later than its start time.
- INTERRUPT-004: Every interruption has a reason from the defined set of interruption reasons.
- INTERRUPT-005: Every interruption has a billing impact from the defined set (fully billable, not billable, 50%, 25%, or manual agreement).
- INTERRUPT-006: Every interruption must have a note.
- INTERRUPT-007: Two interruptions on the same assignment may overlap in time. *(Owner-confirmed; billing is not implemented and remains a future phase.)*
- INTERRUPT-008: Interruption discounts are never stacked. For an overlapping period containing only automatic percentage-based impacts, the single strongest discount applies. If any applicable interruption uses ManualAgreement, automatic discount selection is bypassed for that period and its billing treatment must be resolved manually. Each non-overlapping period uses its own interruption's billing impact. *(Billing calculation is not implemented in V4.)*
- INTERRUPT-009: An interruption is a manually recorded assignment-level billing-impact period. It never belongs to an individual Driver authorization, does not stop any authorization, and does not change the assignment's status.
- INTERRUPT-010: Driver circumstances may justify an assignment interruption when the agreed billing treatment is affected even if another authorized Driver could theoretically use the vehicle but does not use it in practice. NoAvailableAuthorizedDriver is added to the reason set, and the required note explains the relevant circumstances.
- INTERRUPT-011: An assignment cannot be Ended while any interruption remains open. Every open interruption must be reviewed and explicitly ended; assignment closure never silently ends interruptions.
- INTERRUPT-012: An interruption may be entered or corrected retroactively when it does not begin before the assignment's actual StartedAtUtc. An interruption added to an Ended assignment must have an end time no later than the assignment's ClosedAtUtc. Every correction remains audited and never reopens the assignment.
- INTERRUPT-013: When InterruptionReason is Other, the required Note must explain the specific reason that is not represented by the predefined reason values.

## Application User (V6)

> The V6 registration lifecycle below supersedes the conflicting V5 account-creation and profile
> rules while preserving the multi-role access model.

- USER-001: A human Application User may have several role-assignment records. Effective permissions are the union of their currently effective assignments; the pre-V5 scalar `Role` property no longer exists.
- USER-002: A human Application User requires an email that is normalized and unique across all Application Users and Identity credential accounts. The email is both the login identifier and contact email.
- USER-003: The fixed technical system actor is not a human System Administrator. It has no Identity account, password, session, Company, role assignment, or ability to authenticate. A human System Administrator is a separate Application User.
- USER-004: A human Application User begins in `PendingActivation`. It may become `Active`, `RegistrationRejected`, or effectively/persistently `RegistrationExpired` only through the confirmed lifecycle and may later become `Suspended`; a newly persisted user is never active by default.
- USER-005: Every auditable business record records the real human creator and latest updater after authentication, together with the relevant UTC times, and its creation attribution is immutable. The technical actor may be used only by an explicitly declared trusted system operation.
- USER-006: A human Domain Application User and their ASP.NET Core Identity credential account use the same `Guid` but remain separate models: business profile and access state belong to RWRent, while credential state belongs to Identity Infrastructure.
- USER-007: A human Application User requires independently trimmed first and last names of at most 100 characters each and a required trimmed phone number of at most 30 characters. No address field belongs to the Application User.
- USER-008: A Company-scoped human Application User requires `CompanyId`. The dedicated human System Administrator and fixed technical actor have no Company.
- USER-009: A pending, rejected, or expired user cannot hold an active session or exercise a role. A pending user receives only the defined coded sign-in outcome after correct password proof.
- USER-010: An Active user may authenticate, and their business permissions are the union of all unrevoked and unexpired role assignments effective at the current time.
- USER-011: A Suspended user cannot authenticate or continue an existing session, and all of their role assignments are ineffective while the suspension remains.
- USER-012: Restoring a Suspended user makes only their existing unrevoked and unexpired role assignments effective again; it does not recreate an expired or revoked assignment.
- USER-013: A human Application User may be Active while having no effective business role. Such a user may use only authenticated self-service operations and receives no Company or business permissions.
- USER-014: `IsSystemAccount` is true only for the fixed technical actor and is not a human role or permission.
- USER-015: An Active user may change their own required phone number but may not change their own first or last name.
- USER-016: Company Principal may correct the first and last name of an ordinary user in its Company, and System Administrator may correct any ordinary human user's names. The correction requires a meaningful reason and append-only audit history.
- USER-017: No ordinary endpoint physically deletes a human Application User because its identifier may be referenced by business and audit history.
- USER-018: `SecurityVersion` starts at `1` and advances atomically whenever a credential, login email, lifecycle status, role assignment, administrator transfer, or user-wide forced logout makes previously authenticated state stale.
- USER-019: Changing a phone number, first or last name, or ordinary business data does not advance `SecurityVersion`.
- USER-020: Registration assigns no Company. Ordinary activation resolves the singleton Company and fixes `CompanyId`; no user transfer between Companies or Company-membership correction operation exists.

## Customer

> Rental responsibility belongs to the Customer concept introduced and implemented in V4.

- CUSTOMER-001: A customer is the party responsible for rentals and may be either a private individual or a business.
- CUSTOMER-002: A customer may hold many assignments.
- CUSTOMER-003: Each assignment belongs to exactly one customer and concerns exactly one vehicle. A planned assignment may temporarily have no authorization; an active assignment uses named Driver coverage or, for a Business Customer only, collective BusinessCustomerDrivers coverage. Responsibility for the vehicle remains with the customer.
- CUSTOMER-004: A driver and a customer are separate concepts even though the same person may be both — a driver is an authorized user of a vehicle, while a customer is the responsible/contracting party.
- CUSTOMER-005: Authorizing multiple named Drivers to use a vehicle does not create separate assignments; all named authorization records are associated with the same customer-vehicle assignment.
- CUSTOMER-006: Collective BusinessCustomerDrivers coverage is available only to a Business Customer and never to a Private Customer.
- CUSTOMER-007: Customer responsibility does not itself grant driving permission. When a Private Customer personally drives or becomes fallback coverage, a separate active Driver record representing the same person must receive an explicit named authorization.
- CUSTOMER-008: A Customer's type is either PrivateIndividual or Business and does not change after creation.
- CUSTOMER-009: Every Customer requires an address, email, and phone number. Address stores the private contact address for a PrivateIndividual and the legal address for a Business.
- CUSTOMER-010: A PrivateIndividual Customer requires first name, last name, and at least one of personal ID or date of birth. Company name and registration code must be absent, a supplied date of birth cannot be in the future, and a supplied personal ID must be unique across Customers.
- CUSTOMER-011: A Business Customer requires company name and registration code. Private first name, last name, personal ID, and date of birth must be absent, and registration code must be unique across Customers.
- CUSTOMER-012: To use a Private Customer as a Driver, a separate Driver record must be created with the same applicable identity and contact information plus all required Driver-specific information, including the driver licence number. The Private Customer stores an optional unique DriverId link to that corresponding Driver record. The link is required before the Customer can personally drive, but the Driver must still be authorized explicitly; the Customer record or link never grants driving permission by itself.
- CUSTOMER-013: Customers are active when created and are deactivated rather than physically deleted. An inactive Customer cannot be selected for a new Assignment or used to activate a planned Assignment.
- CUSTOMER-014: A Customer cannot be deactivated while responsible for a Planned or Active Assignment. Every such Assignment must first be cancelled, reassigned, or ended through its valid lifecycle; a failed deactivation never changes an Assignment.
- CUSTOMER-015: A Private Customer's DriverId link cannot be changed or cleared while the linked Driver has an open named authorization on one of that Customer's active Assignments. The authorization must first be stopped, with replacement coverage when required; changing the link never changes an authorization automatically.
- CUSTOMER-016: Customer email and phone number are each unique across Customers after normalization. Uniqueness is enforced independently for Customers and Drivers, so the corresponding Customer and Driver records for the same person may reuse the same email, phone number, personal ID, address, and other shared personal information.

> Final V4 business-rule decisions were confirmed on 2026-07-18. Current database data is disposable
> development/test data, so the V4 migration does not require preservation or backfill of existing
> Assignment or Interruption rows.

## Operating Company (V6)

- COMPANY-001: `Company` represents the operating company using RWRent and is a different concept from a Business Customer that rents a vehicle.
- COMPANY-002: V5 supports exactly one operating Company. Driver, Customer, Vehicle, Rental Assignment, Driver Authorization, and Interruption records remain inside that single-company boundary and do not receive tenant ownership in V5.
- COMPANY-003: A Company requires a name, registration number, legal address, and email. VAT number and phone number are optional.
- COMPANY-004: Registration number and a supplied VAT number are normalized before persistence and must each be unique after normalization.
- COMPANY-005: Only the human System Administrator may create the operating Company, and creation fails when a Company already exists.
- COMPANY-006: System Administrator, Company Principal, and Fleet Manager may read and update the Company. Viewer may read it but may not update it.
- COMPANY-007: Changes to Company identity fields, including name, registration number, and VAT number, record meaningful before/after values and the human actor.
- COMPANY-008: Company activation and deactivation do not exist in V5.
- COMPANY-009: Only the human System Administrator may delete a mistakenly created Company, and only while it has no users or other references. A referenced Company returns a conflict and is never deleted as a side effect.
- COMPANY-010: A Company may be deleted only when no record references it. Company deletion never automatically deletes users or business history.
- COMPANY-011: Company setup is incomplete until an authorized activation grants its first non-expiring Company Principal. The System Administrator remains responsible for setup until then.

## Roles, Permissions, and Company Principal Protection (V6)

- ROLE-001: The code-owned roles are System Administrator, Fleet Manager, Company Principal, and Viewer. `CompanyPrincipal` replaces `CompanyAdministrator`.
- ROLE-002: A human user may have several role-assignment records. Effective permissions are the union of all assignments that are unrevoked, unexpired, and attached to an Active user.
- ROLE-003: Role types and permission bundles are defined in code. There is no database/UI role designer and no direct per-user permission override.
- ROLE-004: Enum numeric values never imply a privilege hierarchy.
- ROLE-005: Role assignments are historical records and are never physically deleted or reopened. Regranting a revoked or expired role creates a new assignment.
- ROLE-006: A user cannot have two simultaneously effective assignments for the same role. A temporary assignment takes effect when granted and must expire later than its assignment time; the system does not schedule a future role start.
- ROLE-007: Revoking a role requires a meaningful reason and records actor and UTC time. Editing an assignment expiry also records the actor and invalidates stale authenticated access.
- ROLE-008: Viewer may read all non-secret Company and business information and the basic user directory for its Company, but may not read other users' sessions, credential information, or security/user-administration audit history.
- ROLE-009: Fleet Manager has Viewer access plus every ordinary Driver, Customer, Vehicle, Rental Assignment, Driver Authorization, and Interruption operation in its Company. Fleet Manager may review/manage registrations and activate only Viewer; it cannot grant/revoke post-activation roles, suspend users, or revoke another user's sessions.
- ROLE-010: Company Principal has every Fleet Manager capability and may additionally activate Company users as Viewer or Fleet Manager, grant/revoke Viewer and Fleet Manager assignments, correct names, suspend/restore ordinary Company users who do not hold Company Principal, revoke those ordinary users' sessions, and read Company user-administration history.
- ROLE-011: Company Principal may never grant, revoke, transfer, or otherwise administer System Administrator.
- ROLE-012: System Administrator may perform every supported operation and privileged correction, but never bypasses foreign keys, concurrency control, domain invariants, or audit requirements.
- ROLE-013: System Administrator assignment is not available through ordinary activation or role-management endpoints.
- ROLE-014: After Company setup, the Company must always have at least one Active, non-expiring Company Principal.
- ROLE-015: During initial setup, the Company may temporarily have no Principal; it remains under System Administrator control until a confirmed pending registration is atomically activated with a non-expiring Company Principal assignment.
- ROLE-016: A temporary Company Principal cannot be the Company's only Principal.
- ROLE-017: The final protected Principal cannot be revoked, given an expiry, suspended, or left as the only temporary Principal.
- ROLE-018: A Company Principal cannot revoke, expire, or otherwise modify their own Company Principal assignment, even when another protected Principal remains.
- ROLE-019: Only the human System Administrator may grant, revoke, set or change the expiry of, replace, or make ineffective through user suspension any Company Principal assignment. An operation affecting the final protected Principal is one concurrency-safe, atomic, audited operation that never commits a state without an Active, non-expiring Principal.
- ROLE-020: Natural role expiry takes effect at its recorded instant without requiring a background write. Authorization always evaluates the current time and current assignments.

## Self-Registration and Activation (V6)

- REGISTRATION-001: Public self-registration creates same-id Domain and Identity records with first name, last name, required phone, normalized unique email, compliant password, `PendingActivation` status, a seven-day registration window, and one 24-hour email-confirmation challenge. It assigns no Company, role, permission, session, or cookie.
- REGISTRATION-002: Well-shaped registration and resend requests return the same empty `202 Accepted` result for new and known-account branches. Account existence, status, and delivery outcome are not disclosed.
- REGISTRATION-003: A known email never overwrites profile or credential data. Correct existing-password proof may rotate an eligible current challenge or restart an effectively expired registration; every other known-account branch is a no-op.
- REGISTRATION-004: Confirmation accepts only the current unconsumed, unsuperseded, unexpired token hash. Success confirms Identity email, consumes the challenge, clears registration expiry, advances security state, and creates no access.
- REGISTRATION-005: An unconfirmed registration becomes effectively `RegistrationExpired` when its seven-day window elapses, whether or not cleanup has materialized the state. Materialization supersedes current challenges and audits exactly once.
- REGISTRATION-006: Confirmation-message failure never rolls back, activates, deletes, or changes the committed account. Eligible resend with email plus correct password provides the retry path.
- REGISTRATION-007: Fleet Manager, Company Principal, and System Administrator may review and manage pending/rejected/expired registrations; Viewer sees only admitted Company directory entries.
- REGISTRATION-008: Ordinary activation requires confirmed effective `PendingActivation`, no administrator-transfer reservation, the singleton Company, and one or more unique permitted initial roles. System Administrator is never an ordinary activation role.
- REGISTRATION-009: Activation atomically assigns Company and roles, changes status to `Active`, advances security state, and audits before sending the outcome message. Any invalid role grant fails the whole operation.
- REGISTRATION-010: Rejection requires an internal reason, preserves no Company or roles, supersedes current confirmation, advances security state, and sends an outcome message that excludes the reason.
- REGISTRATION-011: Reopening targets only `RegistrationRejected`, preserves history, and returns to `PendingActivation`. Confirmed email waits immediately; unconfirmed email receives a new seven-day window and challenge.
- REGISTRATION-012: Registration, confirmation, rejection, reopening, and activation tokens/data are purpose-specific; raw tokens are never persisted or logged.
- REGISTRATION-013: Bounded trusted cleanup may materialize untouched elapsed registrations, but API correctness never depends on cleanup scheduling.

## Technical Actor and Human System Administrator (V6)

- SYSTEM-001: The existing fixed-id seeded row remains as `RWRent System Actor` so historical foreign keys remain valid.
- SYSTEM-002: The technical actor has no Identity account, password, session, Company, or role assignment and cannot authenticate or invoke the API.
- SYSTEM-003: The technical actor is excluded from ordinary user-management results and cannot be modified through human-user endpoints.
- SYSTEM-004: The technical actor may attribute only an explicitly declared trusted system operation, such as initial bootstrap or an approved background process. It is never the automatic fallback for an unauthenticated HTTP request.
- SYSTEM-005: The human System Administrator is a separate self-registered dedicated credential account. The owner uses that account for system work and a different Company account for daily Fleet Manager/Company Principal work.
- SYSTEM-006: After bootstrap, exactly one Active human holds the non-expiring System Administrator assignment.
- SYSTEM-007: The first human System Administrator is activated only through the one-time deployment command after ordinary registration and email confirmation. No public endpoint or migration seeds a human password.
- SYSTEM-008: Bootstrap accepts runtime email only, requires the exact confirmed dedicated pending registration with no Company/role/live transfer, and refuses while any non-revoked human System Administrator assignment exists. It sends no credential or setup token.
- SYSTEM-009: Ordinary user, registration, suspension, and role endpoints cannot revoke, expire, suspend, replace, or delete the human System Administrator.
- SYSTEM-010: Only the current human System Administrator may initiate administrator transfer, and initiation requires their current password and a meaningful reason.
- SYSTEM-011: Administrator transfer targets an existing confirmed dedicated pending no-Company registration rather than converting an existing daily Company account. Acceptance proves the target's existing registration password and never establishes or replaces it.
- SYSTEM-012: The current administrator remains fully responsible while transfer acceptance is pending. Expiry or cancellation of the transfer leaves the current administrator unchanged.
- SYSTEM-013: Successful transfer atomically activates the new dedicated account, revokes the old System Administrator assignment, grants the new non-expiring assignment, suspends the previous dedicated account, revokes its sessions, and records the complete history.
- SYSTEM-014: Offline administrator recovery is an operator/deployment action, not a public bypass endpoint. It may restore the existing administrator or atomically replace an unrecoverable one with an existing confirmed dedicated pending registration while preserving the exactly-one rule.
- SYSTEM-015: MFA and MFA-based step-up are outside V6; their absence is an accepted limitation.
- SYSTEM-016: Transfer resend requires current-administrator permission and password proof, rotates the same unused transfer's token and 24-hour lifetime, and never creates duplicate transfer state.

## Authentication and Passwords (V6)

- LOGIN-001: Human credentials are managed by ASP.NET Core Identity. RWRent does not implement custom password hashing or custom password-reset cryptography.
- LOGIN-002: The browser frontend authenticates with a protected server cookie. V6 issues no JWT access token, refresh token, or refresh endpoint.
- LOGIN-003: Login verifies password and lockout before account-specific lifecycle handling. Only a confirmed, structurally coherent Active human creates a server session and authentication cookie.
- LOGIN-004: Registration, authentication, reset, and recovery responses do not disclose whether an email exists beyond the explicitly approved lifecycle outcome after correct password proof.
- LOGIN-005: Five consecutive failed password attempts lock the human account for 15 minutes. A successful login resets the failed-attempt count, and no automatic lockout is permanent.
- LOGIN-006: Account lockout applies to every human account, including System Administrator. Endpoint rate limiting by account/email key and source address applies independently of lockout.
- LOGIN-007: V6 uses exactly one persistent authentication cookie and no JWT or refresh token. A separate HttpOnly antiforgery cookie plus in-memory request-header token protects state-changing requests but is not an authentication credential and cannot identify or authenticate a user.
- LOGIN-008: Correct password proof returns stable coded `403` outcomes for unconfirmed, confirmed-pending, rejected, expired, suspended, or structurally incoherent accounts. Unknown email, wrong password, and lockout remain the same coded `401`; no failure creates a session or cookie.
- PASSWORD-001: A password contains at least 12 characters and at least one uppercase letter, one number, and one non-whitespace symbol or punctuation character.
- PASSWORD-002: Spaces and passphrases are allowed, but whitespace does not satisfy the symbol requirement. No separate lowercase-letter requirement exists.
- PASSWORD-003: The system accepts otherwise valid passwords of at least 64 characters. Any defensive request-size ceiling cannot be lower than 64.
- PASSWORD-004: A maintained common/compromised-password blocklist rejects known weak passwords without logging, persisting, or sending the complete plaintext password to a third party.
- PASSWORD-005: Passwords do not expire periodically.
- PASSWORD-006: A new password cannot match any of the five most recently used passwords, including the current password. History stores only Identity password hashes and verifies candidates through the configured password hasher.
- PASSWORD-007: Password-history enforcement applies to authenticated password changes and password resets. The initial registration password has no previous history.
- PASSWORD-008: A password-reset token is purpose-specific, becomes unusable after successful reset, and expires one hour after generation.
- PASSWORD-009: Successful password reset advances Identity security state and `SecurityVersion`, revokes every existing session, and requires a new login.
- PROFILE-001: Changing login email begins from an authenticated session and requires current-password confirmation plus verification of the new email.
- PROFILE-002: A pending email-change link expires one hour after generation; completing it updates the Domain and Identity email atomically and invalidates every older pending email-change token.
- PROFILE-003: Successful self-service password or email change revokes other sessions and may retain only the initiating session by reissuing it with the new security version.

## Server-Tracked Sessions (V6)

- SESSION-001: Every successful login creates one server-tracked session and one protected cookie containing at least user id, session id, and issued security version.
- SESSION-002: The authentication cookie is HttpOnly, Secure in production, host-only to the API, scoped to `/`, and persistent so it normally survives a browser restart. V6 has no user-selectable Remember Me option. Its renewed browser expiry never exceeds the earlier of the current two-hour inactivity deadline and the original 12-hour absolute session deadline.
- SESSION-003: A session expires after two hours without a genuine authenticated API interaction.
- SESSION-004: Genuine authenticated activity may move the inactivity deadline, but a heartbeat whose only purpose is to avoid logout does not count.
- SESSION-005: Every session has an absolute lifetime of 12 hours from its original login. Cookie renewal and continuous activity never extend that deadline.
- SESSION-006: All tabs in one browser profile share the same cookie and session. Closing all RWRent tabs does not log the user out; reopening within the valid idle and absolute periods normally resumes the session.
- SESSION-007: Closing the whole browser does not log the user out. Reopening the same browser profile normally resumes the session while its persistent cookie, two-hour inactivity deadline, and 12-hour absolute deadline all remain valid. Clearing cookies, using a non-persistent/private profile, or reaching either deadline requires login; explicit logout immediately revokes the current server session.
- SESSION-008: Every authenticated request rejects a missing, revoked, idle-expired, absolute-expired, suspended, technical-actor, or stale-security-version session.
- SESSION-009: Logout is idempotent, best-effort revokes the identifiable current server session, expires both authentication and antiforgery cookies, and returns `204` even for absent or stale state. An unsafe request carrying the authentication cookie still requires antiforgery proof.
- SESSION-010: A user may list their own sessions, revoke one of them, or revoke every other session while retaining the current session.
- SESSION-011: Revoking selected sessions does not increment `SecurityVersion`; this permits retaining the current session.
- SESSION-012: Company Principal may revoke sessions of an ordinary user in its own Company who does not hold Company Principal. System Administrator may revoke any human user's sessions.
- SESSION-013: Password reset, suspension, administrator transfer, and security-sensitive role changes revoke all affected stale sessions.
- SESSION-014: Session device/browser metadata is for user recognition only and is never accepted as proof of identity.
- SESSION-015: Expired and revoked session rows are retained for 90 days for security review and are then eligible for cleanup; the cookie remains unusable regardless of row retention.

## Audit History and Privileged Corrections (V6)

- AUDIT-001: Authenticated HTTP business operations use the real human actor's identifier for creation and update attribution.
- AUDIT-002: An unauthenticated HTTP request never becomes the technical actor. A business write without an authenticated human, a successfully validated purpose-specific account token, or an explicit trusted system execution context is rejected.
- AUDIT-003: Registration, role, lifecycle-status, forced-logout, administrator-transfer, Company-identity, email-security, and privileged-correction actions record actor and UTC time.
- AUDIT-004: Role revocation and every privileged correction require a meaningful reason.
- AUDIT-005: Security and correction history is append-only through the API. Ordinary update audit fields do not replace historical event records.
- AUDIT-006: Audit before/after data includes only meaningful changed values and excludes passwords, cookies, tokens, password hashes, security stamps, Data Protection keys, and other secrets.
- AUDIT-007: After successful token validation, administrator-transfer acceptance, registration/email confirmation, and password reset are attributed to the affected human account. An invalid token never establishes an actor or permits a write.
- CORRECTION-001: Ordinary operations continue to enforce each entity's normal lifecycle. Privileged correction exists only for a verified data-entry mistake in protected or finalized history.
- CORRECTION-002: Only System Administrator may execute a privileged correction.
- CORRECTION-003: Every correction loads the target, enforces optimistic concurrency, revalidates foreign keys and all affected business rules, and saves the corrected state and append-only audit record atomically.
- CORRECTION-004: System Administrator permission never permits an invalid state, a foreign-key bypass, a concurrency bypass, or silent rewriting of creation audit.
- CORRECTION-005: V5 exposes no generic correction endpoint that accepts an entity name and arbitrary fields.
- CORRECTION-006: A typed Rental Assignment correction may repair an incorrect Customer, Vehicle, planned/actual timestamps, or note, but it cannot freely assign a lifecycle status or bypass assignment overlap, eligibility, coverage, and timestamp rules.
- CORRECTION-007: A typed Driver Authorization correction may repair authorization type/Driver, authorization period, stop reason, or note only when the result remains valid coverage history; it never deletes the record or silently changes the Assignment lifecycle.
- CORRECTION-008: A typed Interruption correction may repair its period, reason, billing impact, or note only within the Assignment's valid actual period and without changing authorization or Assignment status.
- CORRECTION-009: Driver, Customer, and Vehicle continue to use their existing rule-aware update and activate/deactivate operations; privileged correction does not introduce hard deletion for them.
- CORRECTION-010: Rental Assignments, Driver Authorizations, Interruptions, users, role assignments, and correction audit entries preserve history and are not physically deleted.

## Email Delivery (V6)

- EMAIL-001: Registration confirmation, activation, rejection, administrator-transfer, email-change, and password-reset messages are sent through focused application email operations; vendor-specific delivery code and credentials remain Infrastructure concerns.
- EMAIL-002: Local development uses Mailpit and does not deliver authentication messages to real recipients.
- EMAIL-003: Production uses a specialized transactional-email provider, but the final vendor and API-versus-SMTP choice are deferred until production preparation.
- EMAIL-004: Production cannot go live until sender-domain verification, SPF, DKIM, DMARC, bounce handling, sender identity, secret storage, and delivery behavior are verified.
