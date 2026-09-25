import type {
  PagedResponse, WorkTaskCountsResponse, WorkTaskListItemResponse, WorkTaskResponse, WorkTaskToDoItemResponse,
} from '@/api/dto';

/**
 * Follow-up 13’s fixtures: round 11’s answers exactly as the API gave them on the scratch stack (port
 * 5002, round 11’s Release build, `rwrent_check` freshly seeded, 2026-09-25), where My tasks holds
 * the tasks a person created and the tasks of others in which they have a step. The seeded people’s
 * counts and views as each of them reads them, one Due filter, Toms’s to-do list, and two marks with
 * what followed them. Follow-up 12’s fixtures (`followup12.support.ts`) stay round 10’s answers for
 * everything round 11 did not change. Typed as the DTOs; only the tests import this module.
 *
 * The seed’s times are relative to the moment it was seeded, so the tests read these with the clock
 * set to `R11_CAPTURED_AT`, when the answers were given.
 */

export const R11_CAPTURED_AT = '2026-09-25T04:54:57.682974+00:00';

/** Dita Smite: four tasks of her own and one of Signe’s with her step. */
export const r11CountsDita: WorkTaskCountsResponse = {
  "myTasks": 5,
  "involvingMe": 1,
  "finished": 1,
  "toDo": 4
};

/** Dita’s My tasks: her four open tasks and Signe’s windscreen case, in the server’s order. */
export const r11MyTasksDita: PagedResponse<WorkTaskListItemResponse> = {
  "items": [
    {
      "id": "a1d3f5b7-0002-4a1d-9a1d-000000000002",
      "title": "Reassign the parking fine to the driver",
      "status": 1,
      "dueAtUtc": "2026-09-24T10:54:31.075864+00:00",
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
      "createdAtUtc": "2026-09-22T05:56:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
      "title": "Prepare 204 JLM for a rental",
      "status": 1,
      "dueAtUtc": "2026-09-28T07:54:31.075864+00:00",
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
          "doneAtUtc": "2026-09-24T07:14:31.075864+00:00",
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
          "dueAtUtc": "2026-09-28T07:54:31.075864+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": true,
      "createdAtUtc": "2026-09-23T05:08:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0005-4a1d-9a1d-000000000005",
      "title": "Handle the windscreen insurance case of 204 JLM",
      "status": 1,
      "dueAtUtc": "2026-10-05T11:54:31.075864+00:00",
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
      "createdAtUtc": "2026-09-20T07:24:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
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
      "createdAtUtc": "2026-09-24T04:59:31.075864+00:00",
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
          "doneAtUtc": "2026-09-23T05:59:31.075864+00:00",
          "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
          "doneByDisplayName": "Dita Smite",
          "canMarkDone": false,
          "canUndo": true
        }
      ],
      "viewerIsCreator": true,
      "createdAtUtc": "2026-09-21T04:44:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 5,
  "totalPages": 1
};

export const r11CountsSigne: WorkTaskCountsResponse = {
  "myTasks": 3,
  "involvingMe": 1,
  "finished": 2,
  "toDo": 2
};

/** Signe’s My tasks: her two open tasks and Dita’s Prepare 204 JLM, where she has a step. */
export const r11MyTasksSigne: PagedResponse<WorkTaskListItemResponse> = {
  "items": [
    {
      "id": "a1d3f5b7-0003-4a1d-9a1d-000000000003",
      "title": "Prepare the rental agreement for Martins Ozols",
      "status": 1,
      "dueAtUtc": "2026-09-25T12:54:31.075864+00:00",
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
      "createdAtUtc": "2026-09-24T12:34:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    },
    {
      "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
      "title": "Prepare 204 JLM for a rental",
      "status": 1,
      "dueAtUtc": "2026-09-28T07:54:31.075864+00:00",
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
          "dueAtUtc": "2026-09-27T11:54:31.075864+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-23T05:08:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0005-4a1d-9a1d-000000000005",
      "title": "Handle the windscreen insurance case of 204 JLM",
      "status": 1,
      "dueAtUtc": "2026-10-05T11:54:31.075864+00:00",
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
          "doneAtUtc": "2026-09-23T05:34:31.075864+00:00",
          "doneByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
          "doneByDisplayName": "Signe Priede",
          "canMarkDone": false,
          "canUndo": true
        }
      ],
      "viewerIsCreator": true,
      "createdAtUtc": "2026-09-20T07:24:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 3,
  "totalPages": 1
};

export const r11CountsToms: WorkTaskCountsResponse = {
  "myTasks": 3,
  "involvingMe": 3,
  "finished": 0,
  "toDo": 2
};

/** Toms’s My tasks: none of his own; the three tasks with his steps. */
export const r11MyTasksToms: PagedResponse<WorkTaskListItemResponse> = {
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
          "dueAtUtc": "2026-09-24T12:54:31.075864+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-21T04:44:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
      "title": "Prepare 204 JLM for a rental",
      "status": 1,
      "dueAtUtc": "2026-09-28T07:54:31.075864+00:00",
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
          "dueAtUtc": "2026-09-26T05:54:31.075864+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-23T05:08:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0005-4a1d-9a1d-000000000005",
      "title": "Handle the windscreen insurance case of 204 JLM",
      "status": 1,
      "dueAtUtc": "2026-10-05T11:54:31.075864+00:00",
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
          "doneAtUtc": "2026-09-22T10:04:31.075864+00:00",
          "doneByUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "doneByDisplayName": "Toms Rudzitis",
          "canMarkDone": false,
          "canUndo": true
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-20T07:24:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 3,
  "totalPages": 1
};

export const r11CountsKarlis: WorkTaskCountsResponse = {
  "myTasks": 0,
  "involvingMe": 0,
  "finished": 0,
  "toDo": 0
};

/** Karlis’s My tasks: on no task, the empty list as the API gives it. */
export const r11MyTasksKarlis: PagedResponse<WorkTaskListItemResponse> = {
  "items": [],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 0,
  "totalPages": 0
};

export const r11InvolvingDita: PagedResponse<WorkTaskListItemResponse> = {
  "items": [
    {
      "id": "a1d3f5b7-0005-4a1d-9a1d-000000000005",
      "title": "Handle the windscreen insurance case of 204 JLM",
      "status": 1,
      "dueAtUtc": "2026-10-05T11:54:31.075864+00:00",
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
      "createdAtUtc": "2026-09-20T07:24:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1
};

export const r11InvolvingToms: PagedResponse<WorkTaskListItemResponse> = {
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
          "dueAtUtc": "2026-09-24T12:54:31.075864+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-21T04:44:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
      "title": "Prepare 204 JLM for a rental",
      "status": 1,
      "dueAtUtc": "2026-09-28T07:54:31.075864+00:00",
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
          "dueAtUtc": "2026-09-26T05:54:31.075864+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-23T05:08:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0005-4a1d-9a1d-000000000005",
      "title": "Handle the windscreen insurance case of 204 JLM",
      "status": 1,
      "dueAtUtc": "2026-10-05T11:54:31.075864+00:00",
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
          "doneAtUtc": "2026-09-22T10:04:31.075864+00:00",
          "doneByUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "doneByDisplayName": "Toms Rudzitis",
          "canMarkDone": false,
          "canUndo": true
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-20T07:24:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 3,
  "totalPages": 1
};

export const r11MyTasksTomsOverdue: PagedResponse<WorkTaskListItemResponse> = {
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
          "dueAtUtc": "2026-09-24T12:54:31.075864+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-21T04:44:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1
};

export const r11ToDoToms: PagedResponse<WorkTaskToDoItemResponse> = {
  "items": [
    {
      "taskId": "a1d3f5b7-0004-4a1d-9a1d-000000000004",
      "stepId": "b2e4a6c8-0042-4b2e-9b2e-000000000042",
      "title": "Tell the driver the time",
      "taskTitle": "Book a service for 444 WKS and tell the driver",
      "dueAtUtc": "2026-09-24T12:54:31.075864+00:00",
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
      "dueAtUtc": "2026-09-26T05:54:31.075864+00:00",
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

/** Toms marks Car wash from his My tasks. */
export const r11MarkCarWashToms: WorkTaskResponse = {
  "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
  "title": "Prepare 204 JLM for a rental",
  "description": "Adding it to Bolt comes first. The car wash can happen any time before the handover.",
  "dueAtUtc": "2026-09-28T07:54:31.075864+00:00",
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
      "doneAtUtc": "2026-09-24T07:14:31.075864+00:00",
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
      "dueAtUtc": "2026-09-27T11:54:31.075864+00:00",
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
      "dueAtUtc": "2026-09-26T05:54:31.075864+00:00",
      "doneAtUtc": "2026-09-25T04:54:58.919655+00:00",
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
      "dueAtUtc": "2026-09-28T07:54:31.075864+00:00",
      "doneAtUtc": null,
      "doneByUserId": null,
      "doneByDisplayName": null,
      "canMarkDone": false,
      "canUndo": false
    }
  ],
  "viewerIsCreator": false,
  "canChange": false,
  "concurrencyToken": "390de9d9-beb9-4b8a-98b0-57c00a3a72c3",
  "createdAtUtc": "2026-09-23T05:08:31.075864+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-25T04:54:58.927196+00:00",
  "updatedByUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
  "updatedByDisplayName": "Toms Rudzitis"
};

export const r11CountsTomsAfterMark: WorkTaskCountsResponse = {
  "myTasks": 3,
  "involvingMe": 3,
  "finished": 0,
  "toDo": 1
};

export const r11ToDoTomsAfterMark: PagedResponse<WorkTaskToDoItemResponse> = {
  "items": [
    {
      "taskId": "a1d3f5b7-0004-4a1d-9a1d-000000000004",
      "stepId": "b2e4a6c8-0042-4b2e-9b2e-000000000042",
      "title": "Tell the driver the time",
      "taskTitle": "Book a service for 444 WKS and tell the driver",
      "dueAtUtc": "2026-09-24T12:54:31.075864+00:00",
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

/** Toms’s My tasks after that mark: Car wash done by him, Undo offered. */
export const r11MyTasksTomsAfterMark: PagedResponse<WorkTaskListItemResponse> = {
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
          "dueAtUtc": "2026-09-24T12:54:31.075864+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-21T04:44:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
      "title": "Prepare 204 JLM for a rental",
      "status": 1,
      "dueAtUtc": "2026-09-28T07:54:31.075864+00:00",
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
          "dueAtUtc": "2026-09-26T05:54:31.075864+00:00",
          "doneAtUtc": "2026-09-25T04:54:58.919655+00:00",
          "doneByUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "doneByDisplayName": "Toms Rudzitis",
          "canMarkDone": false,
          "canUndo": true
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-23T05:08:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0005-4a1d-9a1d-000000000005",
      "title": "Handle the windscreen insurance case of 204 JLM",
      "status": 1,
      "dueAtUtc": "2026-10-05T11:54:31.075864+00:00",
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
          "doneAtUtc": "2026-09-22T10:04:31.075864+00:00",
          "doneByUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "doneByDisplayName": "Toms Rudzitis",
          "canMarkDone": false,
          "canUndo": true
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-20T07:24:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 3,
  "totalPages": 1
};

/** Dita, creator of Book a service, marks Toms’s Tell the driver the time. */
export const r11MarkTellDriverByDita: WorkTaskResponse = {
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
  "doneStepCount": 2,
  "steps": [
    {
      "id": "b2e4a6c8-0041-4b2e-9b2e-000000000041",
      "position": 1,
      "title": "Book the service appointment",
      "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "responsibleDisplayName": "Dita Smite",
      "dueAtUtc": null,
      "doneAtUtc": "2026-09-23T05:59:31.075864+00:00",
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
      "dueAtUtc": "2026-09-24T12:54:31.075864+00:00",
      "doneAtUtc": "2026-09-25T04:54:58.988655+00:00",
      "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "doneByDisplayName": "Dita Smite",
      "canMarkDone": false,
      "canUndo": true
    }
  ],
  "viewerIsCreator": true,
  "canChange": true,
  "concurrencyToken": "4e21e84d-491c-4621-b48c-12e2c762562d",
  "createdAtUtc": "2026-09-21T04:44:31.075864+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-25T04:54:58.988903+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

/** Toms’s My tasks after Dita’s mark: done by her, no action of his; the task moves, as the server orders it. */
export const r11MyTasksTomsAfterDitaMark: PagedResponse<WorkTaskListItemResponse> = {
  "items": [
    {
      "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
      "title": "Prepare 204 JLM for a rental",
      "status": 1,
      "dueAtUtc": "2026-09-28T07:54:31.075864+00:00",
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
          "dueAtUtc": "2026-09-26T05:54:31.075864+00:00",
          "doneAtUtc": "2026-09-25T04:54:58.919655+00:00",
          "doneByUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "doneByDisplayName": "Toms Rudzitis",
          "canMarkDone": false,
          "canUndo": true
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-23T05:08:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0005-4a1d-9a1d-000000000005",
      "title": "Handle the windscreen insurance case of 204 JLM",
      "status": 1,
      "dueAtUtc": "2026-10-05T11:54:31.075864+00:00",
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
          "doneAtUtc": "2026-09-22T10:04:31.075864+00:00",
          "doneByUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "doneByDisplayName": "Toms Rudzitis",
          "canMarkDone": false,
          "canUndo": true
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-20T07:24:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
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
      "doneStepCount": 2,
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
          "dueAtUtc": "2026-09-24T12:54:31.075864+00:00",
          "doneAtUtc": "2026-09-25T04:54:58.988655+00:00",
          "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
          "doneByDisplayName": "Dita Smite",
          "canMarkDone": false,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-21T04:44:31.075864+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 3,
  "totalPages": 1
};
