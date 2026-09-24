import type {
  CurrentUserResponse, CustomerListItemResponse, DriverListItemResponse, PagedResponse, ProblemDetails, RentalAssignmentListItemResponse, ValidationProblemDetails, VehicleListItemResponse, WorkTaskCountsResponse, WorkTaskListItemResponse, WorkTaskPersonResponse, WorkTaskResponse, WorkTaskToDoItemResponse,
} from '@/api/dto';

/**
 * Follow-up 12’s fixtures: the API’s answers exactly as it gave them on the scratch stack (port 5002,
 * round 10’s Release build, `rwrent_check` freshly seeded, 2026-09-24), during the joint check
 * (`Context/wiring_report.md` §4): the seeded people’s views, counts, to-do lists and tasks as each of
 * them reads them; the lists the dialog picks from; the refusals; and the answers of the joint check’s
 * writes on its practice tasks. Typed as the DTOs, so a member the API sends and `dto.ts` does not
 * declare fails the typecheck. Only the tests import this module.
 *
 * The seed’s times are relative to the moment it was seeded, so the tests read them with the clock
 * set to `CAPTURED_AT`, when the answers were given.
 */

export const CAPTURED_AT = '2026-09-24T10:11:46.546519+00:00';

/** Dita Smite, a Fleet Manager: the creator of four open tasks. */
export const meDita: CurrentUserResponse = {
  "id": "9f2b7c41-0004-4a10-8b01-000000000004",
  "email": "dita.smite@rwrent.example",
  "firstName": "Dita",
  "lastName": "Smite",
  "phoneNumber": "+371 25 007 441",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "status": 2,
  "passwordChangedAtUtc": "2026-04-17T10:08:58.762036+00:00",
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

/** Signe Priede, the Company Principal. */
export const meSigne: CurrentUserResponse = {
  "id": "9f2b7c41-0002-4a10-8b01-000000000002",
  "email": "signe.priede@rwrent.example",
  "firstName": "Signe",
  "lastName": "Priede",
  "phoneNumber": "+371 29 118 220",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "status": 2,
  "passwordChangedAtUtc": "2025-09-09T10:08:58.762036+00:00",
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

/** Toms Rudzitis, the Viewer: steps in three of Dita’s and Signe’s tasks, none of his own. */
export const meToms: CurrentUserResponse = {
  "id": "9f2b7c41-0005-4a10-8b01-000000000005",
  "email": "toms.rudzitis@rwrent.example",
  "firstName": "Toms",
  "lastName": "Rudzitis",
  "phoneNumber": "+371 22 118 003",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "status": 2,
  "passwordChangedAtUtc": "2026-07-16T10:08:58.762036+00:00",
  "pendingEmail": null,
  "roles": [
    4
  ],
  "permissions": [
    "Company.Read",
    "Customers.Read",
    "DriverAuthorizations.Read",
    "Drivers.Read",
    "Interruptions.Read",
    "RentalAssignments.Read",
    "Tasks.Use",
    "Users.ReadDirectory",
    "Vehicles.Read"
  ]
};

/** Karlis Zvaigzne, a Fleet Manager on no task. */
export const meKarlis: CurrentUserResponse = {
  "id": "9f2b7c41-0003-4a10-8b01-000000000003",
  "email": "karlis.zvaigzne@rwrent.example",
  "firstName": "Karlis",
  "lastName": "Zvaigzne",
  "phoneNumber": "+371 26 440 118",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "status": 2,
  "passwordChangedAtUtc": "2026-02-26T10:08:58.762036+00:00",
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

/** The administrator, Arturs Veidenbaums: every permission but Tasks.Use. */
export const meAdmin: CurrentUserResponse = {
  "id": "9f2b7c41-0001-4a10-8b01-000000000001",
  "email": "sysadmin@rwrent.example",
  "firstName": "Arturs",
  "lastName": "Veidenbaums",
  "phoneNumber": "+371 29 000 001",
  "companyId": null,
  "status": 2,
  "passwordChangedAtUtc": "2025-08-20T10:08:58.762036+00:00",
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

export const countsDita: WorkTaskCountsResponse = {
  "myTasks": 4,
  "involvingMe": 1,
  "finished": 1,
  "toDo": 4
};

export const todoDita: PagedResponse<WorkTaskToDoItemResponse> = {
  "items": [
    {
      "taskId": "a1d3f5b7-0002-4a1d-9a1d-000000000002",
      "stepId": null,
      "title": "Reassign the parking fine to the driver",
      "taskTitle": "Reassign the parking fine to the driver",
      "dueAtUtc": "2026-09-23T16:08:58.762036+00:00",
      "aboutKind": 4,
      "aboutLabel": "552 KLM · Nordwind Logistics",
      "aboutRecordExists": true,
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "taskId": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
      "stepId": "b2e4a6c8-0014-4b2e-9b2e-000000000014",
      "title": "Handover",
      "taskTitle": "Prepare 204 JLM for a rental",
      "dueAtUtc": "2026-09-27T13:08:58.762036+00:00",
      "aboutKind": 1,
      "aboutLabel": "204 JLM",
      "aboutRecordExists": true,
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "taskId": "a1d3f5b7-0005-4a1d-9a1d-000000000005",
      "stepId": "b2e4a6c8-0053-4b2e-9b2e-000000000053",
      "title": "Pick up the repair invoice",
      "taskTitle": "Handle the windscreen insurance case of 204 JLM",
      "dueAtUtc": "2026-10-04T17:08:58.762036+00:00",
      "aboutKind": 1,
      "aboutLabel": "204 JLM",
      "aboutRecordExists": true,
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    },
    {
      "taskId": "a1d3f5b7-0006-4a1d-9a1d-000000000006",
      "stepId": null,
      "title": "Order two spare key fobs",
      "taskTitle": "Order two spare key fobs",
      "dueAtUtc": null,
      "aboutKind": null,
      "aboutLabel": null,
      "aboutRecordExists": false,
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 4,
  "totalPages": 1
};

export const view1Dita: PagedResponse<WorkTaskListItemResponse> = {
  "items": [
    {
      "id": "a1d3f5b7-0002-4a1d-9a1d-000000000002",
      "title": "Reassign the parking fine to the driver",
      "status": 1,
      "dueAtUtc": "2026-09-23T16:08:58.762036+00:00",
      "closedAtUtc": null,
      "aboutKind": 4,
      "aboutRecordId": "2d7b5c86-0003-42d7-92d7-000000000003",
      "aboutLabel": "552 KLM · Nordwind Logistics",
      "aboutRecordExists": true,
      "stepCount": 0,
      "doneStepCount": 0,
      "people": [],
      "yourSteps": [],
      "viewerIsCreator": true,
      "createdAtUtc": "2026-09-21T11:10:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
      "title": "Prepare 204 JLM for a rental",
      "status": 1,
      "dueAtUtc": "2026-09-27T13:08:58.762036+00:00",
      "closedAtUtc": null,
      "aboutKind": 1,
      "aboutRecordId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "aboutLabel": "204 JLM",
      "aboutRecordExists": true,
      "stepCount": 4,
      "doneStepCount": 1,
      "people": [
        "Dita Smite",
        "Signe Priede",
        "Toms Rudzitis"
      ],
      "yourSteps": [
        {
          "id": "b2e4a6c8-0011-4b2e-9b2e-000000000011",
          "position": 1,
          "title": "Add to Bolt",
          "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
          "responsibleDisplayName": "Dita Smite",
          "dueAtUtc": null,
          "doneAtUtc": "2026-09-23T12:28:58.762036+00:00",
          "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
          "doneByDisplayName": "Dita Smite",
          "canMarkDone": false,
          "canUndo": true
        },
        {
          "id": "b2e4a6c8-0014-4b2e-9b2e-000000000014",
          "position": 4,
          "title": "Handover",
          "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
          "responsibleDisplayName": "Dita Smite",
          "dueAtUtc": "2026-09-27T13:08:58.762036+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": true,
      "createdAtUtc": "2026-09-22T10:22:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0006-4a1d-9a1d-000000000006",
      "title": "Order two spare key fobs",
      "status": 1,
      "dueAtUtc": null,
      "closedAtUtc": null,
      "aboutKind": null,
      "aboutRecordId": null,
      "aboutLabel": null,
      "aboutRecordExists": false,
      "stepCount": 0,
      "doneStepCount": 0,
      "people": [],
      "yourSteps": [],
      "viewerIsCreator": true,
      "createdAtUtc": "2026-09-23T10:13:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0004-4a1d-9a1d-000000000004",
      "title": "Book a service for 444 WKS and tell the driver",
      "status": 1,
      "dueAtUtc": null,
      "closedAtUtc": null,
      "aboutKind": 1,
      "aboutRecordId": "1a5c8e30-0009-41a5-91a5-000000000009",
      "aboutLabel": "444 WKS",
      "aboutRecordExists": true,
      "stepCount": 2,
      "doneStepCount": 1,
      "people": [
        "Dita Smite",
        "Toms Rudzitis"
      ],
      "yourSteps": [
        {
          "id": "b2e4a6c8-0041-4b2e-9b2e-000000000041",
          "position": 1,
          "title": "Book the service appointment",
          "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
          "responsibleDisplayName": "Dita Smite",
          "dueAtUtc": null,
          "doneAtUtc": "2026-09-22T11:13:58.762036+00:00",
          "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
          "doneByDisplayName": "Dita Smite",
          "canMarkDone": false,
          "canUndo": true
        }
      ],
      "viewerIsCreator": true,
      "createdAtUtc": "2026-09-20T09:58:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 4,
  "totalPages": 1
};

export const view2Dita: PagedResponse<WorkTaskListItemResponse> = {
  "items": [
    {
      "id": "a1d3f5b7-0005-4a1d-9a1d-000000000005",
      "title": "Handle the windscreen insurance case of 204 JLM",
      "status": 1,
      "dueAtUtc": "2026-10-04T17:08:58.762036+00:00",
      "closedAtUtc": null,
      "aboutKind": 1,
      "aboutRecordId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "aboutLabel": "204 JLM",
      "aboutRecordExists": true,
      "stepCount": 3,
      "doneStepCount": 2,
      "people": [
        "Toms Rudzitis",
        "Signe Priede",
        "Dita Smite"
      ],
      "yourSteps": [
        {
          "id": "b2e4a6c8-0053-4b2e-9b2e-000000000053",
          "position": 3,
          "title": "Pick up the repair invoice",
          "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
          "responsibleDisplayName": "Dita Smite",
          "dueAtUtc": null,
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-19T12:38:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1
};

export const view3Dita: PagedResponse<WorkTaskListItemResponse> = {
  "items": [
    {
      "id": "a1d3f5b7-0007-4a1d-9a1d-000000000007",
      "title": "Register 119 MPR in Bolt",
      "status": 2,
      "dueAtUtc": null,
      "closedAtUtc": "2026-09-22T17:10:58.762036+00:00",
      "aboutKind": 1,
      "aboutRecordId": "1a5c8e30-0002-41a5-91a5-000000000002",
      "aboutLabel": "119 MPR",
      "aboutRecordExists": true,
      "stepCount": 2,
      "doneStepCount": 2,
      "people": [
        "Dita Smite",
        "Signe Priede"
      ],
      "yourSteps": [
        {
          "id": "b2e4a6c8-0071-4b2e-9b2e-000000000071",
          "position": 1,
          "title": "Add to Bolt",
          "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
          "responsibleDisplayName": "Dita Smite",
          "dueAtUtc": null,
          "doneAtUtc": "2026-09-18T14:33:58.762036+00:00",
          "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
          "doneByDisplayName": "Dita Smite",
          "canMarkDone": false,
          "canUndo": false
        }
      ],
      "viewerIsCreator": true,
      "createdAtUtc": "2026-09-16T10:38:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1
};

export const countsSigne: WorkTaskCountsResponse = {
  "myTasks": 2,
  "involvingMe": 1,
  "finished": 2,
  "toDo": 2
};

export const todoSigne: PagedResponse<WorkTaskToDoItemResponse> = {
  "items": [
    {
      "taskId": "a1d3f5b7-0003-4a1d-9a1d-000000000003",
      "stepId": null,
      "title": "Prepare the rental agreement for Martins Ozols",
      "taskTitle": "Prepare the rental agreement for Martins Ozols",
      "dueAtUtc": "2026-09-24T18:08:58.762036+00:00",
      "aboutKind": 2,
      "aboutLabel": "Martins Ozols",
      "aboutRecordExists": true,
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    },
    {
      "taskId": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
      "stepId": "b2e4a6c8-0012-4b2e-9b2e-000000000012",
      "title": "Apply for the taxi licence",
      "taskTitle": "Prepare 204 JLM for a rental",
      "dueAtUtc": "2026-09-26T17:08:58.762036+00:00",
      "aboutKind": 1,
      "aboutLabel": "204 JLM",
      "aboutRecordExists": true,
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 2,
  "totalPages": 1
};

export const view1Signe: PagedResponse<WorkTaskListItemResponse> = {
  "items": [
    {
      "id": "a1d3f5b7-0003-4a1d-9a1d-000000000003",
      "title": "Prepare the rental agreement for Martins Ozols",
      "status": 1,
      "dueAtUtc": "2026-09-24T18:08:58.762036+00:00",
      "closedAtUtc": null,
      "aboutKind": 2,
      "aboutRecordId": "4d9f2a61-0004-44d9-94d9-000000000004",
      "aboutLabel": "Martins Ozols",
      "aboutRecordExists": true,
      "stepCount": 0,
      "doneStepCount": 0,
      "people": [],
      "yourSteps": [],
      "viewerIsCreator": true,
      "createdAtUtc": "2026-09-23T17:48:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    },
    {
      "id": "a1d3f5b7-0005-4a1d-9a1d-000000000005",
      "title": "Handle the windscreen insurance case of 204 JLM",
      "status": 1,
      "dueAtUtc": "2026-10-04T17:08:58.762036+00:00",
      "closedAtUtc": null,
      "aboutKind": 1,
      "aboutRecordId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "aboutLabel": "204 JLM",
      "aboutRecordExists": true,
      "stepCount": 3,
      "doneStepCount": 2,
      "people": [
        "Toms Rudzitis",
        "Signe Priede",
        "Dita Smite"
      ],
      "yourSteps": [
        {
          "id": "b2e4a6c8-0052-4b2e-9b2e-000000000052",
          "position": 2,
          "title": "Send the claim to the insurer",
          "responsibleUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
          "responsibleDisplayName": "Signe Priede",
          "dueAtUtc": null,
          "doneAtUtc": "2026-09-22T10:48:58.762036+00:00",
          "doneByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
          "doneByDisplayName": "Signe Priede",
          "canMarkDone": false,
          "canUndo": true
        }
      ],
      "viewerIsCreator": true,
      "createdAtUtc": "2026-09-19T12:38:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 2,
  "totalPages": 1
};

export const view2Signe: PagedResponse<WorkTaskListItemResponse> = {
  "items": [
    {
      "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
      "title": "Prepare 204 JLM for a rental",
      "status": 1,
      "dueAtUtc": "2026-09-27T13:08:58.762036+00:00",
      "closedAtUtc": null,
      "aboutKind": 1,
      "aboutRecordId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "aboutLabel": "204 JLM",
      "aboutRecordExists": true,
      "stepCount": 4,
      "doneStepCount": 1,
      "people": [
        "Dita Smite",
        "Signe Priede",
        "Toms Rudzitis"
      ],
      "yourSteps": [
        {
          "id": "b2e4a6c8-0012-4b2e-9b2e-000000000012",
          "position": 2,
          "title": "Apply for the taxi licence",
          "responsibleUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
          "responsibleDisplayName": "Signe Priede",
          "dueAtUtc": "2026-09-26T17:08:58.762036+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-22T10:22:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1
};

export const view3Signe: PagedResponse<WorkTaskListItemResponse> = {
  "items": [
    {
      "id": "a1d3f5b7-0007-4a1d-9a1d-000000000007",
      "title": "Register 119 MPR in Bolt",
      "status": 2,
      "dueAtUtc": null,
      "closedAtUtc": "2026-09-22T17:10:58.762036+00:00",
      "aboutKind": 1,
      "aboutRecordId": "1a5c8e30-0002-41a5-91a5-000000000002",
      "aboutLabel": "119 MPR",
      "aboutRecordExists": true,
      "stepCount": 2,
      "doneStepCount": 2,
      "people": [
        "Dita Smite",
        "Signe Priede"
      ],
      "yourSteps": [
        {
          "id": "b2e4a6c8-0072-4b2e-9b2e-000000000072",
          "position": 2,
          "title": "Apply for the taxi licence",
          "responsibleUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
          "responsibleDisplayName": "Signe Priede",
          "dueAtUtc": null,
          "doneAtUtc": "2026-09-21T12:56:58.762036+00:00",
          "doneByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
          "doneByDisplayName": "Signe Priede",
          "canMarkDone": false,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-16T10:38:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0008-4a1d-9a1d-000000000008",
      "title": "Prepare an agreement for Ventspils Marine Services",
      "status": 3,
      "dueAtUtc": null,
      "closedAtUtc": "2026-09-21T11:23:58.762036+00:00",
      "aboutKind": 2,
      "aboutRecordId": "4d9f2a61-0005-44d9-94d9-000000000005",
      "aboutLabel": "Ventspils Marine Services",
      "aboutRecordExists": true,
      "stepCount": 0,
      "doneStepCount": 0,
      "people": [],
      "yourSteps": [],
      "viewerIsCreator": true,
      "createdAtUtc": "2026-09-18T15:08:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 2,
  "totalPages": 1
};

export const countsToms: WorkTaskCountsResponse = {
  "myTasks": 0,
  "involvingMe": 3,
  "finished": 0,
  "toDo": 2
};

export const todoToms: PagedResponse<WorkTaskToDoItemResponse> = {
  "items": [
    {
      "taskId": "a1d3f5b7-0004-4a1d-9a1d-000000000004",
      "stepId": "b2e4a6c8-0042-4b2e-9b2e-000000000042",
      "title": "Tell the driver the time",
      "taskTitle": "Book a service for 444 WKS and tell the driver",
      "dueAtUtc": "2026-09-23T18:08:58.762036+00:00",
      "aboutKind": 1,
      "aboutLabel": "444 WKS",
      "aboutRecordExists": true,
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "taskId": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
      "stepId": "b2e4a6c8-0013-4b2e-9b2e-000000000013",
      "title": "Car wash",
      "taskTitle": "Prepare 204 JLM for a rental",
      "dueAtUtc": "2026-09-25T11:08:58.762036+00:00",
      "aboutKind": 1,
      "aboutLabel": "204 JLM",
      "aboutRecordExists": true,
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 2,
  "totalPages": 1
};

export const view1Toms: PagedResponse<WorkTaskListItemResponse> = {
  "items": [],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 0,
  "totalPages": 0
};

export const view2Toms: PagedResponse<WorkTaskListItemResponse> = {
  "items": [
    {
      "id": "a1d3f5b7-0004-4a1d-9a1d-000000000004",
      "title": "Book a service for 444 WKS and tell the driver",
      "status": 1,
      "dueAtUtc": null,
      "closedAtUtc": null,
      "aboutKind": 1,
      "aboutRecordId": "1a5c8e30-0009-41a5-91a5-000000000009",
      "aboutLabel": "444 WKS",
      "aboutRecordExists": true,
      "stepCount": 2,
      "doneStepCount": 1,
      "people": [
        "Dita Smite",
        "Toms Rudzitis"
      ],
      "yourSteps": [
        {
          "id": "b2e4a6c8-0042-4b2e-9b2e-000000000042",
          "position": 2,
          "title": "Tell the driver the time",
          "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "responsibleDisplayName": "Toms Rudzitis",
          "dueAtUtc": "2026-09-23T18:08:58.762036+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-20T09:58:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
      "title": "Prepare 204 JLM for a rental",
      "status": 1,
      "dueAtUtc": "2026-09-27T13:08:58.762036+00:00",
      "closedAtUtc": null,
      "aboutKind": 1,
      "aboutRecordId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "aboutLabel": "204 JLM",
      "aboutRecordExists": true,
      "stepCount": 4,
      "doneStepCount": 1,
      "people": [
        "Dita Smite",
        "Signe Priede",
        "Toms Rudzitis"
      ],
      "yourSteps": [
        {
          "id": "b2e4a6c8-0013-4b2e-9b2e-000000000013",
          "position": 3,
          "title": "Car wash",
          "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "responsibleDisplayName": "Toms Rudzitis",
          "dueAtUtc": "2026-09-25T11:08:58.762036+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-22T10:22:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0005-4a1d-9a1d-000000000005",
      "title": "Handle the windscreen insurance case of 204 JLM",
      "status": 1,
      "dueAtUtc": "2026-10-04T17:08:58.762036+00:00",
      "closedAtUtc": null,
      "aboutKind": 1,
      "aboutRecordId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "aboutLabel": "204 JLM",
      "aboutRecordExists": true,
      "stepCount": 3,
      "doneStepCount": 2,
      "people": [
        "Toms Rudzitis",
        "Signe Priede",
        "Dita Smite"
      ],
      "yourSteps": [
        {
          "id": "b2e4a6c8-0051-4b2e-9b2e-000000000051",
          "position": 1,
          "title": "Collect the photos",
          "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "responsibleDisplayName": "Toms Rudzitis",
          "dueAtUtc": null,
          "doneAtUtc": "2026-09-21T15:18:58.762036+00:00",
          "doneByUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "doneByDisplayName": "Toms Rudzitis",
          "canMarkDone": false,
          "canUndo": true
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-19T12:38:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 3,
  "totalPages": 1
};

export const view3Toms: PagedResponse<WorkTaskListItemResponse> = {
  "items": [],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 0,
  "totalPages": 0
};

export const peopleDita: WorkTaskPersonResponse[] = [
  {
    "userId": "9f2b7c41-0004-4a10-8b01-000000000004",
    "displayName": "Dita Smite"
  },
  {
    "userId": "9f2b7c41-0003-4a10-8b01-000000000003",
    "displayName": "Karlis Zvaigzne"
  },
  {
    "userId": "9f2b7c41-0002-4a10-8b01-000000000002",
    "displayName": "Signe Priede"
  },
  {
    "userId": "9f2b7c41-0005-4a10-8b01-000000000005",
    "displayName": "Toms Rudzitis"
  }
];

export const adminCountsRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/403",
  "title": "Authorization failed.",
  "status": 403,
  "detail": "The authenticated user is not allowed to perform this operation.",
  "code": "authorization.forbidden"
};

export const view1DitaSearchZzz: PagedResponse<WorkTaskListItemResponse> = {
  "items": [],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 0,
  "totalPages": 0
};

export const view1DitaOverdue: PagedResponse<WorkTaskListItemResponse> = {
  "items": [
    {
      "id": "a1d3f5b7-0002-4a1d-9a1d-000000000002",
      "title": "Reassign the parking fine to the driver",
      "status": 1,
      "dueAtUtc": "2026-09-23T16:08:58.762036+00:00",
      "closedAtUtc": null,
      "aboutKind": 4,
      "aboutRecordId": "2d7b5c86-0003-42d7-92d7-000000000003",
      "aboutLabel": "552 KLM · Nordwind Logistics",
      "aboutRecordExists": true,
      "stepCount": 0,
      "doneStepCount": 0,
      "people": [],
      "yourSteps": [],
      "viewerIsCreator": true,
      "createdAtUtc": "2026-09-21T11:10:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1
};

export const taskPrepareDita: WorkTaskResponse = {
  "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
  "title": "Prepare 204 JLM for a rental",
  "description": "Adding it to Bolt comes first. The car wash can happen any time before the handover.",
  "dueAtUtc": "2026-09-27T13:08:58.762036+00:00",
  "status": 1,
  "closedAtUtc": null,
  "cancellationNote": null,
  "aboutKind": 1,
  "aboutRecordId": "1a5c8e30-0006-41a5-91a5-000000000006",
  "aboutLabel": "204 JLM",
  "aboutRecordExists": true,
  "stepCount": 4,
  "doneStepCount": 1,
  "steps": [
    {
      "id": "b2e4a6c8-0011-4b2e-9b2e-000000000011",
      "position": 1,
      "title": "Add to Bolt",
      "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "responsibleDisplayName": "Dita Smite",
      "dueAtUtc": null,
      "doneAtUtc": "2026-09-23T12:28:58.762036+00:00",
      "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "doneByDisplayName": "Dita Smite",
      "canMarkDone": false,
      "canUndo": true
    },
    {
      "id": "b2e4a6c8-0012-4b2e-9b2e-000000000012",
      "position": 2,
      "title": "Apply for the taxi licence",
      "responsibleUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "responsibleDisplayName": "Signe Priede",
      "dueAtUtc": "2026-09-26T17:08:58.762036+00:00",
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": true,
      "canUndo": false
    },
    {
      "id": "b2e4a6c8-0013-4b2e-9b2e-000000000013",
      "position": 3,
      "title": "Car wash",
      "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "responsibleDisplayName": "Toms Rudzitis",
      "dueAtUtc": "2026-09-25T11:08:58.762036+00:00",
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": true,
      "canUndo": false
    },
    {
      "id": "b2e4a6c8-0014-4b2e-9b2e-000000000014",
      "position": 4,
      "title": "Handover",
      "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "responsibleDisplayName": "Dita Smite",
      "dueAtUtc": "2026-09-27T13:08:58.762036+00:00",
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": true,
      "canUndo": false
    }
  ],
  "viewerIsCreator": true,
  "canChange": true,
  "concurrencyToken": "d8a19c6f-eea4-4628-bc11-d79e9f9edd2f",
  "createdAtUtc": "2026-09-22T10:22:58.762036+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-23T12:28:58.762036+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const taskPrepareToms: WorkTaskResponse = {
  "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
  "title": "Prepare 204 JLM for a rental",
  "description": "Adding it to Bolt comes first. The car wash can happen any time before the handover.",
  "dueAtUtc": "2026-09-27T13:08:58.762036+00:00",
  "status": 1,
  "closedAtUtc": null,
  "cancellationNote": null,
  "aboutKind": 1,
  "aboutRecordId": "1a5c8e30-0006-41a5-91a5-000000000006",
  "aboutLabel": "204 JLM",
  "aboutRecordExists": true,
  "stepCount": 4,
  "doneStepCount": 1,
  "steps": [
    {
      "id": "b2e4a6c8-0011-4b2e-9b2e-000000000011",
      "position": 1,
      "title": "Add to Bolt",
      "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "responsibleDisplayName": "Dita Smite",
      "dueAtUtc": null,
      "doneAtUtc": "2026-09-23T12:28:58.762036+00:00",
      "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "doneByDisplayName": "Dita Smite",
      "canMarkDone": false,
      "canUndo": false
    },
    {
      "id": "b2e4a6c8-0012-4b2e-9b2e-000000000012",
      "position": 2,
      "title": "Apply for the taxi licence",
      "responsibleUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "responsibleDisplayName": "Signe Priede",
      "dueAtUtc": "2026-09-26T17:08:58.762036+00:00",
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": false,
      "canUndo": false
    },
    {
      "id": "b2e4a6c8-0013-4b2e-9b2e-000000000013",
      "position": 3,
      "title": "Car wash",
      "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "responsibleDisplayName": "Toms Rudzitis",
      "dueAtUtc": "2026-09-25T11:08:58.762036+00:00",
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": true,
      "canUndo": false
    },
    {
      "id": "b2e4a6c8-0014-4b2e-9b2e-000000000014",
      "position": 4,
      "title": "Handover",
      "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "responsibleDisplayName": "Dita Smite",
      "dueAtUtc": "2026-09-27T13:08:58.762036+00:00",
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": false,
      "canUndo": false
    }
  ],
  "viewerIsCreator": false,
  "canChange": false,
  "concurrencyToken": "d8a19c6f-eea4-4628-bc11-d79e9f9edd2f",
  "createdAtUtc": "2026-09-22T10:22:58.762036+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-23T12:28:58.762036+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const taskPrepareSigne: WorkTaskResponse = {
  "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
  "title": "Prepare 204 JLM for a rental",
  "description": "Adding it to Bolt comes first. The car wash can happen any time before the handover.",
  "dueAtUtc": "2026-09-27T13:08:58.762036+00:00",
  "status": 1,
  "closedAtUtc": null,
  "cancellationNote": null,
  "aboutKind": 1,
  "aboutRecordId": "1a5c8e30-0006-41a5-91a5-000000000006",
  "aboutLabel": "204 JLM",
  "aboutRecordExists": true,
  "stepCount": 4,
  "doneStepCount": 1,
  "steps": [
    {
      "id": "b2e4a6c8-0011-4b2e-9b2e-000000000011",
      "position": 1,
      "title": "Add to Bolt",
      "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "responsibleDisplayName": "Dita Smite",
      "dueAtUtc": null,
      "doneAtUtc": "2026-09-23T12:28:58.762036+00:00",
      "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "doneByDisplayName": "Dita Smite",
      "canMarkDone": false,
      "canUndo": false
    },
    {
      "id": "b2e4a6c8-0012-4b2e-9b2e-000000000012",
      "position": 2,
      "title": "Apply for the taxi licence",
      "responsibleUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "responsibleDisplayName": "Signe Priede",
      "dueAtUtc": "2026-09-26T17:08:58.762036+00:00",
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": true,
      "canUndo": false
    },
    {
      "id": "b2e4a6c8-0013-4b2e-9b2e-000000000013",
      "position": 3,
      "title": "Car wash",
      "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "responsibleDisplayName": "Toms Rudzitis",
      "dueAtUtc": "2026-09-25T11:08:58.762036+00:00",
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": false,
      "canUndo": false
    },
    {
      "id": "b2e4a6c8-0014-4b2e-9b2e-000000000014",
      "position": 4,
      "title": "Handover",
      "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "responsibleDisplayName": "Dita Smite",
      "dueAtUtc": "2026-09-27T13:08:58.762036+00:00",
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": false,
      "canUndo": false
    }
  ],
  "viewerIsCreator": false,
  "canChange": false,
  "concurrencyToken": "d8a19c6f-eea4-4628-bc11-d79e9f9edd2f",
  "createdAtUtc": "2026-09-22T10:22:58.762036+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-23T12:28:58.762036+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const taskFobsDita: WorkTaskResponse = {
  "id": "a1d3f5b7-0006-4a1d-9a1d-000000000006",
  "title": "Order two spare key fobs",
  "description": null,
  "dueAtUtc": null,
  "status": 1,
  "closedAtUtc": null,
  "cancellationNote": null,
  "aboutKind": null,
  "aboutRecordId": null,
  "aboutLabel": null,
  "aboutRecordExists": false,
  "stepCount": 0,
  "doneStepCount": 0,
  "steps": [],
  "viewerIsCreator": true,
  "canChange": true,
  "concurrencyToken": "c366b092-748d-4c42-a495-3723d533a687",
  "createdAtUtc": "2026-09-23T10:13:58.762036+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": null,
  "updatedByUserId": null,
  "updatedByDisplayName": null
};

export const taskFineDita: WorkTaskResponse = {
  "id": "a1d3f5b7-0002-4a1d-9a1d-000000000002",
  "title": "Reassign the parking fine to the driver",
  "description": "Fine from Riga City Police, issued while the car was with Nordwind Logistics.",
  "dueAtUtc": "2026-09-23T16:08:58.762036+00:00",
  "status": 1,
  "closedAtUtc": null,
  "cancellationNote": null,
  "aboutKind": 4,
  "aboutRecordId": "2d7b5c86-0003-42d7-92d7-000000000003",
  "aboutLabel": "552 KLM · Nordwind Logistics",
  "aboutRecordExists": true,
  "stepCount": 0,
  "doneStepCount": 0,
  "steps": [],
  "viewerIsCreator": true,
  "canChange": true,
  "concurrencyToken": "da5fc463-ba0d-4e1e-8d5a-b2fc63aeac50",
  "createdAtUtc": "2026-09-21T11:10:58.762036+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": null,
  "updatedByUserId": null,
  "updatedByDisplayName": null
};

export const taskRegisterDita: WorkTaskResponse = {
  "id": "a1d3f5b7-0007-4a1d-9a1d-000000000007",
  "title": "Register 119 MPR in Bolt",
  "description": null,
  "dueAtUtc": null,
  "status": 2,
  "closedAtUtc": "2026-09-22T17:10:58.762036+00:00",
  "cancellationNote": null,
  "aboutKind": 1,
  "aboutRecordId": "1a5c8e30-0002-41a5-91a5-000000000002",
  "aboutLabel": "119 MPR",
  "aboutRecordExists": true,
  "stepCount": 2,
  "doneStepCount": 2,
  "steps": [
    {
      "id": "b2e4a6c8-0071-4b2e-9b2e-000000000071",
      "position": 1,
      "title": "Add to Bolt",
      "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "responsibleDisplayName": "Dita Smite",
      "dueAtUtc": null,
      "doneAtUtc": "2026-09-18T14:33:58.762036+00:00",
      "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "doneByDisplayName": "Dita Smite",
      "canMarkDone": false,
      "canUndo": false
    },
    {
      "id": "b2e4a6c8-0072-4b2e-9b2e-000000000072",
      "position": 2,
      "title": "Apply for the taxi licence",
      "responsibleUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "responsibleDisplayName": "Signe Priede",
      "dueAtUtc": null,
      "doneAtUtc": "2026-09-21T12:56:58.762036+00:00",
      "doneByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "doneByDisplayName": "Signe Priede",
      "canMarkDone": false,
      "canUndo": false
    }
  ],
  "viewerIsCreator": true,
  "canChange": false,
  "concurrencyToken": "29091704-42bb-40ed-aeeb-b00d1ff165b3",
  "createdAtUtc": "2026-09-16T10:38:58.762036+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-22T17:10:58.762036+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const taskVentspilsSigne: WorkTaskResponse = {
  "id": "a1d3f5b7-0008-4a1d-9a1d-000000000008",
  "title": "Prepare an agreement for Ventspils Marine Services",
  "description": null,
  "dueAtUtc": null,
  "status": 3,
  "closedAtUtc": "2026-09-21T11:23:58.762036+00:00",
  "cancellationNote": "The customer changed their mind.",
  "aboutKind": 2,
  "aboutRecordId": "4d9f2a61-0005-44d9-94d9-000000000005",
  "aboutLabel": "Ventspils Marine Services",
  "aboutRecordExists": true,
  "stepCount": 0,
  "doneStepCount": 0,
  "steps": [],
  "viewerIsCreator": true,
  "canChange": false,
  "concurrencyToken": "99260a12-fc41-46e8-a213-d890118949a1",
  "createdAtUtc": "2026-09-18T15:08:58.762036+00:00",
  "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
  "createdByDisplayName": "Signe Priede",
  "updatedAtUtc": "2026-09-21T11:23:58.762036+00:00",
  "updatedByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
  "updatedByDisplayName": "Signe Priede"
};

export const taskServiceDita: WorkTaskResponse = {
  "id": "a1d3f5b7-0004-4a1d-9a1d-000000000004",
  "title": "Book a service for 444 WKS and tell the driver",
  "description": null,
  "dueAtUtc": null,
  "status": 1,
  "closedAtUtc": null,
  "cancellationNote": null,
  "aboutKind": 1,
  "aboutRecordId": "1a5c8e30-0009-41a5-91a5-000000000009",
  "aboutLabel": "444 WKS",
  "aboutRecordExists": true,
  "stepCount": 2,
  "doneStepCount": 1,
  "steps": [
    {
      "id": "b2e4a6c8-0041-4b2e-9b2e-000000000041",
      "position": 1,
      "title": "Book the service appointment",
      "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "responsibleDisplayName": "Dita Smite",
      "dueAtUtc": null,
      "doneAtUtc": "2026-09-22T11:13:58.762036+00:00",
      "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "doneByDisplayName": "Dita Smite",
      "canMarkDone": false,
      "canUndo": true
    },
    {
      "id": "b2e4a6c8-0042-4b2e-9b2e-000000000042",
      "position": 2,
      "title": "Tell the driver the time",
      "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "responsibleDisplayName": "Toms Rudzitis",
      "dueAtUtc": "2026-09-23T18:08:58.762036+00:00",
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": true,
      "canUndo": false
    }
  ],
  "viewerIsCreator": true,
  "canChange": true,
  "concurrencyToken": "31ddfdcd-0c06-4cdf-bcb4-14b74a7f77d9",
  "createdAtUtc": "2026-09-20T09:58:58.762036+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-22T11:13:58.762036+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const taskAgreementSigne: WorkTaskResponse = {
  "id": "a1d3f5b7-0003-4a1d-9a1d-000000000003",
  "title": "Prepare the rental agreement for Martins Ozols",
  "description": null,
  "dueAtUtc": "2026-09-24T18:08:58.762036+00:00",
  "status": 1,
  "closedAtUtc": null,
  "cancellationNote": null,
  "aboutKind": 2,
  "aboutRecordId": "4d9f2a61-0004-44d9-94d9-000000000004",
  "aboutLabel": "Martins Ozols",
  "aboutRecordExists": true,
  "stepCount": 0,
  "doneStepCount": 0,
  "steps": [],
  "viewerIsCreator": true,
  "canChange": true,
  "concurrencyToken": "bdc2b1df-4c48-4cdf-9299-71ed867e2508",
  "createdAtUtc": "2026-09-23T17:48:58.762036+00:00",
  "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
  "createdByDisplayName": "Signe Priede",
  "updatedAtUtc": null,
  "updatedByUserId": null,
  "updatedByDisplayName": null
};

export const notSharedKarlis: ProblemDetails = {
  "type": "https://httpstatuses.com/403",
  "title": "Forbidden",
  "status": 403,
  "detail": "This task is not shared with you.",
  "code": "tasks.not_shared"
};

export const notFoundDita: ProblemDetails = {
  "type": "https://httpstatuses.com/404",
  "title": "Not Found",
  "status": 404,
  "detail": "This task no longer exists.",
  "code": "tasks.not_found"
};

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
      "upcomingPlannedStartAtUtc": "2026-09-29T10:08:58.762036+00:00"
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
      "upcomingPlannedStartAtUtc": "2026-09-26T10:08:58.762036+00:00"
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
      "id": "1a5c8e30-0008-41a5-91a5-000000000008",
      "plateNumber": "660 BYH",
      "vinCode": "ZFA33400006660301",
      "make": "Fiat",
      "model": "Tipo",
      "year": 2020,
      "bodyType": 1,
      "fuelType": 1,
      "isActive": false,
      "availability": 4,
      "currentAssignmentId": null,
      "currentCustomerDisplayName": null,
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
    },
    {
      "id": "1a5c8e30-0005-41a5-91a5-000000000005",
      "plateNumber": "881 GRT",
      "vinCode": "VF3LCYHZPKS881409",
      "make": "Peugeot",
      "model": "308 SW",
      "year": 2021,
      "bodyType": 2,
      "fuelType": 1,
      "isActive": false,
      "availability": 4,
      "currentAssignmentId": null,
      "currentCustomerDisplayName": null,
      "upcomingAssignmentId": null,
      "upcomingCustomerDisplayName": null,
      "upcomingPlannedStartAtUtc": null
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 10,
  "totalPages": 1
};

export const pickCustomers: PagedResponse<CustomerListItemResponse> = {
  "items": [
    {
      "id": "4d9f2a61-0001-44d9-94d9-000000000001",
      "type": 2,
      "displayName": "Baltic Freight Partners",
      "email": "fleet@balticfreight.example",
      "phoneNumber": "+371 67 220 118",
      "driverId": null,
      "isActive": true
    },
    {
      "id": "4d9f2a61-0002-44d9-94d9-000000000002",
      "type": 1,
      "displayName": "Ilze Berzina",
      "email": "ilze.berzina@example.com",
      "phoneNumber": "+371 29 441 208",
      "driverId": "6e1b3f72-0002-46e1-96e1-000000000002",
      "isActive": true
    },
    {
      "id": "4d9f2a61-0007-44d9-94d9-000000000007",
      "type": 2,
      "displayName": "Daugava Construction",
      "email": "transport@daugavacon.example",
      "phoneNumber": "+371 67 449 210",
      "driverId": null,
      "isActive": true
    },
    {
      "id": "4d9f2a61-0006-44d9-94d9-000000000006",
      "type": 1,
      "displayName": "Anete Kalnina",
      "email": "anete.kalnina@example.com",
      "phoneNumber": "+371 28 330 447",
      "driverId": "6e1b3f72-0005-46e1-96e1-000000000005",
      "isActive": true
    },
    {
      "id": "4d9f2a61-0008-44d9-94d9-000000000008",
      "type": 1,
      "displayName": "Roberts Liepins",
      "email": "r.liepins@example.com",
      "phoneNumber": "+371 22 007 118",
      "driverId": null,
      "isActive": true
    },
    {
      "id": "4d9f2a61-0003-44d9-94d9-000000000003",
      "type": 2,
      "displayName": "Nordwind Logistics",
      "email": "ops@nordwind.example",
      "phoneNumber": "+371 66 881 004",
      "driverId": null,
      "isActive": true
    },
    {
      "id": "4d9f2a61-0004-44d9-94d9-000000000004",
      "type": 1,
      "displayName": "Martins Ozols",
      "email": "m.ozols@example.com",
      "phoneNumber": "+371 26 118 903",
      "driverId": null,
      "isActive": true
    },
    {
      "id": "4d9f2a61-0005-44d9-94d9-000000000005",
      "type": 2,
      "displayName": "Ventspils Marine Services",
      "email": "admin@vms.example",
      "phoneNumber": "+371 63 620 991",
      "driverId": null,
      "isActive": false
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
    },
    {
      "id": "6e1b3f72-0006-46e1-96e1-000000000006",
      "firstName": "Normunds",
      "lastName": "Zarins",
      "email": "n.zarins@example.com",
      "phoneNumber": "+371 63 440 118",
      "personalId": "190869-10038",
      "driverLicenseNumber": "LV-AA-004471",
      "address": "Rupniecibas 5, Liepaja, LV-3401",
      "isActive": false
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 7,
  "totalPages": 1
};

export const pickAssignments: PagedResponse<RentalAssignmentListItemResponse> = {
  "items": [
    {
      "id": "2d7b5c86-0012-42d7-92d7-000000000012",
      "customerId": "4d9f2a61-0002-44d9-94d9-000000000002",
      "customerDisplayName": "Ilze Berzina",
      "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
      "vehiclePlateNumber": "482 TKL",
      "status": 2,
      "plannedStartAtUtc": "2026-02-16T10:08:58.762036+00:00",
      "startedAtUtc": "2026-02-16T10:08:58.762036+00:00",
      "plannedEndAtUtc": "2026-03-18T10:08:58.762036+00:00",
      "closedAtUtc": "2026-03-20T10:08:58.762036+00:00",
      "customerType": 1,
      "vehicleMake": "Volkswagen",
      "vehicleModel": "Passat Variant",
      "openAuthorizationCount": 0,
      "openNamedDrivers": [],
      "hasOpenCollectiveAuthorization": false,
      "openInterruptionCount": 0
    },
    {
      "id": "2d7b5c86-0010-42d7-92d7-000000000010",
      "customerId": "4d9f2a61-0003-44d9-94d9-000000000003",
      "customerDisplayName": "Nordwind Logistics",
      "vehicleId": "1a5c8e30-0005-41a5-91a5-000000000005",
      "vehiclePlateNumber": "881 GRT",
      "status": 2,
      "plannedStartAtUtc": "2026-04-17T10:08:58.762036+00:00",
      "startedAtUtc": "2026-04-17T10:08:58.762036+00:00",
      "plannedEndAtUtc": "2026-06-16T10:08:58.762036+00:00",
      "closedAtUtc": "2026-06-17T10:08:58.762036+00:00",
      "customerType": 2,
      "vehicleMake": "Peugeot",
      "vehicleModel": "308 SW",
      "openAuthorizationCount": 0,
      "openNamedDrivers": [],
      "hasOpenCollectiveAuthorization": false,
      "openInterruptionCount": 0
    },
    {
      "id": "2d7b5c86-0008-42d7-92d7-000000000008",
      "customerId": "4d9f2a61-0001-44d9-94d9-000000000001",
      "customerDisplayName": "Baltic Freight Partners",
      "vehicleId": "1a5c8e30-0002-41a5-91a5-000000000002",
      "vehiclePlateNumber": "119 MPR",
      "status": 2,
      "plannedStartAtUtc": "2026-06-26T10:08:58.762036+00:00",
      "startedAtUtc": "2026-06-26T10:08:58.762036+00:00",
      "plannedEndAtUtc": "2026-08-23T10:08:58.762036+00:00",
      "closedAtUtc": "2026-08-24T10:08:58.762036+00:00",
      "customerType": 2,
      "vehicleMake": "Volvo",
      "vehicleModel": "XC60",
      "openAuthorizationCount": 0,
      "openNamedDrivers": [],
      "hasOpenCollectiveAuthorization": false,
      "openInterruptionCount": 0
    },
    {
      "id": "2d7b5c86-0009-42d7-92d7-000000000009",
      "customerId": "4d9f2a61-0005-44d9-94d9-000000000005",
      "customerDisplayName": "Ventspils Marine Services",
      "vehicleId": "1a5c8e30-0008-41a5-91a5-000000000008",
      "vehiclePlateNumber": "660 BYH",
      "status": 3,
      "plannedStartAtUtc": "2026-07-26T10:08:58.762036+00:00",
      "startedAtUtc": null,
      "plannedEndAtUtc": "2026-09-04T10:08:58.762036+00:00",
      "closedAtUtc": "2026-07-28T10:08:58.762036+00:00",
      "customerType": 2,
      "vehicleMake": "Fiat",
      "vehicleModel": "Tipo",
      "openAuthorizationCount": 0,
      "openNamedDrivers": [],
      "hasOpenCollectiveAuthorization": false,
      "openInterruptionCount": 0
    },
    {
      "id": "2d7b5c86-0007-42d7-92d7-000000000007",
      "customerId": "4d9f2a61-0008-44d9-94d9-000000000008",
      "customerDisplayName": "Roberts Liepins",
      "vehicleId": "1a5c8e30-0010-41a5-91a5-000000000010",
      "vehiclePlateNumber": "400 NDP",
      "status": 2,
      "plannedStartAtUtc": "2026-08-15T10:08:58.762036+00:00",
      "startedAtUtc": "2026-08-15T10:08:58.762036+00:00",
      "plannedEndAtUtc": "2026-09-14T10:08:58.762036+00:00",
      "closedAtUtc": "2026-09-14T10:08:58.762036+00:00",
      "customerType": 1,
      "vehicleMake": "Skoda",
      "vehicleModel": "Octavia",
      "openAuthorizationCount": 0,
      "openNamedDrivers": [],
      "hasOpenCollectiveAuthorization": false,
      "openInterruptionCount": 0
    },
    {
      "id": "2d7b5c86-0003-42d7-92d7-000000000003",
      "customerId": "4d9f2a61-0003-44d9-94d9-000000000003",
      "customerDisplayName": "Nordwind Logistics",
      "vehicleId": "1a5c8e30-0007-41a5-91a5-000000000007",
      "vehiclePlateNumber": "552 KLM",
      "status": 1,
      "plannedStartAtUtc": "2026-08-25T10:08:58.762036+00:00",
      "startedAtUtc": "2026-08-25T10:08:58.762036+00:00",
      "plannedEndAtUtc": "2026-11-23T10:08:58.762036+00:00",
      "closedAtUtc": null,
      "customerType": 2,
      "vehicleMake": "BMW",
      "vehicleModel": "320d Touring",
      "openAuthorizationCount": 1,
      "openNamedDrivers": [],
      "hasOpenCollectiveAuthorization": true,
      "openInterruptionCount": 1
    },
    {
      "id": "2d7b5c86-0011-42d7-92d7-000000000011",
      "customerId": "4d9f2a61-0007-44d9-94d9-000000000007",
      "customerDisplayName": "Daugava Construction",
      "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
      "vehiclePlateNumber": "770 HDV",
      "status": 3,
      "plannedStartAtUtc": "2026-09-04T10:08:58.762036+00:00",
      "startedAtUtc": null,
      "plannedEndAtUtc": "2026-09-18T10:08:58.762036+00:00",
      "closedAtUtc": "2026-09-05T10:08:58.762036+00:00",
      "customerType": 2,
      "vehicleMake": "Audi",
      "vehicleModel": "A4",
      "openAuthorizationCount": 0,
      "openNamedDrivers": [],
      "hasOpenCollectiveAuthorization": false,
      "openInterruptionCount": 0
    },
    {
      "id": "2d7b5c86-0001-4f60-9a06-000000000001",
      "customerId": "4d9f2a61-0001-44d9-94d9-000000000001",
      "customerDisplayName": "Baltic Freight Partners",
      "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
      "vehiclePlateNumber": "482 TKL",
      "status": 1,
      "plannedStartAtUtc": "2026-09-12T10:08:58.762036+00:00",
      "startedAtUtc": "2026-09-12T11:08:58.762036+00:00",
      "plannedEndAtUtc": "2026-10-12T10:08:58.762036+00:00",
      "closedAtUtc": null,
      "customerType": 2,
      "vehicleMake": "Volkswagen",
      "vehicleModel": "Passat Variant",
      "openAuthorizationCount": 1,
      "openNamedDrivers": [
        {
          "driverId": "6e1b3f72-0001-46e1-96e1-000000000001",
          "firstName": "Janis",
          "lastName": "Krumins"
        }
      ],
      "hasOpenCollectiveAuthorization": false,
      "openInterruptionCount": 0
    },
    {
      "id": "2d7b5c86-0002-42d7-92d7-000000000002",
      "customerId": "4d9f2a61-0002-44d9-94d9-000000000002",
      "customerDisplayName": "Ilze Berzina",
      "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
      "vehiclePlateNumber": "770 HDV",
      "status": 1,
      "plannedStartAtUtc": "2026-09-20T10:08:58.762036+00:00",
      "startedAtUtc": "2026-09-20T10:08:58.762036+00:00",
      "plannedEndAtUtc": "2026-09-27T10:08:58.762036+00:00",
      "closedAtUtc": null,
      "customerType": 1,
      "vehicleMake": "Audi",
      "vehicleModel": "A4",
      "openAuthorizationCount": 1,
      "openNamedDrivers": [
        {
          "driverId": "6e1b3f72-0002-46e1-96e1-000000000002",
          "firstName": "Ilze",
          "lastName": "Berzina"
        }
      ],
      "hasOpenCollectiveAuthorization": false,
      "openInterruptionCount": 0
    },
    {
      "id": "2d7b5c86-0006-42d7-92d7-000000000006",
      "customerId": "4d9f2a61-0006-44d9-94d9-000000000006",
      "customerDisplayName": "Anete Kalnina",
      "vehicleId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "vehiclePlateNumber": "204 JLM",
      "status": 1,
      "plannedStartAtUtc": "2026-09-22T10:08:58.762036+00:00",
      "startedAtUtc": "2026-09-22T10:08:58.762036+00:00",
      "plannedEndAtUtc": "2026-09-29T10:08:58.762036+00:00",
      "closedAtUtc": null,
      "customerType": 1,
      "vehicleMake": "Hyundai",
      "vehicleModel": "Kona Electric",
      "openAuthorizationCount": 1,
      "openNamedDrivers": [
        {
          "driverId": "6e1b3f72-0005-46e1-96e1-000000000005",
          "firstName": "Anete",
          "lastName": "Kalnina"
        }
      ],
      "hasOpenCollectiveAuthorization": false,
      "openInterruptionCount": 1
    },
    {
      "id": "2d7b5c86-0004-42d7-92d7-000000000004",
      "customerId": "4d9f2a61-0004-44d9-94d9-000000000004",
      "customerDisplayName": "Martins Ozols",
      "vehicleId": "1a5c8e30-0009-41a5-91a5-000000000009",
      "vehiclePlateNumber": "444 WKS",
      "status": 4,
      "plannedStartAtUtc": "2026-09-26T10:08:58.762036+00:00",
      "startedAtUtc": null,
      "plannedEndAtUtc": "2026-10-10T10:08:58.762036+00:00",
      "closedAtUtc": null,
      "customerType": 1,
      "vehicleMake": "Nissan",
      "vehicleModel": "Qashqai",
      "openAuthorizationCount": 0,
      "openNamedDrivers": [],
      "hasOpenCollectiveAuthorization": false,
      "openInterruptionCount": 0
    },
    {
      "id": "2d7b5c86-0005-42d7-92d7-000000000005",
      "customerId": "4d9f2a61-0007-44d9-94d9-000000000007",
      "customerDisplayName": "Daugava Construction",
      "vehicleId": "1a5c8e30-0004-41a5-91a5-000000000004",
      "vehiclePlateNumber": "335 SNB",
      "status": 4,
      "plannedStartAtUtc": "2026-09-29T10:08:58.762036+00:00",
      "startedAtUtc": null,
      "plannedEndAtUtc": "2026-10-29T10:08:58.762036+00:00",
      "closedAtUtc": null,
      "customerType": 2,
      "vehicleMake": "Mercedes-Benz",
      "vehicleModel": "E 220 d",
      "openAuthorizationCount": 0,
      "openNamedDrivers": [],
      "hasOpenCollectiveAuthorization": false,
      "openInterruptionCount": 0
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 12,
  "totalPages": 1
};

export const createShapeRefusal: ValidationProblemDetails = {
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Title": [
      "Enter a title for the task."
    ],
    "Steps[0].Title": [
      "Every step needs a title."
    ],
    "Steps[0].ResponsibleUserId": [
      "Every step needs a person."
    ]
  }
};

export const createKindWithoutRecordRefusal: ValidationProblemDetails = {
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "AboutRecordId": [
      "Choose the vehicle this task is about."
    ]
  }
};

export const createDueAfterRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "A step cannot be due after the task.",
  "errors": {
    "Steps[1].DueAtUtc": [
      "A step cannot be due after the task."
    ]
  },
  "code": "tasks.step_due_after_task"
};

export const createAboutMissingRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/404",
  "title": "Not Found",
  "status": 404,
  "detail": "The vehicle this task is about was not found.",
  "code": "tasks.about_record_not_found"
};

export const createTitleLongRefusal: ValidationProblemDetails = {
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Title": [
      "The title must be at most 200 characters."
    ]
  }
};

export const editClosedRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "This task was finished or cancelled and can no longer be changed.",
  "code": "tasks.closed"
};

export const editCreatorOnlyRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/403",
  "title": "Forbidden",
  "status": 403,
  "detail": "Only the task's creator can change, finish or cancel it.",
  "code": "tasks.creator_only"
};

export const finishClosedRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "This task was finished or cancelled and can no longer be changed.",
  "code": "tasks.closed"
};

export const cancelNoteLongRefusal: ValidationProblemDetails = {
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Note": [
      "The note must be at most 1000 characters."
    ]
  }
};

export const markNotYoursStepRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/403",
  "title": "Forbidden",
  "status": 403,
  "detail": "Only the step's person or the task's creator can mark this step.",
  "code": "tasks.step_not_yours"
};

export const markStepNotFoundRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/404",
  "title": "Not Found",
  "status": 404,
  "detail": "This step is not one of the task's steps.",
  "code": "tasks.step_not_found"
};

export const markCarWashToms: WorkTaskResponse = {
  "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
  "title": "Prepare 204 JLM for a rental",
  "description": "Adding it to Bolt comes first. The car wash can happen any time before the handover.",
  "dueAtUtc": "2026-09-27T13:08:58.762036+00:00",
  "status": 1,
  "closedAtUtc": null,
  "cancellationNote": null,
  "aboutKind": 1,
  "aboutRecordId": "1a5c8e30-0006-41a5-91a5-000000000006",
  "aboutLabel": "204 JLM",
  "aboutRecordExists": true,
  "stepCount": 4,
  "doneStepCount": 2,
  "steps": [
    {
      "id": "b2e4a6c8-0011-4b2e-9b2e-000000000011",
      "position": 1,
      "title": "Add to Bolt",
      "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "responsibleDisplayName": "Dita Smite",
      "dueAtUtc": null,
      "doneAtUtc": "2026-09-23T12:28:58.762036+00:00",
      "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "doneByDisplayName": "Dita Smite",
      "canMarkDone": false,
      "canUndo": false
    },
    {
      "id": "b2e4a6c8-0012-4b2e-9b2e-000000000012",
      "position": 2,
      "title": "Apply for the taxi licence",
      "responsibleUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "responsibleDisplayName": "Signe Priede",
      "dueAtUtc": "2026-09-26T17:08:58.762036+00:00",
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": false,
      "canUndo": false
    },
    {
      "id": "b2e4a6c8-0013-4b2e-9b2e-000000000013",
      "position": 3,
      "title": "Car wash",
      "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "responsibleDisplayName": "Toms Rudzitis",
      "dueAtUtc": "2026-09-25T11:08:58.762036+00:00",
      "doneAtUtc": "2026-09-24T10:25:30.986645+00:00",
      "doneByUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "doneByDisplayName": "Toms Rudzitis",
      "canMarkDone": false,
      "canUndo": true
    },
    {
      "id": "b2e4a6c8-0014-4b2e-9b2e-000000000014",
      "position": 4,
      "title": "Handover",
      "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "responsibleDisplayName": "Dita Smite",
      "dueAtUtc": "2026-09-27T13:08:58.762036+00:00",
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": false,
      "canUndo": false
    }
  ],
  "viewerIsCreator": false,
  "canChange": false,
  "concurrencyToken": "1ccb52c9-89e2-48d6-852a-87ac7a095099",
  "createdAtUtc": "2026-09-22T10:22:58.762036+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-24T10:25:31.005292+00:00",
  "updatedByUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
  "updatedByDisplayName": "Toms Rudzitis"
};

export const todoTomsAfterMark: PagedResponse<WorkTaskToDoItemResponse> = {
  "items": [
    {
      "taskId": "a1d3f5b7-0004-4a1d-9a1d-000000000004",
      "stepId": "b2e4a6c8-0042-4b2e-9b2e-000000000042",
      "title": "Tell the driver the time",
      "taskTitle": "Book a service for 444 WKS and tell the driver",
      "dueAtUtc": "2026-09-23T18:08:58.762036+00:00",
      "aboutKind": 1,
      "aboutLabel": "444 WKS",
      "aboutRecordExists": true,
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 1,
  "totalPages": 1
};

export const view2TomsAfterMark: PagedResponse<WorkTaskListItemResponse> = {
  "items": [
    {
      "id": "a1d3f5b7-0004-4a1d-9a1d-000000000004",
      "title": "Book a service for 444 WKS and tell the driver",
      "status": 1,
      "dueAtUtc": null,
      "closedAtUtc": null,
      "aboutKind": 1,
      "aboutRecordId": "1a5c8e30-0009-41a5-91a5-000000000009",
      "aboutLabel": "444 WKS",
      "aboutRecordExists": true,
      "stepCount": 2,
      "doneStepCount": 1,
      "people": [
        "Dita Smite",
        "Toms Rudzitis"
      ],
      "yourSteps": [
        {
          "id": "b2e4a6c8-0042-4b2e-9b2e-000000000042",
          "position": 2,
          "title": "Tell the driver the time",
          "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "responsibleDisplayName": "Toms Rudzitis",
          "dueAtUtc": "2026-09-23T18:08:58.762036+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-20T09:58:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
      "title": "Prepare 204 JLM for a rental",
      "status": 1,
      "dueAtUtc": "2026-09-27T13:08:58.762036+00:00",
      "closedAtUtc": null,
      "aboutKind": 1,
      "aboutRecordId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "aboutLabel": "204 JLM",
      "aboutRecordExists": true,
      "stepCount": 4,
      "doneStepCount": 2,
      "people": [
        "Dita Smite",
        "Signe Priede",
        "Toms Rudzitis"
      ],
      "yourSteps": [
        {
          "id": "b2e4a6c8-0013-4b2e-9b2e-000000000013",
          "position": 3,
          "title": "Car wash",
          "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "responsibleDisplayName": "Toms Rudzitis",
          "dueAtUtc": "2026-09-25T11:08:58.762036+00:00",
          "doneAtUtc": "2026-09-24T10:25:30.986645+00:00",
          "doneByUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "doneByDisplayName": "Toms Rudzitis",
          "canMarkDone": false,
          "canUndo": true
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-22T10:22:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0005-4a1d-9a1d-000000000005",
      "title": "Handle the windscreen insurance case of 204 JLM",
      "status": 1,
      "dueAtUtc": "2026-10-04T17:08:58.762036+00:00",
      "closedAtUtc": null,
      "aboutKind": 1,
      "aboutRecordId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "aboutLabel": "204 JLM",
      "aboutRecordExists": true,
      "stepCount": 3,
      "doneStepCount": 2,
      "people": [
        "Toms Rudzitis",
        "Signe Priede",
        "Dita Smite"
      ],
      "yourSteps": [
        {
          "id": "b2e4a6c8-0051-4b2e-9b2e-000000000051",
          "position": 1,
          "title": "Collect the photos",
          "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "responsibleDisplayName": "Toms Rudzitis",
          "dueAtUtc": null,
          "doneAtUtc": "2026-09-21T15:18:58.762036+00:00",
          "doneByUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "doneByDisplayName": "Toms Rudzitis",
          "canMarkDone": false,
          "canUndo": true
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-19T12:38:58.762036+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 3,
  "totalPages": 1
};

export const countsTomsAfterMark: WorkTaskCountsResponse = {
  "myTasks": 0,
  "involvingMe": 3,
  "finished": 0,
  "toDo": 1
};

export const markAgainRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "This step is already done.",
  "code": "tasks.step_already_done"
};

export const createPractice: WorkTaskResponse = {
  "id": "52916a3b-c2b7-4597-b30d-a2654700ee34",
  "title": "Practice: check 119 MPR tyres",
  "description": "Follow-up 12 check.",
  "dueAtUtc": "2040-01-20T10:00:00+00:00",
  "status": 1,
  "closedAtUtc": null,
  "cancellationNote": null,
  "aboutKind": 1,
  "aboutRecordId": "1a5c8e30-0002-41a5-91a5-000000000002",
  "aboutLabel": "119 MPR",
  "aboutRecordExists": true,
  "stepCount": 2,
  "doneStepCount": 0,
  "steps": [
    {
      "id": "ff97ef3a-5e83-47b3-b72b-fbeea94311b0",
      "position": 1,
      "title": "Measure the tread",
      "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "responsibleDisplayName": "Toms Rudzitis",
      "dueAtUtc": "2040-01-18T10:00:00+00:00",
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": true,
      "canUndo": false
    },
    {
      "id": "97ea88e5-32c9-456f-abf6-234fd3e35f35",
      "position": 2,
      "title": "Order new tyres",
      "responsibleUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "responsibleDisplayName": "Signe Priede",
      "dueAtUtc": null,
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": true,
      "canUndo": false
    }
  ],
  "viewerIsCreator": true,
  "canChange": true,
  "concurrencyToken": "9f84c747-f93d-464c-8507-907dd62b78fc",
  "createdAtUtc": "2026-09-24T10:25:31.171478+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": null,
  "updatedByUserId": null,
  "updatedByDisplayName": null
};

export const markNotYoursRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/403",
  "title": "Forbidden",
  "status": 403,
  "detail": "Only the step's person or the task's creator can mark this step.",
  "code": "tasks.step_not_yours"
};

export const undoNotYoursRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/403",
  "title": "Forbidden",
  "status": 403,
  "detail": "Only the person who marked this step, or the task's creator, can undo the mark.",
  "code": "tasks.mark_not_yours"
};

export const practiceTomsMarkedByDita: WorkTaskResponse = {
  "id": "52916a3b-c2b7-4597-b30d-a2654700ee34",
  "title": "Practice: check 119 MPR tyres",
  "description": "Follow-up 12 check.",
  "dueAtUtc": "2040-01-20T10:00:00+00:00",
  "status": 1,
  "closedAtUtc": null,
  "cancellationNote": null,
  "aboutKind": 1,
  "aboutRecordId": "1a5c8e30-0002-41a5-91a5-000000000002",
  "aboutLabel": "119 MPR",
  "aboutRecordExists": true,
  "stepCount": 2,
  "doneStepCount": 1,
  "steps": [
    {
      "id": "ff97ef3a-5e83-47b3-b72b-fbeea94311b0",
      "position": 1,
      "title": "Measure the tread",
      "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "responsibleDisplayName": "Toms Rudzitis",
      "dueAtUtc": "2040-01-18T10:00:00+00:00",
      "doneAtUtc": "2026-09-24T10:25:31.223907+00:00",
      "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "doneByDisplayName": "Dita Smite",
      "canMarkDone": false,
      "canUndo": false
    },
    {
      "id": "97ea88e5-32c9-456f-abf6-234fd3e35f35",
      "position": 2,
      "title": "Order new tyres",
      "responsibleUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "responsibleDisplayName": "Signe Priede",
      "dueAtUtc": null,
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": false,
      "canUndo": false
    }
  ],
  "viewerIsCreator": false,
  "canChange": false,
  "concurrencyToken": "aa9b2177-325b-43ea-8f9e-d904fa0a1638",
  "createdAtUtc": "2026-09-24T10:25:31.171478+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-24T10:25:31.224283+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const editPractice: WorkTaskResponse = {
  "id": "52916a3b-c2b7-4597-b30d-a2654700ee34",
  "title": "Practice: replace 119 MPR tyres",
  "description": null,
  "dueAtUtc": "2040-01-20T10:00:00+00:00",
  "status": 1,
  "closedAtUtc": null,
  "cancellationNote": null,
  "aboutKind": 1,
  "aboutRecordId": "1a5c8e30-0002-41a5-91a5-000000000002",
  "aboutLabel": "119 MPR",
  "aboutRecordExists": true,
  "stepCount": 3,
  "doneStepCount": 1,
  "steps": [
    {
      "id": "97ea88e5-32c9-456f-abf6-234fd3e35f35",
      "position": 1,
      "title": "Order new tyres",
      "responsibleUserId": "9f2b7c41-0003-4a10-8b01-000000000003",
      "responsibleDisplayName": "Karlis Zvaigzne",
      "dueAtUtc": null,
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": true,
      "canUndo": false
    },
    {
      "id": "ff97ef3a-5e83-47b3-b72b-fbeea94311b0",
      "position": 2,
      "title": "Measure the tread depth",
      "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "responsibleDisplayName": "Toms Rudzitis",
      "dueAtUtc": "2040-01-18T10:00:00+00:00",
      "doneAtUtc": "2026-09-24T10:25:31.223907+00:00",
      "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "doneByDisplayName": "Dita Smite",
      "canMarkDone": false,
      "canUndo": true
    },
    {
      "id": "d1bd36c5-6afd-4c5c-b394-7de31d77c4a2",
      "position": 3,
      "title": "Fit the tyres",
      "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "responsibleDisplayName": "Dita Smite",
      "dueAtUtc": null,
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": true,
      "canUndo": false
    }
  ],
  "viewerIsCreator": true,
  "canChange": true,
  "concurrencyToken": "c1503471-7122-4105-9121-e5f1a4a2b938",
  "createdAtUtc": "2026-09-24T10:25:31.171478+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-24T10:25:31.249987+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const editDueAfterRefusal: ValidationProblemDetails = {
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "A step cannot be due after the task.",
  "errors": {
    "Steps[1].DueAtUtc": [
      "A step cannot be due after the task."
    ]
  },
  "code": "tasks.step_due_after_task"
};

export const editAboutMissingRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/404",
  "title": "Not Found",
  "status": 404,
  "detail": "The vehicle this task is about was not found.",
  "code": "tasks.about_record_not_found"
};

export const concurrencyRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "The task changed concurrently. Retry the operation.",
  "code": "tasks.concurrency_conflict"
};

export const practiceBeforeFinish: WorkTaskResponse = {
  "id": "52916a3b-c2b7-4597-b30d-a2654700ee34",
  "title": "Practice: replace 119 MPR tyres",
  "description": null,
  "dueAtUtc": "2040-01-20T10:00:00+00:00",
  "status": 1,
  "closedAtUtc": null,
  "cancellationNote": null,
  "aboutKind": 1,
  "aboutRecordId": "1a5c8e30-0002-41a5-91a5-000000000002",
  "aboutLabel": "119 MPR",
  "aboutRecordExists": true,
  "stepCount": 3,
  "doneStepCount": 1,
  "steps": [
    {
      "id": "97ea88e5-32c9-456f-abf6-234fd3e35f35",
      "position": 1,
      "title": "Order new tyres",
      "responsibleUserId": "9f2b7c41-0003-4a10-8b01-000000000003",
      "responsibleDisplayName": "Karlis Zvaigzne",
      "dueAtUtc": null,
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": true,
      "canUndo": false
    },
    {
      "id": "ff97ef3a-5e83-47b3-b72b-fbeea94311b0",
      "position": 2,
      "title": "Measure the tread depth",
      "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "responsibleDisplayName": "Toms Rudzitis",
      "dueAtUtc": "2040-01-18T10:00:00+00:00",
      "doneAtUtc": "2026-09-24T10:25:31.223907+00:00",
      "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "doneByDisplayName": "Dita Smite",
      "canMarkDone": false,
      "canUndo": true
    },
    {
      "id": "d1bd36c5-6afd-4c5c-b394-7de31d77c4a2",
      "position": 3,
      "title": "Fit the tyres",
      "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "responsibleDisplayName": "Dita Smite",
      "dueAtUtc": null,
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": true,
      "canUndo": false
    }
  ],
  "viewerIsCreator": true,
  "canChange": true,
  "concurrencyToken": "9a88c1cc-678b-4132-b985-659edfe92894",
  "createdAtUtc": "2026-09-24T10:25:31.171478+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-24T10:25:31.378149+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const finishPractice: WorkTaskResponse = {
  "id": "52916a3b-c2b7-4597-b30d-a2654700ee34",
  "title": "Practice: replace 119 MPR tyres",
  "description": null,
  "dueAtUtc": "2040-01-20T10:00:00+00:00",
  "status": 2,
  "closedAtUtc": "2026-09-24T10:25:31.390238+00:00",
  "cancellationNote": null,
  "aboutKind": 1,
  "aboutRecordId": "1a5c8e30-0002-41a5-91a5-000000000002",
  "aboutLabel": "119 MPR",
  "aboutRecordExists": true,
  "stepCount": 3,
  "doneStepCount": 1,
  "steps": [
    {
      "id": "97ea88e5-32c9-456f-abf6-234fd3e35f35",
      "position": 1,
      "title": "Order new tyres",
      "responsibleUserId": "9f2b7c41-0003-4a10-8b01-000000000003",
      "responsibleDisplayName": "Karlis Zvaigzne",
      "dueAtUtc": null,
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": false,
      "canUndo": false
    },
    {
      "id": "ff97ef3a-5e83-47b3-b72b-fbeea94311b0",
      "position": 2,
      "title": "Measure the tread depth",
      "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
      "responsibleDisplayName": "Toms Rudzitis",
      "dueAtUtc": "2040-01-18T10:00:00+00:00",
      "doneAtUtc": "2026-09-24T10:25:31.223907+00:00",
      "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "doneByDisplayName": "Dita Smite",
      "canMarkDone": false,
      "canUndo": false
    },
    {
      "id": "d1bd36c5-6afd-4c5c-b394-7de31d77c4a2",
      "position": 3,
      "title": "Fit the tyres",
      "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "responsibleDisplayName": "Dita Smite",
      "dueAtUtc": null,
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": false,
      "canUndo": false
    }
  ],
  "viewerIsCreator": true,
  "canChange": false,
  "concurrencyToken": "79580dad-b232-4432-bc8f-022933ac1e68",
  "createdAtUtc": "2026-09-24T10:25:31.171478+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-24T10:25:31.390762+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const finishAgainRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "This task was finished or cancelled and can no longer be changed.",
  "code": "tasks.closed"
};

export const cancelPractice: WorkTaskResponse = {
  "id": "bd39ccb7-f7ee-40c6-b80c-843a5459d8ae",
  "title": "Practice: a task to cancel",
  "description": null,
  "dueAtUtc": null,
  "status": 3,
  "closedAtUtc": "2026-09-24T10:25:31.433335+00:00",
  "cancellationNote": "The plan changed.",
  "aboutKind": null,
  "aboutRecordId": null,
  "aboutLabel": null,
  "aboutRecordExists": false,
  "stepCount": 0,
  "doneStepCount": 0,
  "steps": [],
  "viewerIsCreator": true,
  "canChange": false,
  "concurrencyToken": "f687e4a6-08d1-4e85-9fa5-5a151de8d58b",
  "createdAtUtc": "2026-09-24T10:25:31.425118+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-24T10:25:31.433882+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const cancelBlank: WorkTaskResponse = {
  "id": "34e64b49-0d8f-4559-9de9-ee2d258f4cb0",
  "title": "Practice: cancelled without a reason",
  "description": null,
  "dueAtUtc": null,
  "status": 3,
  "closedAtUtc": "2026-09-24T10:25:31.453259+00:00",
  "cancellationNote": null,
  "aboutKind": null,
  "aboutRecordId": null,
  "aboutLabel": null,
  "aboutRecordExists": false,
  "stepCount": 0,
  "doneStepCount": 0,
  "steps": [],
  "viewerIsCreator": true,
  "canChange": false,
  "concurrencyToken": "a0c74b30-8d54-44ec-a29e-6f424ff17334",
  "createdAtUtc": "2026-09-24T10:25:31.444554+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-24T10:25:31.45351+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const taskAboutDeleted: WorkTaskResponse = {
  "id": "0fb137f4-476c-476c-868d-0bb7eff4e87c",
  "title": "Practice: sell the practice car",
  "description": null,
  "dueAtUtc": null,
  "status": 1,
  "closedAtUtc": null,
  "cancellationNote": null,
  "aboutKind": 1,
  "aboutRecordId": "153643ae-5fa0-465e-9bed-c720f46d4a3c",
  "aboutLabel": null,
  "aboutRecordExists": false,
  "stepCount": 0,
  "doneStepCount": 0,
  "steps": [],
  "viewerIsCreator": true,
  "canChange": true,
  "concurrencyToken": "6f8523da-74f7-464e-871c-7f1ae4d7b44c",
  "createdAtUtc": "2026-09-24T10:25:31.5132+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": null,
  "updatedByUserId": null,
  "updatedByDisplayName": null
};

export const todoDitaEnd: PagedResponse<WorkTaskToDoItemResponse> = {
  "items": [
    {
      "taskId": "a1d3f5b7-0002-4a1d-9a1d-000000000002",
      "stepId": null,
      "title": "Reassign the parking fine to the driver",
      "taskTitle": "Reassign the parking fine to the driver",
      "dueAtUtc": "2026-09-23T16:08:58.762036+00:00",
      "aboutKind": 4,
      "aboutLabel": "552 KLM · Nordwind Logistics",
      "aboutRecordExists": true,
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "taskId": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
      "stepId": "b2e4a6c8-0014-4b2e-9b2e-000000000014",
      "title": "Handover",
      "taskTitle": "Prepare 204 JLM for a rental",
      "dueAtUtc": "2026-09-27T13:08:58.762036+00:00",
      "aboutKind": 1,
      "aboutLabel": "204 JLM",
      "aboutRecordExists": true,
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "taskId": "a1d3f5b7-0005-4a1d-9a1d-000000000005",
      "stepId": "b2e4a6c8-0053-4b2e-9b2e-000000000053",
      "title": "Pick up the repair invoice",
      "taskTitle": "Handle the windscreen insurance case of 204 JLM",
      "dueAtUtc": "2026-10-04T17:08:58.762036+00:00",
      "aboutKind": 1,
      "aboutLabel": "204 JLM",
      "aboutRecordExists": true,
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    },
    {
      "taskId": "0fb137f4-476c-476c-868d-0bb7eff4e87c",
      "stepId": null,
      "title": "Practice: sell the practice car",
      "taskTitle": "Practice: sell the practice car",
      "dueAtUtc": null,
      "aboutKind": 1,
      "aboutLabel": null,
      "aboutRecordExists": false,
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "taskId": "a1d3f5b7-0006-4a1d-9a1d-000000000006",
      "stepId": null,
      "title": "Order two spare key fobs",
      "taskTitle": "Order two spare key fobs",
      "dueAtUtc": null,
      "aboutKind": null,
      "aboutLabel": null,
      "aboutRecordExists": false,
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "pageNumber": 1,
  "pageSize": 100,
  "totalCount": 5,
  "totalPages": 1
};
