import type {
  CurrentUserResponse, DriverDeletionCandidateResponse, DriverListItemResponse, InsuranceCaseCountsResponse, InsuranceCaseDriverSuggestionQuery, InsuranceCaseDriverSuggestionResponse, InsuranceCaseLinkResponse, InsuranceCaseListItemResponse, InsuranceCaseResponse, PagedResponse, ProblemDetails, ValidationProblemDetails, VehicleDeletionCandidateResponse, VehicleListItemResponse,
} from '@/api/dto';

/**
 * Follow-up 17’s fixtures: the API’s answers exactly as it gave them on the scratch stack (port 5002,
 * round 12’s Release build, `rwrent_check` freshly seeded, 2026-09-27): the seeded people’s views of
 * the insurance cases, the counts, the seven cases’ pages, the dialogs’ lists and driver suggestions,
 * the refusals, and the deletions page’s vehicles and drivers. Typed as the DTOs, so a member the API
 * sends and `dto.ts` does not declare fails the typecheck. Only the tests import this module.
 *
 * The seed’s times are relative to the moment it was seeded, so the tests read them with the clock
 * set to `CAPTURED_AT`, when the answers were given.
 */

export const CAPTURED_AT = '2026-09-27T08:58:29.758138+00:00';

export const meDita: CurrentUserResponse = {
  "id": "9f2b7c41-0004-4a10-8b01-000000000004",
  "email": "dita.smite@rwrent.example",
  "firstName": "Dita",
  "lastName": "Smite",
  "phoneNumber": "+371 25 007 441",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "status": 2,
  "passwordChangedAtUtc": "2026-04-20T08:34:43.32608+00:00",
  "pendingEmail": null,
  "roles": [
    3,
    4
  ],
  "permissions": [
    "Company.Read",
    "Company.Update",
    "Customers.Manage",
    "Customers.Read",
    "DriverAuthorizations.Manage",
    "DriverAuthorizations.Read",
    "Drivers.Manage",
    "Drivers.Read",
    "InsuranceCases.Manage",
    "InsuranceCases.Read",
    "Interruptions.Manage",
    "Interruptions.Read",
    "RentalAssignments.Manage",
    "RentalAssignments.Read",
    "Tasks.Use",
    "Users.ActivateViewer",
    "Users.ManageRegistrations",
    "Users.ReadDirectory",
    "Users.ReviewRegistrations",
    "Vehicles.Manage",
    "Vehicles.Read"
  ]
};

export const meToms: CurrentUserResponse = {
  "id": "9f2b7c41-0005-4a10-8b01-000000000005",
  "email": "toms.rudzitis@rwrent.example",
  "firstName": "Toms",
  "lastName": "Rudzitis",
  "phoneNumber": "+371 22 118 003",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "status": 2,
  "passwordChangedAtUtc": "2026-07-19T08:34:43.32608+00:00",
  "pendingEmail": null,
  "roles": [
    4
  ],
  "permissions": [
    "Company.Read",
    "Customers.Read",
    "DriverAuthorizations.Read",
    "Drivers.Read",
    "InsuranceCases.Read",
    "Interruptions.Read",
    "RentalAssignments.Read",
    "Tasks.Use",
    "Users.ReadDirectory",
    "Vehicles.Read"
  ]
};

export const meSigne: CurrentUserResponse = {
  "id": "9f2b7c41-0002-4a10-8b01-000000000002",
  "email": "signe.priede@rwrent.example",
  "firstName": "Signe",
  "lastName": "Priede",
  "phoneNumber": "+371 29 118 220",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "status": 2,
  "passwordChangedAtUtc": "2025-09-12T08:34:43.32608+00:00",
  "pendingEmail": null,
  "roles": [
    2
  ],
  "permissions": [
    "Company.Read",
    "Company.Update",
    "Customers.Manage",
    "Customers.Read",
    "DriverAuthorizations.Manage",
    "DriverAuthorizations.Read",
    "Drivers.Manage",
    "Drivers.Read",
    "InsuranceCases.Manage",
    "InsuranceCases.Read",
    "Interruptions.Manage",
    "Interruptions.Read",
    "RentalAssignments.Manage",
    "RentalAssignments.Read",
    "Roles.ManageViewerFleetManager",
    "Roles.ReadHistory",
    "SecurityAudit.ReadCompany",
    "Sessions.ManageOrdinaryCompanyUsers",
    "Tasks.Use",
    "Users.ActivateFleetManager",
    "Users.ActivateViewer",
    "Users.CorrectName",
    "Users.ManageRegistrations",
    "Users.ReadDirectory",
    "Users.ReviewRegistrations",
    "Users.SuspendRestoreOrdinary",
    "Vehicles.Manage",
    "Vehicles.Read"
  ]
};

export const meAdmin: CurrentUserResponse = {
  "id": "9f2b7c41-0001-4a10-8b01-000000000001",
  "email": "sysadmin@rwrent.example",
  "firstName": "Arturs",
  "lastName": "Veidenbaums",
  "phoneNumber": "+371 29 000 001",
  "companyId": null,
  "status": 2,
  "passwordChangedAtUtc": "2025-08-23T08:34:43.32608+00:00",
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
    "InsuranceCases.Manage",
    "InsuranceCases.Read",
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

export const meKarlis: CurrentUserResponse = {
  "id": "9f2b7c41-0003-4a10-8b01-000000000003",
  "email": "karlis.zvaigzne@rwrent.example",
  "firstName": "Karlis",
  "lastName": "Zvaigzne",
  "phoneNumber": "+371 26 440 118",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "status": 2,
  "passwordChangedAtUtc": "2026-03-01T08:34:43.32608+00:00",
  "pendingEmail": null,
  "roles": [
    3
  ],
  "permissions": [
    "Company.Read",
    "Company.Update",
    "Customers.Manage",
    "Customers.Read",
    "DriverAuthorizations.Manage",
    "DriverAuthorizations.Read",
    "Drivers.Manage",
    "Drivers.Read",
    "InsuranceCases.Manage",
    "InsuranceCases.Read",
    "Interruptions.Manage",
    "Interruptions.Read",
    "RentalAssignments.Manage",
    "RentalAssignments.Read",
    "Tasks.Use",
    "Users.ActivateViewer",
    "Users.ManageRegistrations",
    "Users.ReadDirectory",
    "Users.ReviewRegistrations",
    "Vehicles.Manage",
    "Vehicles.Read"
  ]
};

export const countsDita: InsuranceCaseCountsResponse = {
  "open": 5,
  "waitingForUs": 2,
  "closed": 2
};

export const view1Dita: PagedResponse<InsuranceCaseListItemResponse> = {
  "items": [
    {
      "id": "c3e5a7b9-0003-4c3e-9c3e-000000000003",
      "type": 1,
      "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
      "vehiclePlate": "770 HDV",
      "damage": "Long scratches on both left doors",
      "happenedAtUtc": "2026-09-25T05:40:00+00:00",
      "timeIsWhenFound": true,
      "driverDisplayName": "Ilze Berzina",
      "ourInsurer": null,
      "ourClaimNumber": null,
      "otherInsurer": null,
      "otherClaimNumber": null,
      "handledBy": null,
      "status": 1,
      "waitingFor": 1,
      "waitingSinceUtc": "2026-09-25T06:15:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": null,
      "createdAtUtc": "2026-09-25T06:15:00+00:00"
    },
    {
      "id": "c3e5a7b9-0005-4c3e-9c3e-000000000005",
      "type": 2,
      "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
      "vehiclePlate": "482 TKL",
      "damage": "Front bumper and right headlight",
      "happenedAtUtc": "2026-09-22T14:50:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": "Kristine Vitola",
      "ourInsurer": "Baltic Mutual",
      "ourClaimNumber": "BM-26-05161",
      "otherInsurer": null,
      "otherClaimNumber": null,
      "handledBy": 1,
      "status": 2,
      "waitingFor": 1,
      "waitingSinceUtc": "2026-09-26T11:20:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Baltic Mutual asked for the mileage and photos of the damage",
        "happenedAtUtc": "2026-09-26T11:20:00+00:00"
      },
      "createdAtUtc": "2026-09-23T06:10:00+00:00"
    },
    {
      "id": "c3e5a7b9-0001-4c3e-9c3e-000000000001",
      "type": 1,
      "vehicleId": "1a5c8e30-0007-41a5-91a5-000000000007",
      "vehiclePlate": "552 KLM",
      "damage": "Rear bumper and boot lid dented",
      "happenedAtUtc": "2026-09-08T05:35:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": null,
      "ourInsurer": "Baltic Mutual",
      "ourClaimNumber": "BM-26-04417",
      "otherInsurer": "Meridian Insurance",
      "otherClaimNumber": "MI-2026-118305",
      "handledBy": 2,
      "status": 3,
      "waitingFor": 3,
      "waitingSinceUtc": "2026-09-20T11:40:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Everything is sent, Meridian is deciding",
        "happenedAtUtc": "2026-09-21T07:15:00+00:00"
      },
      "createdAtUtc": "2026-09-08T07:05:00+00:00"
    },
    {
      "id": "c3e5a7b9-0004-4c3e-9c3e-000000000004",
      "type": 1,
      "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
      "vehiclePlate": "482 TKL",
      "damage": "Front bumper and right headlight",
      "happenedAtUtc": "2026-09-22T14:50:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": "Kristine Vitola",
      "ourInsurer": "Baltic Mutual",
      "ourClaimNumber": "BM-26-05120",
      "otherInsurer": "Northgate Insurance",
      "otherClaimNumber": "NG-771204",
      "handledBy": 1,
      "status": 2,
      "waitingFor": 2,
      "waitingSinceUtc": "2026-09-26T08:15:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Asked Kristine Vitola for the account",
        "happenedAtUtc": "2026-09-26T08:15:00+00:00"
      },
      "createdAtUtc": "2026-09-22T15:30:00+00:00"
    },
    {
      "id": "c3e5a7b9-0002-4c3e-9c3e-000000000002",
      "type": 2,
      "vehicleId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "vehiclePlate": "204 JLM",
      "damage": "Windscreen cracked by a stone",
      "happenedAtUtc": "2026-09-26T10:25:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": "Anete Kalnina",
      "ourInsurer": "Baltic Mutual",
      "ourClaimNumber": "BM-26-05233",
      "otherInsurer": null,
      "otherClaimNumber": null,
      "handledBy": 1,
      "status": 4,
      "waitingFor": 4,
      "waitingSinceUtc": "2026-09-27T05:50:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Approved; the glass workshop replaces it tomorrow",
        "happenedAtUtc": "2026-09-27T05:50:00+00:00"
      },
      "createdAtUtc": "2026-09-26T11:35:00+00:00"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 5,
  "totalPages": 1
};

export const view2Dita: PagedResponse<InsuranceCaseListItemResponse> = {
  "items": [
    {
      "id": "c3e5a7b9-0003-4c3e-9c3e-000000000003",
      "type": 1,
      "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
      "vehiclePlate": "770 HDV",
      "damage": "Long scratches on both left doors",
      "happenedAtUtc": "2026-09-25T05:40:00+00:00",
      "timeIsWhenFound": true,
      "driverDisplayName": "Ilze Berzina",
      "ourInsurer": null,
      "ourClaimNumber": null,
      "otherInsurer": null,
      "otherClaimNumber": null,
      "handledBy": null,
      "status": 1,
      "waitingFor": 1,
      "waitingSinceUtc": "2026-09-25T06:15:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": null,
      "createdAtUtc": "2026-09-25T06:15:00+00:00"
    },
    {
      "id": "c3e5a7b9-0005-4c3e-9c3e-000000000005",
      "type": 2,
      "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
      "vehiclePlate": "482 TKL",
      "damage": "Front bumper and right headlight",
      "happenedAtUtc": "2026-09-22T14:50:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": "Kristine Vitola",
      "ourInsurer": "Baltic Mutual",
      "ourClaimNumber": "BM-26-05161",
      "otherInsurer": null,
      "otherClaimNumber": null,
      "handledBy": 1,
      "status": 2,
      "waitingFor": 1,
      "waitingSinceUtc": "2026-09-26T11:20:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Baltic Mutual asked for the mileage and photos of the damage",
        "happenedAtUtc": "2026-09-26T11:20:00+00:00"
      },
      "createdAtUtc": "2026-09-23T06:10:00+00:00"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 2,
  "totalPages": 1
};

export const view3Dita: PagedResponse<InsuranceCaseListItemResponse> = {
  "items": [
    {
      "id": "c3e5a7b9-0006-4c3e-9c3e-000000000006",
      "type": 1,
      "vehicleId": "1a5c8e30-0010-41a5-91a5-000000000010",
      "vehiclePlate": "400 NDP",
      "damage": "Right mirror broken by a passing van",
      "happenedAtUtc": "2026-08-28T09:15:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": "Laura Ozola",
      "ourInsurer": null,
      "ourClaimNumber": null,
      "otherInsurer": "Meridian Insurance",
      "otherClaimNumber": "MI-2026-109877",
      "handledBy": 2,
      "status": 5,
      "waitingFor": 5,
      "waitingSinceUtc": "2026-09-19T10:00:00+00:00",
      "closedAtUtc": "2026-09-19T10:00:00+00:00",
      "atFault": 2,
      "lastEvent": {
        "title": "Mirror replaced; Meridian paid the workshop",
        "happenedAtUtc": "2026-09-19T10:00:00+00:00"
      },
      "createdAtUtc": "2026-08-28T11:15:00+00:00"
    },
    {
      "id": "c3e5a7b9-0007-4c3e-9c3e-000000000007",
      "type": 1,
      "vehicleId": "1a5c8e30-0002-41a5-91a5-000000000002",
      "vehiclePlate": "119 MPR",
      "damage": "Rear door dented in a car park, the other car left",
      "happenedAtUtc": "2026-08-13T13:00:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": null,
      "ourInsurer": null,
      "ourClaimNumber": null,
      "otherInsurer": null,
      "otherClaimNumber": null,
      "handledBy": null,
      "status": 5,
      "waitingFor": 5,
      "waitingSinceUtc": "2026-09-07T11:00:00+00:00",
      "closedAtUtc": "2026-09-07T11:00:00+00:00",
      "atFault": 4,
      "lastEvent": {
        "title": "Repaired at our cost",
        "happenedAtUtc": "2026-09-07T11:00:00+00:00"
      },
      "createdAtUtc": "2026-08-14T06:20:00+00:00"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 2,
  "totalPages": 1
};

export const view1Toms: PagedResponse<InsuranceCaseListItemResponse> = {
  "items": [
    {
      "id": "c3e5a7b9-0003-4c3e-9c3e-000000000003",
      "type": 1,
      "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
      "vehiclePlate": "770 HDV",
      "damage": "Long scratches on both left doors",
      "happenedAtUtc": "2026-09-25T05:40:00+00:00",
      "timeIsWhenFound": true,
      "driverDisplayName": "Ilze Berzina",
      "ourInsurer": null,
      "ourClaimNumber": null,
      "otherInsurer": null,
      "otherClaimNumber": null,
      "handledBy": null,
      "status": 1,
      "waitingFor": 1,
      "waitingSinceUtc": "2026-09-25T06:15:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": null,
      "createdAtUtc": "2026-09-25T06:15:00+00:00"
    },
    {
      "id": "c3e5a7b9-0005-4c3e-9c3e-000000000005",
      "type": 2,
      "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
      "vehiclePlate": "482 TKL",
      "damage": "Front bumper and right headlight",
      "happenedAtUtc": "2026-09-22T14:50:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": "Kristine Vitola",
      "ourInsurer": "Baltic Mutual",
      "ourClaimNumber": "BM-26-05161",
      "otherInsurer": null,
      "otherClaimNumber": null,
      "handledBy": 1,
      "status": 2,
      "waitingFor": 1,
      "waitingSinceUtc": "2026-09-26T11:20:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Baltic Mutual asked for the mileage and photos of the damage",
        "happenedAtUtc": "2026-09-26T11:20:00+00:00"
      },
      "createdAtUtc": "2026-09-23T06:10:00+00:00"
    },
    {
      "id": "c3e5a7b9-0001-4c3e-9c3e-000000000001",
      "type": 1,
      "vehicleId": "1a5c8e30-0007-41a5-91a5-000000000007",
      "vehiclePlate": "552 KLM",
      "damage": "Rear bumper and boot lid dented",
      "happenedAtUtc": "2026-09-08T05:35:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": null,
      "ourInsurer": "Baltic Mutual",
      "ourClaimNumber": "BM-26-04417",
      "otherInsurer": "Meridian Insurance",
      "otherClaimNumber": "MI-2026-118305",
      "handledBy": 2,
      "status": 3,
      "waitingFor": 3,
      "waitingSinceUtc": "2026-09-20T11:40:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Everything is sent, Meridian is deciding",
        "happenedAtUtc": "2026-09-21T07:15:00+00:00"
      },
      "createdAtUtc": "2026-09-08T07:05:00+00:00"
    },
    {
      "id": "c3e5a7b9-0004-4c3e-9c3e-000000000004",
      "type": 1,
      "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
      "vehiclePlate": "482 TKL",
      "damage": "Front bumper and right headlight",
      "happenedAtUtc": "2026-09-22T14:50:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": "Kristine Vitola",
      "ourInsurer": "Baltic Mutual",
      "ourClaimNumber": "BM-26-05120",
      "otherInsurer": "Northgate Insurance",
      "otherClaimNumber": "NG-771204",
      "handledBy": 1,
      "status": 2,
      "waitingFor": 2,
      "waitingSinceUtc": "2026-09-26T08:15:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Asked Kristine Vitola for the account",
        "happenedAtUtc": "2026-09-26T08:15:00+00:00"
      },
      "createdAtUtc": "2026-09-22T15:30:00+00:00"
    },
    {
      "id": "c3e5a7b9-0002-4c3e-9c3e-000000000002",
      "type": 2,
      "vehicleId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "vehiclePlate": "204 JLM",
      "damage": "Windscreen cracked by a stone",
      "happenedAtUtc": "2026-09-26T10:25:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": "Anete Kalnina",
      "ourInsurer": "Baltic Mutual",
      "ourClaimNumber": "BM-26-05233",
      "otherInsurer": null,
      "otherClaimNumber": null,
      "handledBy": 1,
      "status": 4,
      "waitingFor": 4,
      "waitingSinceUtc": "2026-09-27T05:50:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Approved; the glass workshop replaces it tomorrow",
        "happenedAtUtc": "2026-09-27T05:50:00+00:00"
      },
      "createdAtUtc": "2026-09-26T11:35:00+00:00"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 5,
  "totalPages": 1
};

export const view1SearchZzz: PagedResponse<InsuranceCaseListItemResponse> = {
  "items": [],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 0,
  "totalPages": 0
};

export const view1Casco: PagedResponse<InsuranceCaseListItemResponse> = {
  "items": [
    {
      "id": "c3e5a7b9-0005-4c3e-9c3e-000000000005",
      "type": 2,
      "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
      "vehiclePlate": "482 TKL",
      "damage": "Front bumper and right headlight",
      "happenedAtUtc": "2026-09-22T14:50:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": "Kristine Vitola",
      "ourInsurer": "Baltic Mutual",
      "ourClaimNumber": "BM-26-05161",
      "otherInsurer": null,
      "otherClaimNumber": null,
      "handledBy": 1,
      "status": 2,
      "waitingFor": 1,
      "waitingSinceUtc": "2026-09-26T11:20:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Baltic Mutual asked for the mileage and photos of the damage",
        "happenedAtUtc": "2026-09-26T11:20:00+00:00"
      },
      "createdAtUtc": "2026-09-23T06:10:00+00:00"
    },
    {
      "id": "c3e5a7b9-0002-4c3e-9c3e-000000000002",
      "type": 2,
      "vehicleId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "vehiclePlate": "204 JLM",
      "damage": "Windscreen cracked by a stone",
      "happenedAtUtc": "2026-09-26T10:25:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": "Anete Kalnina",
      "ourInsurer": "Baltic Mutual",
      "ourClaimNumber": "BM-26-05233",
      "otherInsurer": null,
      "otherClaimNumber": null,
      "handledBy": 1,
      "status": 4,
      "waitingFor": 4,
      "waitingSinceUtc": "2026-09-27T05:50:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Approved; the glass workshop replaces it tomorrow",
        "happenedAtUtc": "2026-09-27T05:50:00+00:00"
      },
      "createdAtUtc": "2026-09-26T11:35:00+00:00"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 2,
  "totalPages": 1
};

export const view1Page2of2: PagedResponse<InsuranceCaseListItemResponse> = {
  "items": [
    {
      "id": "c3e5a7b9-0001-4c3e-9c3e-000000000001",
      "type": 1,
      "vehicleId": "1a5c8e30-0007-41a5-91a5-000000000007",
      "vehiclePlate": "552 KLM",
      "damage": "Rear bumper and boot lid dented",
      "happenedAtUtc": "2026-09-08T05:35:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": null,
      "ourInsurer": "Baltic Mutual",
      "ourClaimNumber": "BM-26-04417",
      "otherInsurer": "Meridian Insurance",
      "otherClaimNumber": "MI-2026-118305",
      "handledBy": 2,
      "status": 3,
      "waitingFor": 3,
      "waitingSinceUtc": "2026-09-20T11:40:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Everything is sent, Meridian is deciding",
        "happenedAtUtc": "2026-09-21T07:15:00+00:00"
      },
      "createdAtUtc": "2026-09-08T07:05:00+00:00"
    },
    {
      "id": "c3e5a7b9-0004-4c3e-9c3e-000000000004",
      "type": 1,
      "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
      "vehiclePlate": "482 TKL",
      "damage": "Front bumper and right headlight",
      "happenedAtUtc": "2026-09-22T14:50:00+00:00",
      "timeIsWhenFound": false,
      "driverDisplayName": "Kristine Vitola",
      "ourInsurer": "Baltic Mutual",
      "ourClaimNumber": "BM-26-05120",
      "otherInsurer": "Northgate Insurance",
      "otherClaimNumber": "NG-771204",
      "handledBy": 1,
      "status": 2,
      "waitingFor": 2,
      "waitingSinceUtc": "2026-09-26T08:15:00+00:00",
      "closedAtUtc": null,
      "atFault": null,
      "lastEvent": {
        "title": "Asked Kristine Vitola for the account",
        "happenedAtUtc": "2026-09-26T08:15:00+00:00"
      },
      "createdAtUtc": "2026-09-22T15:30:00+00:00"
    }
  ],
  "pageNumber": 2,
  "pageSize": 2,
  "totalCount": 5,
  "totalPages": 3
};

export const caseKlmDita: InsuranceCaseResponse = {
  "id": "c3e5a7b9-0001-4c3e-9c3e-000000000001",
  "type": 1,
  "vehicleId": "1a5c8e30-0007-41a5-91a5-000000000007",
  "vehiclePlate": "552 KLM",
  "vehicleLabel": "552 KLM · BMW 320d Touring",
  "damage": "Rear bumper and boot lid dented",
  "description": "Hit from behind at a crossing while waiting at the red light.",
  "happenedAtUtc": "2026-09-08T05:35:00+00:00",
  "timeIsWhenFound": false,
  "place": "Crossing of Pärnu mnt and Liivalaia, Tallinn",
  "placeIsWhereFound": false,
  "driverId": null,
  "driverDisplayName": null,
  "rental": {
    "rentalAssignmentId": "2d7b5c86-0003-42d7-92d7-000000000003",
    "customerDisplayName": "Nordwind Logistics",
    "startedAtUtc": "2026-08-28T08:34:43.32608+00:00",
    "closedAtUtc": null
  },
  "ourInsurer": "Baltic Mutual",
  "ourClaimNumber": "BM-26-04417",
  "otherInsurer": "Meridian Insurance",
  "otherClaimNumber": "MI-2026-118305",
  "handledBy": 2,
  "status": 3,
  "waitingFor": 3,
  "waitingSinceUtc": "2026-09-20T11:40:00+00:00",
  "closedAtUtc": null,
  "atFault": null,
  "sameAccidentCaseId": null,
  "sameAccidentCases": [],
  "photos": [
    {
      "id": "f6b8daec-0011-4f6b-9f6b-000000000011",
      "fileName": "IMG_2041.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2161,
      "createdAtUtc": "2026-09-08T07:05:00+00:00",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "f6b8daec-0012-4f6b-9f6b-000000000012",
      "fileName": "IMG_2042.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2161,
      "createdAtUtc": "2026-09-08T07:05:00+00:00",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "f6b8daec-0013-4f6b-9f6b-000000000013",
      "fileName": "IMG_2043.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2160,
      "createdAtUtc": "2026-09-08T07:05:00+00:00",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "f6b8daec-0014-4f6b-9f6b-000000000014",
      "fileName": "IMG_2044.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2160,
      "createdAtUtc": "2026-09-08T07:05:00+00:00",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "events": [
    {
      "id": "d4f6b8ca-0011-4d4f-9d4f-000000000011",
      "happenedAtUtc": "2026-09-09T08:20:00+00:00",
      "title": "Both drivers reported it on LKF.ee",
      "description": null,
      "statusChangedTo": 2,
      "waitingForChangedTo": 3,
      "photos": [],
      "createdAtUtc": "2026-09-09T08:38:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    },
    {
      "id": "d4f6b8ca-0012-4d4f-9d4f-000000000012",
      "happenedAtUtc": "2026-09-12T06:45:00+00:00",
      "title": "Meridian asked who drove and for photos of the damage",
      "description": "By email from the Meridian claims handler: the name of the driver and clear photos of the rear.",
      "statusChangedTo": null,
      "waitingForChangedTo": 1,
      "photos": [],
      "createdAtUtc": "2026-09-12T07:03:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    },
    {
      "id": "d4f6b8ca-0013-4d4f-9d4f-000000000013",
      "happenedAtUtc": "2026-09-13T07:30:00+00:00",
      "title": "Asked Nordwind for their driver’s account",
      "description": null,
      "statusChangedTo": null,
      "waitingForChangedTo": 2,
      "photos": [],
      "createdAtUtc": "2026-09-13T07:48:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    },
    {
      "id": "d4f6b8ca-0014-4d4f-9d4f-000000000014",
      "happenedAtUtc": "2026-09-15T12:10:00+00:00",
      "title": "Nordwind sent the account, forwarded to Meridian",
      "description": null,
      "statusChangedTo": null,
      "waitingForChangedTo": 3,
      "photos": [],
      "createdAtUtc": "2026-09-15T12:28:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    },
    {
      "id": "d4f6b8ca-0015-4d4f-9d4f-000000000015",
      "happenedAtUtc": "2026-09-18T06:05:00+00:00",
      "title": "Meridian asked for a repair calculation",
      "description": null,
      "statusChangedTo": null,
      "waitingForChangedTo": 1,
      "photos": [],
      "createdAtUtc": "2026-09-18T06:23:00+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede",
      "updatedAtUtc": null,
      "canCorrect": false
    },
    {
      "id": "d4f6b8ca-0016-4d4f-9d4f-000000000016",
      "happenedAtUtc": "2026-09-20T11:40:00+00:00",
      "title": "Car shown at the BMW dealer, calculation sent",
      "description": null,
      "statusChangedTo": null,
      "waitingForChangedTo": 3,
      "photos": [
        {
          "id": "f6b8daec-0015-4f6b-9f6b-000000000015",
          "fileName": "IMG_2107.jpg",
          "contentType": "image/png",
          "sizeInBytes": 2161,
          "createdAtUtc": "2026-09-20T11:58:00+00:00",
          "createdByDisplayName": "Dita Smite"
        },
        {
          "id": "f6b8daec-0016-4f6b-9f6b-000000000016",
          "fileName": "IMG_2108.jpg",
          "contentType": "image/png",
          "sizeInBytes": 2161,
          "createdAtUtc": "2026-09-20T11:58:00+00:00",
          "createdByDisplayName": "Dita Smite"
        }
      ],
      "createdAtUtc": "2026-09-20T11:58:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    },
    {
      "id": "d4f6b8ca-0017-4d4f-9d4f-000000000017",
      "happenedAtUtc": "2026-09-21T07:15:00+00:00",
      "title": "Everything is sent, Meridian is deciding",
      "description": null,
      "statusChangedTo": 3,
      "waitingForChangedTo": null,
      "photos": [],
      "createdAtUtc": "2026-09-21T07:33:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    }
  ],
  "notes": [
    {
      "id": "e5a7c9db-0012-4e5a-9e5a-000000000012",
      "text": "Meridian’s handler is on leave until next Monday.",
      "createdAtUtc": "2026-09-25T08:00:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    },
    {
      "id": "e5a7c9db-0011-4e5a-9e5a-000000000011",
      "text": "Under warranty until 2027, so the repair goes to the BMW dealer, not to Meridian’s list.",
      "createdAtUtc": "2026-09-19T13:20:00+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede",
      "updatedAtUtc": null,
      "canCorrect": false
    }
  ],
  "canChange": true,
  "concurrencyToken": "1b7dc1eb-0316-4013-89c7-d94d0d7ce011",
  "createdAtUtc": "2026-09-08T07:05:00+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-21T07:33:00+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const caseHdvDita: InsuranceCaseResponse = {
  "id": "c3e5a7b9-0003-4c3e-9c3e-000000000003",
  "type": 1,
  "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
  "vehiclePlate": "770 HDV",
  "vehicleLabel": "770 HDV · Audi A4",
  "damage": "Long scratches on both left doors",
  "description": null,
  "happenedAtUtc": "2026-09-25T05:40:00+00:00",
  "timeIsWhenFound": true,
  "place": "Car wash, Pärnu mnt 139, Tallinn",
  "placeIsWhereFound": true,
  "driverId": "6e1b3f72-0002-46e1-96e1-000000000002",
  "driverDisplayName": "Ilze Berzina",
  "rental": {
    "rentalAssignmentId": "2d7b5c86-0002-42d7-92d7-000000000002",
    "customerDisplayName": "Ilze Berzina",
    "startedAtUtc": "2026-09-23T08:34:43.32608+00:00",
    "closedAtUtc": null
  },
  "ourInsurer": null,
  "ourClaimNumber": null,
  "otherInsurer": null,
  "otherClaimNumber": null,
  "handledBy": null,
  "status": 1,
  "waitingFor": 1,
  "waitingSinceUtc": "2026-09-25T06:15:00+00:00",
  "closedAtUtc": null,
  "atFault": null,
  "sameAccidentCaseId": null,
  "sameAccidentCases": [],
  "photos": [
    {
      "id": "f6b8daec-0031-4f6b-9f6b-000000000031",
      "fileName": "IMG_0311.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2161,
      "createdAtUtc": "2026-09-25T06:15:00+00:00",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "f6b8daec-0032-4f6b-9f6b-000000000032",
      "fileName": "IMG_0312.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2161,
      "createdAtUtc": "2026-09-25T06:15:00+00:00",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "f6b8daec-0033-4f6b-9f6b-000000000033",
      "fileName": "IMG_0313.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2161,
      "createdAtUtc": "2026-09-25T06:15:00+00:00",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "events": [],
  "notes": [
    {
      "id": "e5a7c9db-0031-4e5a-9e5a-000000000031",
      "text": "Parked overnight on Mustamäe tee; no witnesses.",
      "createdAtUtc": "2026-09-25T06:20:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    }
  ],
  "canChange": true,
  "concurrencyToken": "afd43fe2-326e-4ad7-a055-b99bc0904a25",
  "createdAtUtc": "2026-09-25T06:15:00+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": null,
  "updatedByUserId": null,
  "updatedByDisplayName": null
};

export const caseTklUsualDita: InsuranceCaseResponse = {
  "id": "c3e5a7b9-0004-4c3e-9c3e-000000000004",
  "type": 1,
  "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
  "vehiclePlate": "482 TKL",
  "vehicleLabel": "482 TKL · Volkswagen Passat Variant",
  "damage": "Front bumper and right headlight",
  "description": "Neither driver accepted the blame.",
  "happenedAtUtc": "2026-09-22T14:50:00+00:00",
  "timeIsWhenFound": false,
  "place": "Crossing of Riia and Vanemuise, Tartu",
  "placeIsWhereFound": false,
  "driverId": "6e1b3f72-0004-46e1-96e1-000000000004",
  "driverDisplayName": "Kristine Vitola",
  "rental": {
    "rentalAssignmentId": "2d7b5c86-0001-4f60-9a06-000000000001",
    "customerDisplayName": "Baltic Freight Partners",
    "startedAtUtc": "2026-09-15T09:34:43.32608+00:00",
    "closedAtUtc": null
  },
  "ourInsurer": "Baltic Mutual",
  "ourClaimNumber": "BM-26-05120",
  "otherInsurer": "Northgate Insurance",
  "otherClaimNumber": "NG-771204",
  "handledBy": 1,
  "status": 2,
  "waitingFor": 2,
  "waitingSinceUtc": "2026-09-26T08:15:00+00:00",
  "closedAtUtc": null,
  "atFault": null,
  "sameAccidentCaseId": null,
  "sameAccidentCases": [
    {
      "id": "c3e5a7b9-0005-4c3e-9c3e-000000000005",
      "label": "482 TKL · Front bumper and right headlight",
      "type": 2,
      "status": 2
    }
  ],
  "photos": [],
  "events": [
    {
      "id": "d4f6b8ca-0041-4d4f-9d4f-000000000041",
      "happenedAtUtc": "2026-09-22T16:10:00+00:00",
      "title": "Reported to Baltic Mutual; the other driver reported to Northgate",
      "description": null,
      "statusChangedTo": 2,
      "waitingForChangedTo": 3,
      "photos": [],
      "createdAtUtc": "2026-09-22T16:28:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    },
    {
      "id": "d4f6b8ca-0042-4d4f-9d4f-000000000042",
      "happenedAtUtc": "2026-09-25T07:40:00+00:00",
      "title": "Baltic Mutual asked for a written account from our driver",
      "description": null,
      "statusChangedTo": null,
      "waitingForChangedTo": 1,
      "photos": [],
      "createdAtUtc": "2026-09-25T07:58:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    },
    {
      "id": "d4f6b8ca-0043-4d4f-9d4f-000000000043",
      "happenedAtUtc": "2026-09-26T08:15:00+00:00",
      "title": "Asked Kristine Vitola for the account",
      "description": null,
      "statusChangedTo": null,
      "waitingForChangedTo": 2,
      "photos": [],
      "createdAtUtc": "2026-09-26T08:33:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    }
  ],
  "notes": [],
  "canChange": true,
  "concurrencyToken": "03aabacc-1a55-48ea-b241-65aa07c5e27c",
  "createdAtUtc": "2026-09-22T15:30:00+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-26T08:33:00+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const caseTklCascoDita: InsuranceCaseResponse = {
  "id": "c3e5a7b9-0005-4c3e-9c3e-000000000005",
  "type": 2,
  "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
  "vehiclePlate": "482 TKL",
  "vehicleLabel": "482 TKL · Volkswagen Passat Variant",
  "damage": "Front bumper and right headlight",
  "description": null,
  "happenedAtUtc": "2026-09-22T14:50:00+00:00",
  "timeIsWhenFound": false,
  "place": "Crossing of Riia and Vanemuise, Tartu",
  "placeIsWhereFound": false,
  "driverId": "6e1b3f72-0004-46e1-96e1-000000000004",
  "driverDisplayName": "Kristine Vitola",
  "rental": {
    "rentalAssignmentId": "2d7b5c86-0001-4f60-9a06-000000000001",
    "customerDisplayName": "Baltic Freight Partners",
    "startedAtUtc": "2026-09-15T09:34:43.32608+00:00",
    "closedAtUtc": null
  },
  "ourInsurer": "Baltic Mutual",
  "ourClaimNumber": "BM-26-05161",
  "otherInsurer": null,
  "otherClaimNumber": null,
  "handledBy": 1,
  "status": 2,
  "waitingFor": 1,
  "waitingSinceUtc": "2026-09-26T11:20:00+00:00",
  "closedAtUtc": null,
  "atFault": null,
  "sameAccidentCaseId": "c3e5a7b9-0004-4c3e-9c3e-000000000004",
  "sameAccidentCases": [
    {
      "id": "c3e5a7b9-0004-4c3e-9c3e-000000000004",
      "label": "482 TKL · Front bumper and right headlight",
      "type": 1,
      "status": 2
    }
  ],
  "photos": [],
  "events": [
    {
      "id": "d4f6b8ca-0051-4d4f-9d4f-000000000051",
      "happenedAtUtc": "2026-09-23T06:30:00+00:00",
      "title": "Registered under casco to repair the car now",
      "description": null,
      "statusChangedTo": 2,
      "waitingForChangedTo": 3,
      "photos": [],
      "createdAtUtc": "2026-09-23T06:48:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    },
    {
      "id": "d4f6b8ca-0052-4d4f-9d4f-000000000052",
      "happenedAtUtc": "2026-09-26T11:20:00+00:00",
      "title": "Baltic Mutual asked for the mileage and photos of the damage",
      "description": null,
      "statusChangedTo": null,
      "waitingForChangedTo": 1,
      "photos": [],
      "createdAtUtc": "2026-09-26T11:38:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    }
  ],
  "notes": [
    {
      "id": "e5a7c9db-0051-4e5a-9e5a-000000000051",
      "text": "Deductible 500 euros.",
      "createdAtUtc": "2026-09-23T06:40:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    }
  ],
  "canChange": true,
  "concurrencyToken": "2b01321d-2a56-4b68-820f-964eac655c89",
  "createdAtUtc": "2026-09-23T06:10:00+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-26T11:38:00+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const caseJlmDita: InsuranceCaseResponse = {
  "id": "c3e5a7b9-0002-4c3e-9c3e-000000000002",
  "type": 2,
  "vehicleId": "1a5c8e30-0006-41a5-91a5-000000000006",
  "vehiclePlate": "204 JLM",
  "vehicleLabel": "204 JLM · Hyundai Kona Electric",
  "damage": "Windscreen cracked by a stone",
  "description": null,
  "happenedAtUtc": "2026-09-26T10:25:00+00:00",
  "timeIsWhenFound": false,
  "place": "Tallinn–Tartu road near Mäo",
  "placeIsWhereFound": false,
  "driverId": "6e1b3f72-0005-46e1-96e1-000000000005",
  "driverDisplayName": "Anete Kalnina",
  "rental": {
    "rentalAssignmentId": "2d7b5c86-0006-42d7-92d7-000000000006",
    "customerDisplayName": "Anete Kalnina",
    "startedAtUtc": "2026-09-25T08:34:43.32608+00:00",
    "closedAtUtc": null
  },
  "ourInsurer": "Baltic Mutual",
  "ourClaimNumber": "BM-26-05233",
  "otherInsurer": null,
  "otherClaimNumber": null,
  "handledBy": 1,
  "status": 4,
  "waitingFor": 4,
  "waitingSinceUtc": "2026-09-27T05:50:00+00:00",
  "closedAtUtc": null,
  "atFault": null,
  "sameAccidentCaseId": null,
  "sameAccidentCases": [],
  "photos": [
    {
      "id": "f6b8daec-0021-4f6b-9f6b-000000000021",
      "fileName": "IMG_5520.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2160,
      "createdAtUtc": "2026-09-26T11:35:00+00:00",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "f6b8daec-0022-4f6b-9f6b-000000000022",
      "fileName": "IMG_5521.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2160,
      "createdAtUtc": "2026-09-26T11:35:00+00:00",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "events": [
    {
      "id": "d4f6b8ca-0021-4d4f-9d4f-000000000021",
      "happenedAtUtc": "2026-09-26T14:30:00+00:00",
      "title": "Reported to Baltic Mutual under casco",
      "description": null,
      "statusChangedTo": 2,
      "waitingForChangedTo": 3,
      "photos": [],
      "createdAtUtc": "2026-09-26T14:48:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    },
    {
      "id": "d4f6b8ca-0022-4d4f-9d4f-000000000022",
      "happenedAtUtc": "2026-09-27T05:50:00+00:00",
      "title": "Approved; the glass workshop replaces it tomorrow",
      "description": null,
      "statusChangedTo": 4,
      "waitingForChangedTo": 4,
      "photos": [],
      "createdAtUtc": "2026-09-27T06:08:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    }
  ],
  "notes": [
    {
      "id": "e5a7c9db-0021-4e5a-9e5a-000000000021",
      "text": "Deductible 500 euros, paid at the workshop.",
      "createdAtUtc": "2026-09-27T06:05:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    }
  ],
  "canChange": true,
  "concurrencyToken": "6aeeee7a-195b-4db1-953d-c4ace5af6c1f",
  "createdAtUtc": "2026-09-26T11:35:00+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-27T06:08:00+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const caseNdpDita: InsuranceCaseResponse = {
  "id": "c3e5a7b9-0006-4c3e-9c3e-000000000006",
  "type": 1,
  "vehicleId": "1a5c8e30-0010-41a5-91a5-000000000010",
  "vehiclePlate": "400 NDP",
  "vehicleLabel": "400 NDP · Skoda Octavia",
  "damage": "Right mirror broken by a passing van",
  "description": null,
  "happenedAtUtc": "2026-08-28T09:15:00+00:00",
  "timeIsWhenFound": false,
  "place": "Narva mnt 7, Tallinn",
  "placeIsWhereFound": false,
  "driverId": "6e1b3f72-0007-46e1-96e1-000000000007",
  "driverDisplayName": "Laura Ozola",
  "rental": {
    "rentalAssignmentId": "2d7b5c86-0007-42d7-92d7-000000000007",
    "customerDisplayName": "Roberts Liepins",
    "startedAtUtc": "2026-08-18T08:34:43.32608+00:00",
    "closedAtUtc": "2026-09-17T08:34:43.32608+00:00"
  },
  "ourInsurer": null,
  "ourClaimNumber": null,
  "otherInsurer": "Meridian Insurance",
  "otherClaimNumber": "MI-2026-109877",
  "handledBy": 2,
  "status": 5,
  "waitingFor": 5,
  "waitingSinceUtc": "2026-09-19T10:00:00+00:00",
  "closedAtUtc": "2026-09-19T10:00:00+00:00",
  "atFault": 2,
  "sameAccidentCaseId": null,
  "sameAccidentCases": [],
  "photos": [
    {
      "id": "f6b8daec-0061-4f6b-9f6b-000000000061",
      "fileName": "IMG_7730.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2160,
      "createdAtUtc": "2026-08-28T11:15:00+00:00",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "events": [
    {
      "id": "d4f6b8ca-0061-4d4f-9d4f-000000000061",
      "happenedAtUtc": "2026-08-29T07:00:00+00:00",
      "title": "Both drivers reported it on LKF.ee",
      "description": null,
      "statusChangedTo": 2,
      "waitingForChangedTo": 3,
      "photos": [],
      "createdAtUtc": "2026-08-29T07:18:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    },
    {
      "id": "d4f6b8ca-0062-4d4f-9d4f-000000000062",
      "happenedAtUtc": "2026-09-07T12:30:00+00:00",
      "title": "Meridian decided the van driver was at fault",
      "description": null,
      "statusChangedTo": 4,
      "waitingForChangedTo": 4,
      "photos": [],
      "createdAtUtc": "2026-09-07T12:48:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    },
    {
      "id": "d4f6b8ca-0063-4d4f-9d4f-000000000063",
      "happenedAtUtc": "2026-09-19T10:00:00+00:00",
      "title": "Mirror replaced; Meridian paid the workshop",
      "description": null,
      "statusChangedTo": 5,
      "waitingForChangedTo": 5,
      "photos": [],
      "createdAtUtc": "2026-09-19T10:18:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    }
  ],
  "notes": [],
  "canChange": true,
  "concurrencyToken": "5d87aa43-ef00-4ba0-95a4-3e8795bead4c",
  "createdAtUtc": "2026-08-28T11:15:00+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-19T10:18:00+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const caseMprDita: InsuranceCaseResponse = {
  "id": "c3e5a7b9-0007-4c3e-9c3e-000000000007",
  "type": 1,
  "vehicleId": "1a5c8e30-0002-41a5-91a5-000000000002",
  "vehiclePlate": "119 MPR",
  "vehicleLabel": "119 MPR · Volvo XC60",
  "damage": "Rear door dented in a car park, the other car left",
  "description": null,
  "happenedAtUtc": "2026-08-13T13:00:00+00:00",
  "timeIsWhenFound": false,
  "place": "Car park, Ülemiste Centre, Tallinn",
  "placeIsWhereFound": false,
  "driverId": null,
  "driverDisplayName": null,
  "rental": {
    "rentalAssignmentId": "2d7b5c86-0008-42d7-92d7-000000000008",
    "customerDisplayName": "Baltic Freight Partners",
    "startedAtUtc": "2026-06-29T08:34:43.32608+00:00",
    "closedAtUtc": "2026-08-27T08:34:43.32608+00:00"
  },
  "ourInsurer": null,
  "ourClaimNumber": null,
  "otherInsurer": null,
  "otherClaimNumber": null,
  "handledBy": null,
  "status": 5,
  "waitingFor": 5,
  "waitingSinceUtc": "2026-09-07T11:00:00+00:00",
  "closedAtUtc": "2026-09-07T11:00:00+00:00",
  "atFault": 4,
  "sameAccidentCaseId": null,
  "sameAccidentCases": [],
  "photos": [],
  "events": [
    {
      "id": "d4f6b8ca-0071-4d4f-9d4f-000000000071",
      "happenedAtUtc": "2026-08-15T08:00:00+00:00",
      "title": "Nobody saw it; not worth the casco deductible",
      "description": null,
      "statusChangedTo": null,
      "waitingForChangedTo": null,
      "photos": [],
      "createdAtUtc": "2026-08-15T08:18:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    },
    {
      "id": "d4f6b8ca-0072-4d4f-9d4f-000000000072",
      "happenedAtUtc": "2026-09-07T11:00:00+00:00",
      "title": "Repaired at our cost",
      "description": null,
      "statusChangedTo": 5,
      "waitingForChangedTo": 5,
      "photos": [],
      "createdAtUtc": "2026-09-07T11:18:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    }
  ],
  "notes": [],
  "canChange": true,
  "concurrencyToken": "7d0b8d0f-eb1a-44a5-a419-04f029533d8c",
  "createdAtUtc": "2026-08-14T06:20:00+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-07T11:18:00+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const caseKlmToms: InsuranceCaseResponse = {
  "id": "c3e5a7b9-0001-4c3e-9c3e-000000000001",
  "type": 1,
  "vehicleId": "1a5c8e30-0007-41a5-91a5-000000000007",
  "vehiclePlate": "552 KLM",
  "vehicleLabel": "552 KLM · BMW 320d Touring",
  "damage": "Rear bumper and boot lid dented",
  "description": "Hit from behind at a crossing while waiting at the red light.",
  "happenedAtUtc": "2026-09-08T05:35:00+00:00",
  "timeIsWhenFound": false,
  "place": "Crossing of Pärnu mnt and Liivalaia, Tallinn",
  "placeIsWhereFound": false,
  "driverId": null,
  "driverDisplayName": null,
  "rental": {
    "rentalAssignmentId": "2d7b5c86-0003-42d7-92d7-000000000003",
    "customerDisplayName": "Nordwind Logistics",
    "startedAtUtc": "2026-08-28T08:34:43.32608+00:00",
    "closedAtUtc": null
  },
  "ourInsurer": "Baltic Mutual",
  "ourClaimNumber": "BM-26-04417",
  "otherInsurer": "Meridian Insurance",
  "otherClaimNumber": "MI-2026-118305",
  "handledBy": 2,
  "status": 3,
  "waitingFor": 3,
  "waitingSinceUtc": "2026-09-20T11:40:00+00:00",
  "closedAtUtc": null,
  "atFault": null,
  "sameAccidentCaseId": null,
  "sameAccidentCases": [],
  "photos": [
    {
      "id": "f6b8daec-0011-4f6b-9f6b-000000000011",
      "fileName": "IMG_2041.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2161,
      "createdAtUtc": "2026-09-08T07:05:00+00:00",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "f6b8daec-0012-4f6b-9f6b-000000000012",
      "fileName": "IMG_2042.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2161,
      "createdAtUtc": "2026-09-08T07:05:00+00:00",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "f6b8daec-0013-4f6b-9f6b-000000000013",
      "fileName": "IMG_2043.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2160,
      "createdAtUtc": "2026-09-08T07:05:00+00:00",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "f6b8daec-0014-4f6b-9f6b-000000000014",
      "fileName": "IMG_2044.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2160,
      "createdAtUtc": "2026-09-08T07:05:00+00:00",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "events": [
    {
      "id": "d4f6b8ca-0011-4d4f-9d4f-000000000011",
      "happenedAtUtc": "2026-09-09T08:20:00+00:00",
      "title": "Both drivers reported it on LKF.ee",
      "description": null,
      "statusChangedTo": 2,
      "waitingForChangedTo": 3,
      "photos": [],
      "createdAtUtc": "2026-09-09T08:38:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": false
    },
    {
      "id": "d4f6b8ca-0012-4d4f-9d4f-000000000012",
      "happenedAtUtc": "2026-09-12T06:45:00+00:00",
      "title": "Meridian asked who drove and for photos of the damage",
      "description": "By email from the Meridian claims handler: the name of the driver and clear photos of the rear.",
      "statusChangedTo": null,
      "waitingForChangedTo": 1,
      "photos": [],
      "createdAtUtc": "2026-09-12T07:03:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": false
    },
    {
      "id": "d4f6b8ca-0013-4d4f-9d4f-000000000013",
      "happenedAtUtc": "2026-09-13T07:30:00+00:00",
      "title": "Asked Nordwind for their driver’s account",
      "description": null,
      "statusChangedTo": null,
      "waitingForChangedTo": 2,
      "photos": [],
      "createdAtUtc": "2026-09-13T07:48:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": false
    },
    {
      "id": "d4f6b8ca-0014-4d4f-9d4f-000000000014",
      "happenedAtUtc": "2026-09-15T12:10:00+00:00",
      "title": "Nordwind sent the account, forwarded to Meridian",
      "description": null,
      "statusChangedTo": null,
      "waitingForChangedTo": 3,
      "photos": [],
      "createdAtUtc": "2026-09-15T12:28:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": false
    },
    {
      "id": "d4f6b8ca-0015-4d4f-9d4f-000000000015",
      "happenedAtUtc": "2026-09-18T06:05:00+00:00",
      "title": "Meridian asked for a repair calculation",
      "description": null,
      "statusChangedTo": null,
      "waitingForChangedTo": 1,
      "photos": [],
      "createdAtUtc": "2026-09-18T06:23:00+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede",
      "updatedAtUtc": null,
      "canCorrect": false
    },
    {
      "id": "d4f6b8ca-0016-4d4f-9d4f-000000000016",
      "happenedAtUtc": "2026-09-20T11:40:00+00:00",
      "title": "Car shown at the BMW dealer, calculation sent",
      "description": null,
      "statusChangedTo": null,
      "waitingForChangedTo": 3,
      "photos": [
        {
          "id": "f6b8daec-0015-4f6b-9f6b-000000000015",
          "fileName": "IMG_2107.jpg",
          "contentType": "image/png",
          "sizeInBytes": 2161,
          "createdAtUtc": "2026-09-20T11:58:00+00:00",
          "createdByDisplayName": "Dita Smite"
        },
        {
          "id": "f6b8daec-0016-4f6b-9f6b-000000000016",
          "fileName": "IMG_2108.jpg",
          "contentType": "image/png",
          "sizeInBytes": 2161,
          "createdAtUtc": "2026-09-20T11:58:00+00:00",
          "createdByDisplayName": "Dita Smite"
        }
      ],
      "createdAtUtc": "2026-09-20T11:58:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": false
    },
    {
      "id": "d4f6b8ca-0017-4d4f-9d4f-000000000017",
      "happenedAtUtc": "2026-09-21T07:15:00+00:00",
      "title": "Everything is sent, Meridian is deciding",
      "description": null,
      "statusChangedTo": 3,
      "waitingForChangedTo": null,
      "photos": [],
      "createdAtUtc": "2026-09-21T07:33:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": false
    }
  ],
  "notes": [
    {
      "id": "e5a7c9db-0012-4e5a-9e5a-000000000012",
      "text": "Meridian’s handler is on leave until next Monday.",
      "createdAtUtc": "2026-09-25T08:00:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": false
    },
    {
      "id": "e5a7c9db-0011-4e5a-9e5a-000000000011",
      "text": "Under warranty until 2027, so the repair goes to the BMW dealer, not to Meridian’s list.",
      "createdAtUtc": "2026-09-19T13:20:00+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede",
      "updatedAtUtc": null,
      "canCorrect": false
    }
  ],
  "canChange": false,
  "concurrencyToken": "1b7dc1eb-0316-4013-89c7-d94d0d7ce011",
  "createdAtUtc": "2026-09-08T07:05:00+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-21T07:33:00+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const caseKlmSigne: InsuranceCaseResponse = {
  "id": "c3e5a7b9-0001-4c3e-9c3e-000000000001",
  "type": 1,
  "vehicleId": "1a5c8e30-0007-41a5-91a5-000000000007",
  "vehiclePlate": "552 KLM",
  "vehicleLabel": "552 KLM · BMW 320d Touring",
  "damage": "Rear bumper and boot lid dented",
  "description": "Hit from behind at a crossing while waiting at the red light.",
  "happenedAtUtc": "2026-09-08T05:35:00+00:00",
  "timeIsWhenFound": false,
  "place": "Crossing of Pärnu mnt and Liivalaia, Tallinn",
  "placeIsWhereFound": false,
  "driverId": null,
  "driverDisplayName": null,
  "rental": {
    "rentalAssignmentId": "2d7b5c86-0003-42d7-92d7-000000000003",
    "customerDisplayName": "Nordwind Logistics",
    "startedAtUtc": "2026-08-28T08:34:43.32608+00:00",
    "closedAtUtc": null
  },
  "ourInsurer": "Baltic Mutual",
  "ourClaimNumber": "BM-26-04417",
  "otherInsurer": "Meridian Insurance",
  "otherClaimNumber": "MI-2026-118305",
  "handledBy": 2,
  "status": 3,
  "waitingFor": 3,
  "waitingSinceUtc": "2026-09-20T11:40:00+00:00",
  "closedAtUtc": null,
  "atFault": null,
  "sameAccidentCaseId": null,
  "sameAccidentCases": [],
  "photos": [
    {
      "id": "f6b8daec-0011-4f6b-9f6b-000000000011",
      "fileName": "IMG_2041.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2161,
      "createdAtUtc": "2026-09-08T07:05:00+00:00",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "f6b8daec-0012-4f6b-9f6b-000000000012",
      "fileName": "IMG_2042.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2161,
      "createdAtUtc": "2026-09-08T07:05:00+00:00",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "f6b8daec-0013-4f6b-9f6b-000000000013",
      "fileName": "IMG_2043.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2160,
      "createdAtUtc": "2026-09-08T07:05:00+00:00",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "f6b8daec-0014-4f6b-9f6b-000000000014",
      "fileName": "IMG_2044.jpg",
      "contentType": "image/png",
      "sizeInBytes": 2160,
      "createdAtUtc": "2026-09-08T07:05:00+00:00",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "events": [
    {
      "id": "d4f6b8ca-0011-4d4f-9d4f-000000000011",
      "happenedAtUtc": "2026-09-09T08:20:00+00:00",
      "title": "Both drivers reported it on LKF.ee",
      "description": null,
      "statusChangedTo": 2,
      "waitingForChangedTo": 3,
      "photos": [],
      "createdAtUtc": "2026-09-09T08:38:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": false
    },
    {
      "id": "d4f6b8ca-0012-4d4f-9d4f-000000000012",
      "happenedAtUtc": "2026-09-12T06:45:00+00:00",
      "title": "Meridian asked who drove and for photos of the damage",
      "description": "By email from the Meridian claims handler: the name of the driver and clear photos of the rear.",
      "statusChangedTo": null,
      "waitingForChangedTo": 1,
      "photos": [],
      "createdAtUtc": "2026-09-12T07:03:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": false
    },
    {
      "id": "d4f6b8ca-0013-4d4f-9d4f-000000000013",
      "happenedAtUtc": "2026-09-13T07:30:00+00:00",
      "title": "Asked Nordwind for their driver’s account",
      "description": null,
      "statusChangedTo": null,
      "waitingForChangedTo": 2,
      "photos": [],
      "createdAtUtc": "2026-09-13T07:48:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": false
    },
    {
      "id": "d4f6b8ca-0014-4d4f-9d4f-000000000014",
      "happenedAtUtc": "2026-09-15T12:10:00+00:00",
      "title": "Nordwind sent the account, forwarded to Meridian",
      "description": null,
      "statusChangedTo": null,
      "waitingForChangedTo": 3,
      "photos": [],
      "createdAtUtc": "2026-09-15T12:28:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": false
    },
    {
      "id": "d4f6b8ca-0015-4d4f-9d4f-000000000015",
      "happenedAtUtc": "2026-09-18T06:05:00+00:00",
      "title": "Meridian asked for a repair calculation",
      "description": null,
      "statusChangedTo": null,
      "waitingForChangedTo": 1,
      "photos": [],
      "createdAtUtc": "2026-09-18T06:23:00+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede",
      "updatedAtUtc": null,
      "canCorrect": true
    },
    {
      "id": "d4f6b8ca-0016-4d4f-9d4f-000000000016",
      "happenedAtUtc": "2026-09-20T11:40:00+00:00",
      "title": "Car shown at the BMW dealer, calculation sent",
      "description": null,
      "statusChangedTo": null,
      "waitingForChangedTo": 3,
      "photos": [
        {
          "id": "f6b8daec-0015-4f6b-9f6b-000000000015",
          "fileName": "IMG_2107.jpg",
          "contentType": "image/png",
          "sizeInBytes": 2161,
          "createdAtUtc": "2026-09-20T11:58:00+00:00",
          "createdByDisplayName": "Dita Smite"
        },
        {
          "id": "f6b8daec-0016-4f6b-9f6b-000000000016",
          "fileName": "IMG_2108.jpg",
          "contentType": "image/png",
          "sizeInBytes": 2161,
          "createdAtUtc": "2026-09-20T11:58:00+00:00",
          "createdByDisplayName": "Dita Smite"
        }
      ],
      "createdAtUtc": "2026-09-20T11:58:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": false
    },
    {
      "id": "d4f6b8ca-0017-4d4f-9d4f-000000000017",
      "happenedAtUtc": "2026-09-21T07:15:00+00:00",
      "title": "Everything is sent, Meridian is deciding",
      "description": null,
      "statusChangedTo": 3,
      "waitingForChangedTo": null,
      "photos": [],
      "createdAtUtc": "2026-09-21T07:33:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": false
    }
  ],
  "notes": [
    {
      "id": "e5a7c9db-0012-4e5a-9e5a-000000000012",
      "text": "Meridian’s handler is on leave until next Monday.",
      "createdAtUtc": "2026-09-25T08:00:00+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": false
    },
    {
      "id": "e5a7c9db-0011-4e5a-9e5a-000000000011",
      "text": "Under warranty until 2027, so the repair goes to the BMW dealer, not to Meridian’s list.",
      "createdAtUtc": "2026-09-19T13:20:00+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede",
      "updatedAtUtc": null,
      "canCorrect": true
    }
  ],
  "canChange": true,
  "concurrencyToken": "1b7dc1eb-0316-4013-89c7-d94d0d7ce011",
  "createdAtUtc": "2026-09-08T07:05:00+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-21T07:33:00+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const notFoundCase: ProblemDetails = {
  "type": "https://httpstatuses.com/404",
  "title": "Not Found",
  "status": 404,
  "detail": "This case no longer exists.",
  "code": "insurance_cases.not_found"
};

export const insurers: string[] = [
  "Baltic Mutual",
  "Meridian Insurance",
  "Northgate Insurance"
];

export const choicesNew: InsuranceCaseLinkResponse[] = [
  {
    "id": "c3e5a7b9-0002-4c3e-9c3e-000000000002",
    "label": "204 JLM · Windscreen cracked by a stone",
    "type": 2,
    "status": 4
  },
  {
    "id": "c3e5a7b9-0003-4c3e-9c3e-000000000003",
    "label": "770 HDV · Long scratches on both left doors",
    "type": 1,
    "status": 1
  },
  {
    "id": "c3e5a7b9-0005-4c3e-9c3e-000000000005",
    "label": "482 TKL · Front bumper and right headlight",
    "type": 2,
    "status": 2
  },
  {
    "id": "c3e5a7b9-0004-4c3e-9c3e-000000000004",
    "label": "482 TKL · Front bumper and right headlight",
    "type": 1,
    "status": 2
  },
  {
    "id": "c3e5a7b9-0001-4c3e-9c3e-000000000001",
    "label": "552 KLM · Rear bumper and boot lid dented",
    "type": 1,
    "status": 3
  },
  {
    "id": "c3e5a7b9-0006-4c3e-9c3e-000000000006",
    "label": "400 NDP · Right mirror broken by a passing van",
    "type": 1,
    "status": 5
  },
  {
    "id": "c3e5a7b9-0007-4c3e-9c3e-000000000007",
    "label": "119 MPR · Rear door dented in a car park, the other car left",
    "type": 1,
    "status": 5
  }
];

export const choicesKlm: InsuranceCaseLinkResponse[] = [
  {
    "id": "c3e5a7b9-0002-4c3e-9c3e-000000000002",
    "label": "204 JLM · Windscreen cracked by a stone",
    "type": 2,
    "status": 4
  },
  {
    "id": "c3e5a7b9-0003-4c3e-9c3e-000000000003",
    "label": "770 HDV · Long scratches on both left doors",
    "type": 1,
    "status": 1
  },
  {
    "id": "c3e5a7b9-0005-4c3e-9c3e-000000000005",
    "label": "482 TKL · Front bumper and right headlight",
    "type": 2,
    "status": 2
  },
  {
    "id": "c3e5a7b9-0004-4c3e-9c3e-000000000004",
    "label": "482 TKL · Front bumper and right headlight",
    "type": 1,
    "status": 2
  },
  {
    "id": "c3e5a7b9-0006-4c3e-9c3e-000000000006",
    "label": "400 NDP · Right mirror broken by a passing van",
    "type": 1,
    "status": 5
  },
  {
    "id": "c3e5a7b9-0007-4c3e-9c3e-000000000007",
    "label": "119 MPR · Rear door dented in a car park, the other car left",
    "type": 1,
    "status": 5
  }
];

export const pickVehicles: PagedResponse<VehicleListItemResponse> = {
  "items": [
    {
      "id": "1a5c8e30-0002-41a5-91a5-000000000002",
      "plateNumber": "119 MPR",
      "vinCode": "YV1DZ8156K1190334",
      "make": "Volvo",
      "model": "XC60",
      "year": 2024,
      "bodyType": 3,
      "fuelType": 4,
      "isActive": true,
      "availability": 1,
      "currentAssignmentId": null,
      "currentCustomerDisplayName": null,
      "upcomingAssignmentId": null,
      "upcomingCustomerDisplayName": null,
      "upcomingPlannedStartAtUtc": null
    },
    {
      "id": "1a5c8e30-0006-41a5-91a5-000000000006",
      "plateNumber": "204 JLM",
      "vinCode": "KMHK381CFNU204711",
      "make": "Hyundai",
      "model": "Kona Electric",
      "year": 2024,
      "bodyType": 3,
      "fuelType": 3,
      "isActive": true,
      "availability": 2,
      "currentAssignmentId": "2d7b5c86-0006-42d7-92d7-000000000006",
      "currentCustomerDisplayName": "Anete Kalnina",
      "upcomingAssignmentId": null,
      "upcomingCustomerDisplayName": null,
      "upcomingPlannedStartAtUtc": null
    },
    {
      "id": "1a5c8e30-0004-41a5-91a5-000000000004",
      "plateNumber": "335 SNB",
      "vinCode": "W1K2130421A335512",
      "make": "Mercedes-Benz",
      "model": "E 220 d",
      "year": 2023,
      "bodyType": 1,
      "fuelType": 2,
      "isActive": true,
      "availability": 3,
      "currentAssignmentId": null,
      "currentCustomerDisplayName": null,
      "upcomingAssignmentId": "2d7b5c86-0005-42d7-92d7-000000000005",
      "upcomingCustomerDisplayName": "Daugava Construction",
      "upcomingPlannedStartAtUtc": "2026-10-02T08:34:43.32608+00:00"
    },
    {
      "id": "1a5c8e30-0010-41a5-91a5-000000000010",
      "plateNumber": "400 NDP",
      "vinCode": "TMBJJ7NE4M4440801",
      "make": "Skoda",
      "model": "Octavia",
      "year": 2024,
      "bodyType": 2,
      "fuelType": 5,
      "isActive": true,
      "availability": 1,
      "currentAssignmentId": null,
      "currentCustomerDisplayName": null,
      "upcomingAssignmentId": null,
      "upcomingCustomerDisplayName": null,
      "upcomingPlannedStartAtUtc": null
    },
    {
      "id": "1a5c8e30-0009-41a5-91a5-000000000009",
      "plateNumber": "444 WKS",
      "vinCode": "SJNFAAF15U9174220",
      "make": "Nissan",
      "model": "Qashqai",
      "year": 2023,
      "bodyType": 3,
      "fuelType": 4,
      "isActive": true,
      "availability": 3,
      "currentAssignmentId": null,
      "currentCustomerDisplayName": null,
      "upcomingAssignmentId": "2d7b5c86-0004-42d7-92d7-000000000004",
      "upcomingCustomerDisplayName": "Martins Ozols",
      "upcomingPlannedStartAtUtc": "2026-09-29T08:34:43.32608+00:00"
    },
    {
      "id": "1a5c8e30-0001-41a5-91a5-000000000001",
      "plateNumber": "482 TKL",
      "vinCode": "WVWZZZ3CZKE004821",
      "make": "Volkswagen",
      "model": "Passat Variant",
      "year": 2023,
      "bodyType": 2,
      "fuelType": 2,
      "isActive": true,
      "availability": 2,
      "currentAssignmentId": "2d7b5c86-0001-4f60-9a06-000000000001",
      "currentCustomerDisplayName": "Baltic Freight Partners",
      "upcomingAssignmentId": null,
      "upcomingCustomerDisplayName": null,
      "upcomingPlannedStartAtUtc": null
    },
    {
      "id": "1a5c8e30-0007-41a5-91a5-000000000007",
      "plateNumber": "552 KLM",
      "vinCode": "WBA5R11009F552804",
      "make": "BMW",
      "model": "320d Touring",
      "year": 2022,
      "bodyType": 2,
      "fuelType": 2,
      "isActive": true,
      "availability": 2,
      "currentAssignmentId": "2d7b5c86-0003-42d7-92d7-000000000003",
      "currentCustomerDisplayName": "Nordwind Logistics",
      "upcomingAssignmentId": null,
      "upcomingCustomerDisplayName": null,
      "upcomingPlannedStartAtUtc": null
    },
    {
      "id": "1a5c8e30-0003-41a5-91a5-000000000003",
      "plateNumber": "770 HDV",
      "vinCode": "WAUZZZF23MN770211",
      "make": "Audi",
      "model": "A4",
      "year": 2022,
      "bodyType": 1,
      "fuelType": 2,
      "isActive": true,
      "availability": 2,
      "currentAssignmentId": "2d7b5c86-0002-42d7-92d7-000000000002",
      "currentCustomerDisplayName": "Ilze Berzina",
      "upcomingAssignmentId": null,
      "upcomingCustomerDisplayName": null,
      "upcomingPlannedStartAtUtc": null
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 8,
  "totalPages": 1
};

export const pickDrivers: PagedResponse<DriverListItemResponse> = {
  "items": [
    {
      "id": "6e1b3f72-0002-46e1-96e1-000000000002",
      "firstName": "Ilze",
      "lastName": "Berzina",
      "email": "ilze.berzina@example.com",
      "phoneNumber": "+371 29 441 208",
      "personalId": "110385-12043",
      "driverLicenseNumber": "LV-AB-201773",
      "address": "Vienibas gatve 87, Riga, LV-1004",
      "isActive": true
    },
    {
      "id": "6e1b3f72-0005-46e1-96e1-000000000005",
      "firstName": "Anete",
      "lastName": "Kalnina",
      "email": "anete.kalnina@example.com",
      "phoneNumber": "+371 28 330 447",
      "personalId": "020992-10774",
      "driverLicenseNumber": "LV-AE-118440",
      "address": "Talejas 6, Jurmala, LV-2015",
      "isActive": true
    },
    {
      "id": "6e1b3f72-0001-46e1-96e1-000000000001",
      "firstName": "Janis",
      "lastName": "Krumins",
      "email": "j.krumins@balticfreight.example",
      "phoneNumber": "+371 29 118 004",
      "personalId": "050381-10228",
      "driverLicenseNumber": "LV-AF-448120",
      "address": "Ropazu 14, Riga, LV-1039",
      "isActive": true
    },
    {
      "id": "6e1b3f72-0007-46e1-96e1-000000000007",
      "firstName": "Laura",
      "lastName": "Ozola",
      "email": "l.ozola@nordwind.example",
      "phoneNumber": "+371 20 118 774",
      "personalId": "300796-11220",
      "driverLicenseNumber": "LV-AG-772013",
      "address": "Cesu 12, Riga, LV-1012",
      "isActive": true
    },
    {
      "id": "6e1b3f72-0003-46e1-96e1-000000000003",
      "firstName": "Edgars",
      "lastName": "Sproģis",
      "email": "e.sprogis@nordwind.example",
      "phoneNumber": "+371 26 774 001",
      "personalId": "221177-11004",
      "driverLicenseNumber": "LV-AC-330219",
      "address": "Brivibas 188, Riga, LV-1012",
      "isActive": true
    },
    {
      "id": "6e1b3f72-0004-46e1-96e1-000000000004",
      "firstName": "Kristine",
      "lastName": "Vitola",
      "email": "k.vitola@daugavacon.example",
      "phoneNumber": "+371 25 330 118",
      "personalId": "081294-12210",
      "driverLicenseNumber": "LV-AD-559120",
      "address": "Slokas 42, Riga, LV-1048",
      "isActive": true
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 6,
  "totalPages": 1
};

/** 770 HDV at 2026-09-27T08:58:30Z */
export const suggestOne: InsuranceCaseDriverSuggestionResponse = {
  "situation": 3,
  "rental": {
    "vehiclePlate": "770 HDV",
    "rentalAssignmentId": "2d7b5c86-0002-42d7-92d7-000000000002",
    "customerDisplayName": "Ilze Berzina",
    "startedAtUtc": "2026-09-23T08:34:43.32608+00:00",
    "closedAtUtc": null
  },
  "drivers": [
    {
      "driverId": "6e1b3f72-0002-46e1-96e1-000000000002",
      "displayName": "Ilze Berzina"
    }
  ],
  "suggestedDriverId": "6e1b3f72-0002-46e1-96e1-000000000002"
};

/** 482 TKL at 2026-09-23T08:58:30Z */
export const suggestSeveral: InsuranceCaseDriverSuggestionResponse = {
  "situation": 4,
  "rental": {
    "vehiclePlate": "482 TKL",
    "rentalAssignmentId": "2d7b5c86-0001-4f60-9a06-000000000001",
    "customerDisplayName": "Baltic Freight Partners",
    "startedAtUtc": "2026-09-15T09:34:43.32608+00:00",
    "closedAtUtc": null
  },
  "drivers": [
    {
      "driverId": "6e1b3f72-0001-46e1-96e1-000000000001",
      "displayName": "Janis Krumins"
    },
    {
      "driverId": "6e1b3f72-0004-46e1-96e1-000000000004",
      "displayName": "Kristine Vitola"
    }
  ],
  "suggestedDriverId": null
};

/** 552 KLM at 2026-09-27T08:58:30Z */
export const suggestBusiness: InsuranceCaseDriverSuggestionResponse = {
  "situation": 2,
  "rental": {
    "vehiclePlate": "552 KLM",
    "rentalAssignmentId": "2d7b5c86-0003-42d7-92d7-000000000003",
    "customerDisplayName": "Nordwind Logistics",
    "startedAtUtc": "2026-08-28T08:34:43.32608+00:00",
    "closedAtUtc": null
  },
  "drivers": [],
  "suggestedDriverId": null
};

/** 444 WKS at 2026-09-27T08:58:30Z */
export const suggestNotRented: InsuranceCaseDriverSuggestionResponse = {
  "situation": 1,
  "rental": null,
  "drivers": [],
  "suggestedDriverId": null
};

/** 119 MPR at 2026-08-13T08:58:30Z */
export const suggestNobodyNamed: InsuranceCaseDriverSuggestionResponse = {
  "situation": 5,
  "rental": {
    "vehiclePlate": "119 MPR",
    "rentalAssignmentId": "2d7b5c86-0008-42d7-92d7-000000000008",
    "customerDisplayName": "Baltic Freight Partners",
    "startedAtUtc": "2026-06-29T08:34:43.32608+00:00",
    "closedAtUtc": "2026-08-27T08:34:43.32608+00:00"
  },
  "drivers": [],
  "suggestedDriverId": null
};

export const suggestionQueries: Record<string, InsuranceCaseDriverSuggestionQuery> = {
  "suggestOne": {
    "VehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
    "AtUtc": "2026-09-27T08:58:30Z"
  },
  "suggestSeveral": {
    "VehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
    "AtUtc": "2026-09-23T08:58:30Z"
  },
  "suggestBusiness": {
    "VehicleId": "1a5c8e30-0007-41a5-91a5-000000000007",
    "AtUtc": "2026-09-27T08:58:30Z"
  },
  "suggestNotRented": {
    "VehicleId": "1a5c8e30-0009-41a5-91a5-000000000009",
    "AtUtc": "2026-09-27T08:58:30Z"
  },
  "suggestNobodyNamed": {
    "VehicleId": "1a5c8e30-0002-41a5-91a5-000000000002",
    "AtUtc": "2026-08-13T08:58:30Z"
  }
};

export const registerEmptyRefusal: ValidationProblemDetails = {
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "VehicleId": [
      "Choose the car."
    ],
    "Damage": [
      "Say what is damaged."
    ],
    "HappenedAtUtc": [
      "Enter when it happened."
    ],
    "Place": [
      "Enter where it happened."
    ]
  }
};

export const registerFutureRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "The time cannot be in the future.",
  "errors": {
    "HappenedAtUtc": [
      "The time cannot be in the future."
    ]
  },
  "code": "insurance_cases.time_in_future"
};

export const registerHandlerRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "Choose an insurer that is filled in.",
  "errors": {
    "HandledBy": [
      "Choose an insurer that is filled in."
    ]
  },
  "code": "insurance_cases.handler_without_insurer"
};

export const registerNotAPictureRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "Only photos can be added: JPEG, PNG or WebP.",
  "errors": {
    "Photos[0]": [
      "Only photos can be added: JPEG, PNG or WebP."
    ]
  },
  "code": "insurance_cases.photo_not_a_picture"
};

export const eventBeforeCaseRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "An event cannot be before the case happened.",
  "errors": {
    "HappenedAtUtc": [
      "An event cannot be before the case happened."
    ]
  },
  "code": "insurance_cases.event_before_case"
};

export const changeOutOfOrderRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "A change of the status or of who the case waits for cannot be dated before the previous one.",
  "errors": {
    "HappenedAtUtc": [
      "A change of the status or of who the case waits for cannot be dated before the previous one."
    ]
  },
  "code": "insurance_cases.change_out_of_order"
};

export const staleTokenRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "The case changed concurrently. Retry the operation.",
  "code": "insurance_cases.concurrency_conflict"
};

export const caseAfterFirstEventRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "The case's time cannot be later than its first event.",
  "errors": {
    "HappenedAtUtc": [
      "The case's time cannot be later than its first event."
    ]
  },
  "code": "insurance_cases.case_after_first_event"
};

export const notYourEventRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/403",
  "title": "Forbidden",
  "status": 403,
  "detail": "Only the person who added this event can correct it.",
  "code": "insurance_cases.not_your_event"
};

export const notYourNoteRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/403",
  "title": "Forbidden",
  "status": 403,
  "detail": "Only the person who wrote this note can correct it.",
  "code": "insurance_cases.not_your_note"
};

export const noteEmptyRefusal: ValidationProblemDetails = {
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Text": [
      "Write the note."
    ]
  }
};

export const viewerWriteRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/403",
  "title": "Authorization failed.",
  "status": 403,
  "detail": "The authenticated user is not allowed to perform this operation.",
  "code": "authorization.forbidden"
};

export const deletionVehicles: PagedResponse<VehicleDeletionCandidateResponse> = {
  "items": [
    {
      "id": "1a5c8e30-0010-41a5-91a5-000000000010",
      "recordLabel": "400 NDP · Skoda Octavia 2024",
      "plateNumber": "400 NDP",
      "vinCode": "TMBJJ7NE4M4440801",
      "make": "Skoda",
      "model": "Octavia",
      "year": 2024,
      "isActive": true,
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 1,
          "driverAuthorizations": 1,
          "interruptions": 1,
          "customerLinksCleared": 0,
          "insuranceCases": 1,
          "insuranceCaseDriversCleared": 0
        }
      }
    },
    {
      "id": "1a5c8e30-0006-41a5-91a5-000000000006",
      "recordLabel": "204 JLM · Hyundai Kona Electric 2024",
      "plateNumber": "204 JLM",
      "vinCode": "KMHK381CFNU204711",
      "make": "Hyundai",
      "model": "Kona Electric",
      "year": 2024,
      "isActive": true,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 6,
            "count": 1,
            "records": [
              {
                "kind": 1,
                "id": "2d7b5c86-0006-42d7-92d7-000000000006",
                "label": "204 JLM · Anete Kalnina"
              }
            ]
          },
          {
            "reason": 8,
            "count": 1,
            "records": [
              {
                "kind": 7,
                "id": "c3e5a7b9-0002-4c3e-9c3e-000000000002",
                "label": "204 JLM · Windscreen cracked by a stone"
              }
            ]
          }
        ],
        "takes": {
          "rentalAssignments": 1,
          "driverAuthorizations": 1,
          "interruptions": 1,
          "customerLinksCleared": 0,
          "insuranceCases": 1,
          "insuranceCaseDriversCleared": 0
        }
      }
    },
    {
      "id": "1a5c8e30-0009-41a5-91a5-000000000009",
      "recordLabel": "444 WKS · Nissan Qashqai 2023",
      "plateNumber": "444 WKS",
      "vinCode": "SJNFAAF15U9174220",
      "make": "Nissan",
      "model": "Qashqai",
      "year": 2023,
      "isActive": true,
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 1,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0
        }
      }
    },
    {
      "id": "1a5c8e30-0004-41a5-91a5-000000000004",
      "recordLabel": "335 SNB · Mercedes-Benz E 220 d 2023",
      "plateNumber": "335 SNB",
      "vinCode": "W1K2130421A335512",
      "make": "Mercedes-Benz",
      "model": "E 220 d",
      "year": 2023,
      "isActive": true,
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 1,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0
        }
      }
    },
    {
      "id": "1a5c8e30-0002-41a5-91a5-000000000002",
      "recordLabel": "119 MPR · Volvo XC60 2024",
      "plateNumber": "119 MPR",
      "vinCode": "YV1DZ8156K1190334",
      "make": "Volvo",
      "model": "XC60",
      "year": 2024,
      "isActive": true,
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 1,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 1,
          "insuranceCaseDriversCleared": 0
        }
      }
    },
    {
      "id": "1a5c8e30-0001-41a5-91a5-000000000001",
      "recordLabel": "482 TKL · Volkswagen Passat Variant 2023",
      "plateNumber": "482 TKL",
      "vinCode": "WVWZZZ3CZKE004821",
      "make": "Volkswagen",
      "model": "Passat Variant",
      "year": 2023,
      "isActive": true,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 6,
            "count": 1,
            "records": [
              {
                "kind": 1,
                "id": "2d7b5c86-0001-4f60-9a06-000000000001",
                "label": "482 TKL · Baltic Freight Partners"
              }
            ]
          },
          {
            "reason": 8,
            "count": 2,
            "records": [
              {
                "kind": 7,
                "id": "c3e5a7b9-0005-4c3e-9c3e-000000000005",
                "label": "482 TKL · Front bumper and right headlight"
              },
              {
                "kind": 7,
                "id": "c3e5a7b9-0004-4c3e-9c3e-000000000004",
                "label": "482 TKL · Front bumper and right headlight"
              }
            ]
          }
        ],
        "takes": {
          "rentalAssignments": 2,
          "driverAuthorizations": 2,
          "interruptions": 1,
          "customerLinksCleared": 0,
          "insuranceCases": 2,
          "insuranceCaseDriversCleared": 0
        }
      }
    },
    {
      "id": "1a5c8e30-0007-41a5-91a5-000000000007",
      "recordLabel": "552 KLM · BMW 320d Touring 2022",
      "plateNumber": "552 KLM",
      "vinCode": "WBA5R11009F552804",
      "make": "BMW",
      "model": "320d Touring",
      "year": 2022,
      "isActive": true,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 6,
            "count": 1,
            "records": [
              {
                "kind": 1,
                "id": "2d7b5c86-0003-42d7-92d7-000000000003",
                "label": "552 KLM · Nordwind Logistics"
              }
            ]
          },
          {
            "reason": 8,
            "count": 1,
            "records": [
              {
                "kind": 7,
                "id": "c3e5a7b9-0001-4c3e-9c3e-000000000001",
                "label": "552 KLM · Rear bumper and boot lid dented"
              }
            ]
          }
        ],
        "takes": {
          "rentalAssignments": 1,
          "driverAuthorizations": 1,
          "interruptions": 1,
          "customerLinksCleared": 0,
          "insuranceCases": 1,
          "insuranceCaseDriversCleared": 0
        }
      }
    },
    {
      "id": "1a5c8e30-0003-41a5-91a5-000000000003",
      "recordLabel": "770 HDV · Audi A4 2022",
      "plateNumber": "770 HDV",
      "vinCode": "WAUZZZF23MN770211",
      "make": "Audi",
      "model": "A4",
      "year": 2022,
      "isActive": true,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 6,
            "count": 1,
            "records": [
              {
                "kind": 1,
                "id": "2d7b5c86-0002-42d7-92d7-000000000002",
                "label": "770 HDV · Ilze Berzina"
              }
            ]
          },
          {
            "reason": 8,
            "count": 1,
            "records": [
              {
                "kind": 7,
                "id": "c3e5a7b9-0003-4c3e-9c3e-000000000003",
                "label": "770 HDV · Long scratches on both left doors"
              }
            ]
          }
        ],
        "takes": {
          "rentalAssignments": 2,
          "driverAuthorizations": 1,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 1,
          "insuranceCaseDriversCleared": 0
        }
      }
    },
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
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0
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
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0
        }
      }
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 10,
  "totalPages": 1
};

export const deletionDrivers: PagedResponse<DriverDeletionCandidateResponse> = {
  "items": [
    {
      "id": "6e1b3f72-0007-46e1-96e1-000000000007",
      "recordLabel": "Laura Ozola · LV-AG-772013",
      "firstName": "Laura",
      "lastName": "Ozola",
      "email": "l.ozola@nordwind.example",
      "driverLicenseNumber": "LV-AG-772013",
      "isActive": true,
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 1,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 1
        }
      }
    },
    {
      "id": "6e1b3f72-0005-46e1-96e1-000000000005",
      "recordLabel": "Anete Kalnina · LV-AE-118440",
      "firstName": "Anete",
      "lastName": "Kalnina",
      "email": "anete.kalnina@example.com",
      "driverLicenseNumber": "LV-AE-118440",
      "isActive": true,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 7,
            "count": 1,
            "records": [
              {
                "kind": 1,
                "id": "2d7b5c86-0006-42d7-92d7-000000000006",
                "label": "204 JLM · Anete Kalnina"
              }
            ]
          }
        ],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 1,
          "interruptions": 0,
          "customerLinksCleared": 1,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 1
        }
      }
    },
    {
      "id": "6e1b3f72-0004-46e1-96e1-000000000004",
      "recordLabel": "Kristine Vitola · LV-AD-559120",
      "firstName": "Kristine",
      "lastName": "Vitola",
      "email": "k.vitola@daugavacon.example",
      "driverLicenseNumber": "LV-AD-559120",
      "isActive": true,
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 1,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 2
        }
      }
    },
    {
      "id": "6e1b3f72-0002-46e1-96e1-000000000002",
      "recordLabel": "Ilze Berzina · LV-AB-201773",
      "firstName": "Ilze",
      "lastName": "Berzina",
      "email": "ilze.berzina@example.com",
      "driverLicenseNumber": "LV-AB-201773",
      "isActive": true,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 7,
            "count": 1,
            "records": [
              {
                "kind": 1,
                "id": "2d7b5c86-0002-42d7-92d7-000000000002",
                "label": "770 HDV · Ilze Berzina"
              }
            ]
          }
        ],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 1,
          "interruptions": 0,
          "customerLinksCleared": 1,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 1
        }
      }
    },
    {
      "id": "6e1b3f72-0001-46e1-96e1-000000000001",
      "recordLabel": "Janis Krumins · LV-AF-448120",
      "firstName": "Janis",
      "lastName": "Krumins",
      "email": "j.krumins@balticfreight.example",
      "driverLicenseNumber": "LV-AF-448120",
      "isActive": true,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 7,
            "count": 1,
            "records": [
              {
                "kind": 1,
                "id": "2d7b5c86-0001-4f60-9a06-000000000001",
                "label": "482 TKL · Baltic Freight Partners"
              }
            ]
          }
        ],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 1,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0
        }
      }
    },
    {
      "id": "6e1b3f72-0003-46e1-96e1-000000000003",
      "recordLabel": "Edgars Sproģis · LV-AC-330219",
      "firstName": "Edgars",
      "lastName": "Sproģis",
      "email": "e.sprogis@nordwind.example",
      "driverLicenseNumber": "LV-AC-330219",
      "isActive": true,
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0
        }
      }
    },
    {
      "id": "6e1b3f72-0006-46e1-96e1-000000000006",
      "recordLabel": "Normunds Zarins · LV-AA-004471",
      "firstName": "Normunds",
      "lastName": "Zarins",
      "email": "n.zarins@example.com",
      "driverLicenseNumber": "LV-AA-004471",
      "isActive": false,
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0
        }
      }
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 7,
  "totalPages": 1
};

export const deleteCaseKindRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "An insurance case is deleted only together with its vehicle.",
  "errors": {
    "Kind": [
      "An insurance case is deleted only together with its vehicle."
    ]
  },
  "code": "record_deletions.kind_invalid"
};
