import type {
  ApplicationUserListItemResponse, ApplicationUserResponse, CurrentUserResponse, OverviewSummaryResponse, PagedResponse, ProblemDetails, RecordDeletionCandidateCountsResponse, RecordDeletionListItemResponse, RoleAssignmentResponse, ValidationProblemDetails, VehicleDeletionCandidateResponse,
} from '@/api/dto';

/**
 * Follow-up 10's fixtures: the backend's round-9 answers exactly as the API gave them on the scratch
 * stack (port 5002, company email domain rwrent.example, 2026-09-22), during the joint check: the
 * seeded administrator gave the Record deleter role to the seeded Viewer Toms Rudzitis, who read the
 * page and deleted a practice vehicle, held the role alone for a moment, was refused an email change
 * out of the domain, and had the role revoked. One refusal could not be provoked there and says so.
 *
 * Typed as the DTOs, so a member the API sends and `dto.ts` does not declare fails the typecheck.
 * Only the tests import this module.
 */

/** The seeded administrator’s GET /api/me: every permission, Roles.ManageRecordDeleter among them, and never the role. */
export const meAdmin: CurrentUserResponse = {
  "id": "9f2b7c41-0001-4a10-8b01-000000000001",
  "email": "sysadmin@rwrent.example",
  "firstName": "Arturs",
  "lastName": "Veidenbaums",
  "phoneNumber": "+371 29 000 001",
  "companyId": null,
  "status": 2,
  "passwordChangedAtUtc": "2025-08-18T08:47:30.415516+00:00",
  "pendingEmail": null,
  "roles": [
    1
  ],
  "permissions": [
    "Company.Create",
    "Company.Delete",
    "Company.Read",
    "Company.Update",
    "Customers.Manage",
    "Customers.Read",
    "DriverAuthorizations.Manage",
    "DriverAuthorizations.Read",
    "Drivers.Manage",
    "Drivers.Read",
    "Interruptions.Manage",
    "Interruptions.Read",
    "PrivilegedCorrections.Execute",
    "Records.Delete",
    "RentalAssignments.Manage",
    "RentalAssignments.Read",
    "Roles.ManageCompanyPrincipal",
    "Roles.ManageRecordDeleter",
    "Roles.ManageViewerFleetManager",
    "Roles.ReadHistory",
    "SecurityAudit.ReadAll",
    "SecurityAudit.ReadCompany",
    "Sessions.ManageAnyUser",
    "Sessions.ManageOrdinaryCompanyUsers",
    "SystemAdministration.Transfer",
    "Users.ActivateCompanyPrincipal",
    "Users.ActivateFleetManager",
    "Users.ActivateViewer",
    "Users.CorrectName",
    "Users.ManageRegistrations",
    "Users.ReadDirectory",
    "Users.ReviewRegistrations",
    "Users.SuspendRestoreCompanyPrincipal",
    "Users.SuspendRestoreOrdinary",
    "Vehicles.Manage",
    "Vehicles.Read"
  ]
};

/** Toms Rudzitis’s own GET /api/me once he holds the role beside Viewer. */
export const meTomsHolder: CurrentUserResponse = {
  "id": "9f2b7c41-0005-4a10-8b01-000000000005",
  "email": "toms.rudzitis@rwrent.example",
  "firstName": "Toms",
  "lastName": "Rudzitis",
  "phoneNumber": "+371 22 118 003",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "status": 2,
  "passwordChangedAtUtc": "2026-07-14T08:47:30.415516+00:00",
  "pendingEmail": "toms.74b9b@lol.ee",
  "roles": [
    5,
    4
  ],
  "permissions": [
    "Company.Read",
    "Customers.Read",
    "DriverAuthorizations.Read",
    "Drivers.Read",
    "Interruptions.Read",
    "Records.Delete",
    "RentalAssignments.Read",
    "Users.ReadDirectory",
    "Vehicles.Read"
  ]
};

/** The same, after his Viewer role was revoked for the check: the Record deleter role alone. */
export const meTomsBare: CurrentUserResponse = {
  "id": "9f2b7c41-0005-4a10-8b01-000000000005",
  "email": "toms.rudzitis@rwrent.example",
  "firstName": "Toms",
  "lastName": "Rudzitis",
  "phoneNumber": "+371 22 118 003",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "status": 2,
  "passwordChangedAtUtc": "2026-07-14T08:47:30.415516+00:00",
  "pendingEmail": "toms.74b9b@lol.ee",
  "roles": [
    5
  ],
  "permissions": [
    "Records.Delete"
  ]
};

/** His record before the grant: a Viewer. */
export const tomsBefore: ApplicationUserResponse = {
  "securityVersion": 10,
  "updatedAtUtc": "2026-09-22T09:40:31.968771+00:00",
  "registrationDecisionReason": null,
  "id": "9f2b7c41-0005-4a10-8b01-000000000005",
  "email": "toms.rudzitis@rwrent.example",
  "firstName": "Toms",
  "lastName": "Rudzitis",
  "phoneNumber": "+371 22 118 003",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "status": 2,
  "emailConfirmed": true,
  "registrationExpiresAtUtc": null,
  "effectiveRoles": [
    4
  ],
  "createdAtUtc": "2026-07-14T08:47:30.415516+00:00"
};

/** His record once he holds the role. */
export const tomsHolder: ApplicationUserResponse = {
  "securityVersion": 11,
  "updatedAtUtc": "2026-09-22T10:37:24.033632+00:00",
  "registrationDecisionReason": null,
  "id": "9f2b7c41-0005-4a10-8b01-000000000005",
  "email": "toms.rudzitis@rwrent.example",
  "firstName": "Toms",
  "lastName": "Rudzitis",
  "phoneNumber": "+371 22 118 003",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "status": 2,
  "emailConfirmed": true,
  "registrationExpiresAtUtc": null,
  "effectiveRoles": [
    5,
    4
  ],
  "createdAtUtc": "2026-07-14T08:47:30.415516+00:00"
};

/** His role history then: the new, effective Record deleter assignment; three earlier ones that were revoked (round 9’s acceptance and the reviewer’s probe); his Viewer role. */
export const historyHolder: PagedResponse<RoleAssignmentResponse> = {
  "items": [
    {
      "id": "32fa0b85-4a92-4e83-b1c9-eff2a218af2c",
      "applicationUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "role": 5,
      "assignedAtUtc": "2026-09-22T10:37:24.031939+00:00",
      "assignedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "expiresAtUtc": null,
      "revokedAtUtc": null,
      "revokedByUserId": null,
      "revocationReason": null,
      "isEffective": true
    },
    {
      "id": "3e9a3392-00dd-46d4-986f-42c4d4e155b6",
      "applicationUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "role": 5,
      "assignedAtUtc": "2026-09-22T09:40:31.952098+00:00",
      "assignedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "expiresAtUtc": null,
      "revokedAtUtc": "2026-09-22T09:40:31.968768+00:00",
      "revokedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "revocationReason": "review probe: cleanup",
      "isEffective": false
    },
    {
      "id": "04c96e36-6b03-4f54-ba9b-33d871067b50",
      "applicationUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "role": 5,
      "assignedAtUtc": "2026-09-22T09:40:31.182337+00:00",
      "assignedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "expiresAtUtc": null,
      "revokedAtUtc": "2026-09-22T09:40:31.800074+00:00",
      "revokedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "revocationReason": "review probe: the right is taken back",
      "isEffective": false
    },
    {
      "id": "2346fa6f-68d0-4824-b51b-50c219ab7053",
      "applicationUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "role": 5,
      "assignedAtUtc": "2026-09-22T08:47:33.461631+00:00",
      "assignedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "expiresAtUtc": null,
      "revokedAtUtc": "2026-09-22T08:47:34.476203+00:00",
      "revokedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "revocationReason": "The practice with the deletions page is over.",
      "isEffective": false
    },
    {
      "id": "5a8f1d63-0005-4c30-8d03-000000000005",
      "applicationUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "role": 4,
      "assignedAtUtc": "2026-07-14T08:47:30.415516+00:00",
      "assignedByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "expiresAtUtc": null,
      "revokedAtUtc": null,
      "revokedByUserId": null,
      "revocationReason": null,
      "isEffective": true
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 5,
  "totalPages": 1
};

/** His role history at the end: the Record deleter assignment revoked with its reason, his Viewer role revoked for the bare-holder check and granted again. */
export const historyAfterRevoke: PagedResponse<RoleAssignmentResponse> = {
  "items": [
    {
      "id": "6ed12688-ebee-4c59-9378-b76a3939e57d",
      "applicationUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "role": 4,
      "assignedAtUtc": "2026-09-22T10:37:24.531641+00:00",
      "assignedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "expiresAtUtc": null,
      "revokedAtUtc": null,
      "revokedByUserId": null,
      "revocationReason": null,
      "isEffective": true
    },
    {
      "id": "32fa0b85-4a92-4e83-b1c9-eff2a218af2c",
      "applicationUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "role": 5,
      "assignedAtUtc": "2026-09-22T10:37:24.031939+00:00",
      "assignedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "expiresAtUtc": null,
      "revokedAtUtc": "2026-09-22T10:37:24.880809+00:00",
      "revokedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "revocationReason": "Follow-up 10 check: the practice is over.",
      "isEffective": false
    },
    {
      "id": "3e9a3392-00dd-46d4-986f-42c4d4e155b6",
      "applicationUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "role": 5,
      "assignedAtUtc": "2026-09-22T09:40:31.952098+00:00",
      "assignedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "expiresAtUtc": null,
      "revokedAtUtc": "2026-09-22T09:40:31.968768+00:00",
      "revokedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "revocationReason": "review probe: cleanup",
      "isEffective": false
    },
    {
      "id": "04c96e36-6b03-4f54-ba9b-33d871067b50",
      "applicationUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "role": 5,
      "assignedAtUtc": "2026-09-22T09:40:31.182337+00:00",
      "assignedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "expiresAtUtc": null,
      "revokedAtUtc": "2026-09-22T09:40:31.800074+00:00",
      "revokedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "revocationReason": "review probe: the right is taken back",
      "isEffective": false
    },
    {
      "id": "2346fa6f-68d0-4824-b51b-50c219ab7053",
      "applicationUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "role": 5,
      "assignedAtUtc": "2026-09-22T08:47:33.461631+00:00",
      "assignedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "expiresAtUtc": null,
      "revokedAtUtc": "2026-09-22T08:47:34.476203+00:00",
      "revokedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "revocationReason": "The practice with the deletions page is over.",
      "isEffective": false
    },
    {
      "id": "5a8f1d63-0005-4c30-8d03-000000000005",
      "applicationUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "role": 4,
      "assignedAtUtc": "2026-07-14T08:47:30.415516+00:00",
      "assignedByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "expiresAtUtc": null,
      "revokedAtUtc": "2026-09-22T10:37:24.434632+00:00",
      "revokedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "revocationReason": "Follow-up 10 check: the delete right alone.",
      "isEffective": false
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 6,
  "totalPages": 1
};

/** A grant of the role with an expiry, to Dita Smite, as the API answered it. */
export const grantedWithExpiry: RoleAssignmentResponse = {
  "id": "4489b265-197a-4ec5-be44-35616bc377af",
  "applicationUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "role": 5,
  "assignedAtUtc": "2026-09-22T10:37:24.378733+00:00",
  "assignedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
  "expiresAtUtc": "2026-12-21T21:59:59.999+00:00",
  "revokedAtUtc": null,
  "revokedByUserId": null,
  "revocationReason": null,
  "isEffective": true
};

/** Dita Smite’s role history once that expiry was changed through the row action. */
export const historyDitaWithExpiry: PagedResponse<RoleAssignmentResponse> = {
  "items": [
    {
      "id": "4489b265-197a-4ec5-be44-35616bc377af",
      "applicationUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "role": 5,
      "assignedAtUtc": "2026-09-22T10:37:24.378733+00:00",
      "assignedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "expiresAtUtc": "2027-01-20T21:59:59.999+00:00",
      "revokedAtUtc": null,
      "revokedByUserId": null,
      "revocationReason": null,
      "isEffective": true
    },
    {
      "id": "5a8f1d63-0002-4c30-8d03-000000000002",
      "applicationUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "role": 3,
      "assignedAtUtc": "2026-08-13T08:47:30.415516+00:00",
      "assignedByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "expiresAtUtc": "2026-12-11T08:47:30.415516+00:00",
      "revokedAtUtc": null,
      "revokedByUserId": null,
      "revocationReason": null,
      "isEffective": true
    },
    {
      "id": "5a8f1d63-0003-4c30-8d03-000000000003",
      "applicationUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "role": 3,
      "assignedAtUtc": "2026-05-25T08:47:30.415516+00:00",
      "assignedByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "expiresAtUtc": "2026-07-24T08:47:30.415516+00:00",
      "revokedAtUtc": "2026-07-23T08:47:30.415516+00:00",
      "revokedByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "revocationReason": "Temporary cover ended.",
      "isEffective": false
    },
    {
      "id": "5a8f1d63-0001-4c30-8d03-000000000001",
      "applicationUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "role": 4,
      "assignedAtUtc": "2026-04-15T08:47:30.415516+00:00",
      "assignedByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "expiresAtUtc": null,
      "revokedAtUtc": null,
      "revokedByUserId": null,
      "revocationReason": null,
      "isEffective": true
    },
    {
      "id": "5a8f1d63-0031-4c30-8d03-000000000031",
      "applicationUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "role": 4,
      "assignedAtUtc": "2025-11-26T08:47:30.415516+00:00",
      "assignedByUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "expiresAtUtc": "2026-03-01T08:47:30.415516+00:00",
      "revokedAtUtc": null,
      "revokedByUserId": null,
      "revocationReason": null,
      "isEffective": false
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 5,
  "totalPages": 1
};

/** The user directory as the administrator reads it, Toms holding both roles. */
export const directoryAdmin: PagedResponse<ApplicationUserListItemResponse> = {
  "items": [
    {
      "id": "9f2b7c41-0001-4a10-8b01-000000000001",
      "email": "sysadmin@rwrent.example",
      "firstName": "Arturs",
      "lastName": "Veidenbaums",
      "phoneNumber": "+371 29 000 001",
      "companyId": null,
      "status": 2,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [
        1
      ],
      "createdAtUtc": "2025-08-18T08:47:30.415516+00:00"
    },
    {
      "id": "9f2b7c41-0010-4a10-8b01-000000000010",
      "email": "baiba.krastina@example.com",
      "firstName": "Baiba",
      "lastName": "Krastina",
      "phoneNumber": "+371 25 118 990",
      "companyId": null,
      "status": 5,
      "emailConfirmed": false,
      "registrationExpiresAtUtc": "2026-09-20T08:47:30.415516+00:00",
      "effectiveRoles": [],
      "createdAtUtc": "2026-09-13T08:47:30.415516+00:00"
    },
    {
      "id": "9f2b7c41-0004-4a10-8b01-000000000004",
      "email": "dita.smite@rwrent.example",
      "firstName": "Dita",
      "lastName": "Smite",
      "phoneNumber": "+371 25 007 441",
      "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
      "status": 2,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [
        3,
        4
      ],
      "createdAtUtc": "2026-04-15T08:47:30.415516+00:00"
    },
    {
      "id": "9f2b7c41-0007-4a10-8b01-000000000007",
      "email": "gatis.lapsa@example.com",
      "firstName": "Gatis",
      "lastName": "Lapsa",
      "phoneNumber": "+371 26 118 447",
      "companyId": null,
      "status": 1,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [],
      "createdAtUtc": "2026-09-20T02:47:30.415516+00:00"
    },
    {
      "id": "9f2b7c41-0009-4a10-8b01-000000000009",
      "email": "imants.gailis@example.com",
      "firstName": "Imants",
      "lastName": "Gailis",
      "phoneNumber": "+371 29 004 118",
      "companyId": null,
      "status": 4,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [],
      "createdAtUtc": "2026-09-08T08:47:30.415516+00:00"
    },
    {
      "id": "9f2b7c41-0003-4a10-8b01-000000000003",
      "email": "karlis.zvaigzne@rwrent.example",
      "firstName": "Karlis",
      "lastName": "Zvaigzne",
      "phoneNumber": "+371 26 440 118",
      "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
      "status": 2,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [
        3
      ],
      "createdAtUtc": "2026-02-24T08:47:30.415516+00:00"
    },
    {
      "id": "9f2b7c41-0006-4a10-8b01-000000000006",
      "email": "liga.brice@example.com",
      "firstName": "Liga",
      "lastName": "Brice",
      "phoneNumber": "+371 28 774 110",
      "companyId": null,
      "status": 1,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [],
      "createdAtUtc": "2026-09-21T02:47:30.415516+00:00"
    },
    {
      "id": "5925ec73-98b9-4f08-93c8-b9d54bf228df",
      "email": "outside.practice.bb86bb@example.com",
      "firstName": "Outside",
      "lastName": "Practice",
      "phoneNumber": "+371 20 000 909",
      "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
      "status": 2,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [
        4
      ],
      "createdAtUtc": "2026-09-22T08:47:33.981523+00:00"
    },
    {
      "id": "9f2b7c41-0011-4a10-8b01-000000000011",
      "email": "raivis.dumins@rwrent.example",
      "firstName": "Raivis",
      "lastName": "Dumins",
      "phoneNumber": "+371 22 447 118",
      "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
      "status": 3,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [],
      "createdAtUtc": "2026-01-15T08:47:30.415516+00:00"
    },
    {
      "id": "9f2b7c41-0002-4a10-8b01-000000000002",
      "email": "signe.priede@rwrent.example",
      "firstName": "Signe",
      "lastName": "Priede",
      "phoneNumber": "+371 29 118 220",
      "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
      "status": 2,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [
        2
      ],
      "createdAtUtc": "2025-09-07T08:47:30.415516+00:00"
    },
    {
      "id": "9f2b7c41-0005-4a10-8b01-000000000005",
      "email": "toms.rudzitis@rwrent.example",
      "firstName": "Toms",
      "lastName": "Rudzitis",
      "phoneNumber": "+371 22 118 003",
      "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
      "status": 2,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [
        5,
        4
      ],
      "createdAtUtc": "2026-07-14T08:47:30.415516+00:00"
    },
    {
      "id": "9f2b7c41-0008-4a10-8b01-000000000008",
      "email": "zane.upite@example.com",
      "firstName": "Zane",
      "lastName": "Upite",
      "phoneNumber": "+371 20 330 118",
      "companyId": null,
      "status": 1,
      "emailConfirmed": false,
      "registrationExpiresAtUtc": "2026-09-27T12:47:30.415516+00:00",
      "effectiveRoles": [],
      "createdAtUtc": "2026-09-20T12:47:30.415516+00:00"
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 12,
  "totalPages": 1
};

/** The same directory as the Principal reads it: their own Company. */
export const directoryPrincipal: PagedResponse<ApplicationUserListItemResponse> = {
  "items": [
    {
      "id": "9f2b7c41-0010-4a10-8b01-000000000010",
      "email": "baiba.krastina@example.com",
      "firstName": "Baiba",
      "lastName": "Krastina",
      "phoneNumber": "+371 25 118 990",
      "companyId": null,
      "status": 5,
      "emailConfirmed": false,
      "registrationExpiresAtUtc": "2026-09-20T08:47:30.415516+00:00",
      "effectiveRoles": [],
      "createdAtUtc": "2026-09-13T08:47:30.415516+00:00"
    },
    {
      "id": "9f2b7c41-0004-4a10-8b01-000000000004",
      "email": "dita.smite@rwrent.example",
      "firstName": "Dita",
      "lastName": "Smite",
      "phoneNumber": "+371 25 007 441",
      "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
      "status": 2,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [
        3,
        4
      ],
      "createdAtUtc": "2026-04-15T08:47:30.415516+00:00"
    },
    {
      "id": "9f2b7c41-0007-4a10-8b01-000000000007",
      "email": "gatis.lapsa@example.com",
      "firstName": "Gatis",
      "lastName": "Lapsa",
      "phoneNumber": "+371 26 118 447",
      "companyId": null,
      "status": 1,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [],
      "createdAtUtc": "2026-09-20T02:47:30.415516+00:00"
    },
    {
      "id": "9f2b7c41-0009-4a10-8b01-000000000009",
      "email": "imants.gailis@example.com",
      "firstName": "Imants",
      "lastName": "Gailis",
      "phoneNumber": "+371 29 004 118",
      "companyId": null,
      "status": 4,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [],
      "createdAtUtc": "2026-09-08T08:47:30.415516+00:00"
    },
    {
      "id": "9f2b7c41-0003-4a10-8b01-000000000003",
      "email": "karlis.zvaigzne@rwrent.example",
      "firstName": "Karlis",
      "lastName": "Zvaigzne",
      "phoneNumber": "+371 26 440 118",
      "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
      "status": 2,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [
        3
      ],
      "createdAtUtc": "2026-02-24T08:47:30.415516+00:00"
    },
    {
      "id": "9f2b7c41-0006-4a10-8b01-000000000006",
      "email": "liga.brice@example.com",
      "firstName": "Liga",
      "lastName": "Brice",
      "phoneNumber": "+371 28 774 110",
      "companyId": null,
      "status": 1,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [],
      "createdAtUtc": "2026-09-21T02:47:30.415516+00:00"
    },
    {
      "id": "5925ec73-98b9-4f08-93c8-b9d54bf228df",
      "email": "outside.practice.bb86bb@example.com",
      "firstName": "Outside",
      "lastName": "Practice",
      "phoneNumber": "+371 20 000 909",
      "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
      "status": 2,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [
        4
      ],
      "createdAtUtc": "2026-09-22T08:47:33.981523+00:00"
    },
    {
      "id": "9f2b7c41-0011-4a10-8b01-000000000011",
      "email": "raivis.dumins@rwrent.example",
      "firstName": "Raivis",
      "lastName": "Dumins",
      "phoneNumber": "+371 22 447 118",
      "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
      "status": 3,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [],
      "createdAtUtc": "2026-01-15T08:47:30.415516+00:00"
    },
    {
      "id": "9f2b7c41-0002-4a10-8b01-000000000002",
      "email": "signe.priede@rwrent.example",
      "firstName": "Signe",
      "lastName": "Priede",
      "phoneNumber": "+371 29 118 220",
      "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
      "status": 2,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [
        2
      ],
      "createdAtUtc": "2025-09-07T08:47:30.415516+00:00"
    },
    {
      "id": "9f2b7c41-0005-4a10-8b01-000000000005",
      "email": "toms.rudzitis@rwrent.example",
      "firstName": "Toms",
      "lastName": "Rudzitis",
      "phoneNumber": "+371 22 118 003",
      "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
      "status": 2,
      "emailConfirmed": true,
      "registrationExpiresAtUtc": null,
      "effectiveRoles": [
        5,
        4
      ],
      "createdAtUtc": "2026-07-14T08:47:30.415516+00:00"
    },
    {
      "id": "9f2b7c41-0008-4a10-8b01-000000000008",
      "email": "zane.upite@example.com",
      "firstName": "Zane",
      "lastName": "Upite",
      "phoneNumber": "+371 20 330 118",
      "companyId": null,
      "status": 1,
      "emailConfirmed": false,
      "registrationExpiresAtUtc": "2026-09-27T12:47:30.415516+00:00",
      "effectiveRoles": [],
      "createdAtUtc": "2026-09-20T12:47:30.415516+00:00"
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 11,
  "totalPages": 1
};

/** The Principal’s attempt to give the role. */
export const principalRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/403",
  "title": "Forbidden",
  "status": 403,
  "detail": "The current user is not allowed to manage this role assignment.",
  "code": "roles.forbidden"
};

/** The grant to a Viewer whose address is outside the domain (outside.practice.bb86bb@example.com). */
export const outsideRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "The Record deleter role can be given only to a user whose email address is in the company's domain, rwrent.example.",
  "code": "roles.email_domain_not_allowed"
};

/** The grant on an installation without a domain. The scratch API has its domain set, so this refusal cannot be provoked there: the sentence is the backend’s own (RoleAssignmentErrors.cs), in the envelope the API gives the other conflict. */
export const notConfiguredRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "The Record deleter role cannot be given until the company's email domain is set: ApiSecurity:RecordDeleterEmailDomain is empty on this installation.",
  "code": "roles.email_domain_not_configured"
};

/** Toms’s email change to an address outside the domain while he holds the role. */
export const emailRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "While you hold the Record deleter role your email address must stay in the company's domain, rwrent.example.",
  "errors": {
    "NewEmail": [
      "While you hold the Record deleter role your email address must stay in the company's domain, rwrent.example."
    ]
  },
  "code": "email_change.outside_company_domain"
};

/** The Overview’s counts for a bare Record deleter: none he may read. */
export const overviewBare: OverviewSummaryResponse = {
  "activeAssignments": null,
  "plannedAssignments": null,
  "activeVehicles": null,
  "availableVehicles": null,
  "pendingRegistrations": null
};

/** The Delete records tabs’ counts for him (out of use). */
export const countsBare: RecordDeletionCandidateCountsResponse = {
  "rentalAssignments": 6,
  "driverAuthorizations": 2,
  "interruptions": 2,
  "vehicles": 2,
  "customers": 1,
  "drivers": 1
};

/** The vehicles a bare Record deleter finds on the page (out of use). */
export const candidatesVehiclesBare: PagedResponse<VehicleDeletionCandidateResponse> = {
  "items": [
    {
      "id": "1a5c8e30-0005-41a5-91a5-000000000005",
      "recordLabel": "881 GRT · Peugeot 308 SW 2021",
      "plateNumber": "881 GRT",
      "vinCode": "VF3LCYHZPKS881409",
      "make": "Peugeot",
      "model": "308 SW",
      "year": 2021,
      "isActive": false,
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 1,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0
        }
      }
    },
    {
      "id": "1a5c8e30-0008-41a5-91a5-000000000008",
      "recordLabel": "660 BYH · Fiat Tipo 2020",
      "plateNumber": "660 BYH",
      "vinCode": "ZFA33400006660301",
      "make": "Fiat",
      "model": "Tipo",
      "year": 2020,
      "isActive": false,
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 1,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0
        }
      }
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 2,
  "totalPages": 1
};

/** Recently deleted as he reads it, his own practice deletion first. */
export const deletionsBare: PagedResponse<RecordDeletionListItemResponse> = {
  "items": [
    {
      "auditEntryId": "90e8a995-9713-4f49-bea1-63b292bb715d",
      "occurredAtUtc": "2026-09-22T10:37:24.349979+00:00",
      "actorUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "actorDisplayName": "Toms Rudzitis",
      "kind": 4,
      "recordLabel": "F107CB41C · Practice Follow-up ten 2026",
      "reason": 2,
      "note": null
    },
    {
      "auditEntryId": "10de1d85-6fc5-41fb-87a2-7c9083cf0cb1",
      "occurredAtUtc": "2026-09-22T09:40:31.40552+00:00",
      "actorUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "actorDisplayName": "Toms Rudzitis",
      "kind": 4,
      "recordLabel": "R974B9B · Nine Probe 2021",
      "reason": 2,
      "note": null
    },
    {
      "auditEntryId": "f09f7141-b301-4c9b-ac92-ad756d7f1492",
      "occurredAtUtc": "2026-09-22T08:47:33.926169+00:00",
      "actorUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "actorDisplayName": "Toms Rudzitis",
      "kind": 4,
      "recordLabel": "R98B5B10 · Practice Round nine 2026",
      "reason": 2,
      "note": null
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 3,
  "totalPages": 1
};
