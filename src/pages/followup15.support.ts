import type { PagedResponse, WorkTaskCountsResponse, WorkTaskListItemResponse } from '@/api/dto';

/**
 * Follow-up 15’s fixtures: the scratch API’s answers (port 5002, round 11’s Release build,
 * `rwrent_check` freshly seeded, 2026-09-26) after the practice tasks were added through the API
 * as the owner’s reviewer added them: Dita’s task with a title of 171 characters about 204 JLM,
 * with Toms’s Add to Bolt, his overdue step of 81 characters, her own step, and his step she marked
 * done; and her short task with his permit-fee step. Typed as the DTOs; only the tests import this
 * module. The seed’s and the practice tasks’ times are relative to when they were made, so the tests
 * read these with the clock set to `P15_CAPTURED_AT`.
 */

export const P15_CAPTURED_AT = '2026-09-26T03:34:33.921145+00:00';

/** Dita’s counts with the two practice tasks she created. */
export const p15CountsDita: WorkTaskCountsResponse = {
  "myTasks": 7,
  "involvingMe": 1,
  "finished": 1,
  "toDo": 5
};

/** Dita’s My tasks: the seed’s five and her two practice tasks, in the server’s order. */
export const p15MyTasksDita: PagedResponse<WorkTaskListItemResponse> = {
  "items": [
    {
      "id": "a1d3f5b7-0002-4a1d-9a1d-000000000002",
      "title": "Reassign the parking fine to the driver",
      "status": 1,
      "dueAtUtc": "2026-09-25T09:33:28.192297+00:00",
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
      "createdAtUtc": "2026-09-23T04:35:28.192297+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
      "title": "Prepare 204 JLM for a rental",
      "status": 1,
      "dueAtUtc": "2026-09-29T06:33:28.192297+00:00",
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
          "doneAtUtc": "2026-09-25T05:53:28.192297+00:00",
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
          "dueAtUtc": "2026-09-29T06:33:28.192297+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": true,
      "createdAtUtc": "2026-09-24T03:47:28.192297+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "4e0be14e-ca7d-497d-a230-96166134d87f",
      "title": "Collect the winter tyres for 204 JLM and 552 KLM from the Mustamäe storage, check the tread depth on every tyre and book the fitting at the workshop before the first frost",
      "status": 1,
      "dueAtUtc": "2026-10-02T03:34:12+00:00",
      "closedAtUtc": null,
      "aboutKind": 1,
      "aboutRecordId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "aboutLabel": "204 JLM",
      "aboutRecordExists": true,
      "stepCount": 4,
      "doneStepCount": 1,
      "people": [
        "Toms Rudzitis",
        "Dita Smite"
      ],
      "yourSteps": [
        {
          "id": "fafd3703-c237-4a2f-9f9a-b69b2c736f37",
          "position": 3,
          "title": "Book the fitting at the workshop",
          "responsibleUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
          "responsibleDisplayName": "Dita Smite",
          "dueAtUtc": "2026-09-30T03:34:12+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": true,
      "createdAtUtc": "2026-09-26T03:34:13.007632+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "6164ea53-2d3d-431f-88bf-083e191dcc04",
      "title": "Renew the parking permit",
      "status": 1,
      "dueAtUtc": "2026-10-05T03:34:13+00:00",
      "closedAtUtc": null,
      "aboutKind": null,
      "aboutRecordId": null,
      "aboutLabel": null,
      "aboutRecordExists": false,
      "stepCount": 1,
      "doneStepCount": 0,
      "people": [
        "Toms Rudzitis"
      ],
      "yourSteps": [],
      "viewerIsCreator": true,
      "createdAtUtc": "2026-09-26T03:34:13.12388+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0005-4a1d-9a1d-000000000005",
      "title": "Handle the windscreen insurance case of 204 JLM",
      "status": 1,
      "dueAtUtc": "2026-10-06T10:33:28.192297+00:00",
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
      "createdAtUtc": "2026-09-21T06:03:28.192297+00:00",
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
      "createdAtUtc": "2026-09-25T03:38:28.192297+00:00",
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
          "doneAtUtc": "2026-09-24T04:38:28.192297+00:00",
          "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
          "doneByDisplayName": "Dita Smite",
          "canMarkDone": false,
          "canUndo": true
        }
      ],
      "viewerIsCreator": true,
      "createdAtUtc": "2026-09-22T03:23:28.192297+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 7,
  "totalPages": 1
};

/** Dita’s Involving me: unchanged by the practice tasks, which are her own. */
export const p15InvolvingDita: PagedResponse<WorkTaskListItemResponse> = {
  "items": [
    {
      "id": "a1d3f5b7-0005-4a1d-9a1d-000000000005",
      "title": "Handle the windscreen insurance case of 204 JLM",
      "status": 1,
      "dueAtUtc": "2026-10-06T10:33:28.192297+00:00",
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
      "createdAtUtc": "2026-09-21T06:03:28.192297+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1
};

/** Toms’s counts with his practice steps. */
export const p15CountsToms: WorkTaskCountsResponse = {
  "myTasks": 5,
  "involvingMe": 5,
  "finished": 0,
  "toDo": 5
};

/** Toms’s My tasks: the seed’s three and the two practice tasks with his steps: the long title, Add to Bolt, the overdue step of 81 characters, the step Dita marked, the permit fee. */
export const p15MyTasksToms: PagedResponse<WorkTaskListItemResponse> = {
  "items": [
    {
      "id": "4e0be14e-ca7d-497d-a230-96166134d87f",
      "title": "Collect the winter tyres for 204 JLM and 552 KLM from the Mustamäe storage, check the tread depth on every tyre and book the fitting at the workshop before the first frost",
      "status": 1,
      "dueAtUtc": "2026-10-02T03:34:12+00:00",
      "closedAtUtc": null,
      "aboutKind": 1,
      "aboutRecordId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "aboutLabel": "204 JLM",
      "aboutRecordExists": true,
      "stepCount": 4,
      "doneStepCount": 1,
      "people": [
        "Toms Rudzitis",
        "Dita Smite"
      ],
      "yourSteps": [
        {
          "id": "f8d44515-104b-485d-bd1a-cacbabe7cbf1",
          "position": 1,
          "title": "Add to Bolt",
          "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "responsibleDisplayName": "Toms Rudzitis",
          "dueAtUtc": "2026-09-28T03:34:12+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        },
        {
          "id": "41bfa126-f46d-42a9-8cb7-bf50d9d150b4",
          "position": 2,
          "title": "Ask the storage for the tyre hotel receipt and photograph each tyre's tread depth",
          "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "responsibleDisplayName": "Toms Rudzitis",
          "dueAtUtc": "2026-09-25T03:34:12+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        },
        {
          "id": "eb35ac59-5f8e-47e7-9bec-09ca30eba52c",
          "position": 4,
          "title": "Tell both drivers when the fitting is booked and where to bring the cars",
          "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "responsibleDisplayName": "Toms Rudzitis",
          "dueAtUtc": "2026-10-01T03:34:12+00:00",
          "doneAtUtc": "2026-09-26T03:34:13.091432+00:00",
          "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
          "doneByDisplayName": "Dita Smite",
          "canMarkDone": false,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-26T03:34:13.007632+00:00",
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
          "id": "b2e4a6c8-0042-4b2e-9b2e-000000000042",
          "position": 2,
          "title": "Tell the driver the time",
          "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "responsibleDisplayName": "Toms Rudzitis",
          "dueAtUtc": "2026-09-25T11:33:28.192297+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-22T03:23:28.192297+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
      "title": "Prepare 204 JLM for a rental",
      "status": 1,
      "dueAtUtc": "2026-09-29T06:33:28.192297+00:00",
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
          "dueAtUtc": "2026-09-27T04:33:28.192297+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-24T03:47:28.192297+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "6164ea53-2d3d-431f-88bf-083e191dcc04",
      "title": "Renew the parking permit",
      "status": 1,
      "dueAtUtc": "2026-10-05T03:34:13+00:00",
      "closedAtUtc": null,
      "aboutKind": null,
      "aboutRecordId": null,
      "aboutLabel": null,
      "aboutRecordExists": false,
      "stepCount": 1,
      "doneStepCount": 0,
      "people": [
        "Toms Rudzitis"
      ],
      "yourSteps": [
        {
          "id": "31c7d9a0-bebc-4e97-9d05-9802bed6a2fd",
          "position": 1,
          "title": "Pay the permit fee in the city portal",
          "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "responsibleDisplayName": "Toms Rudzitis",
          "dueAtUtc": "2026-09-29T03:34:13+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-26T03:34:13.12388+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0005-4a1d-9a1d-000000000005",
      "title": "Handle the windscreen insurance case of 204 JLM",
      "status": 1,
      "dueAtUtc": "2026-10-06T10:33:28.192297+00:00",
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
          "doneAtUtc": "2026-09-23T08:43:28.192297+00:00",
          "doneByUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "doneByDisplayName": "Toms Rudzitis",
          "canMarkDone": false,
          "canUndo": true
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-21T06:03:28.192297+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 5,
  "totalPages": 1
};

/** Toms’s Involving me: the same five tasks. */
export const p15InvolvingToms: PagedResponse<WorkTaskListItemResponse> = {
  "items": [
    {
      "id": "4e0be14e-ca7d-497d-a230-96166134d87f",
      "title": "Collect the winter tyres for 204 JLM and 552 KLM from the Mustamäe storage, check the tread depth on every tyre and book the fitting at the workshop before the first frost",
      "status": 1,
      "dueAtUtc": "2026-10-02T03:34:12+00:00",
      "closedAtUtc": null,
      "aboutKind": 1,
      "aboutRecordId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "aboutLabel": "204 JLM",
      "aboutRecordExists": true,
      "stepCount": 4,
      "doneStepCount": 1,
      "people": [
        "Toms Rudzitis",
        "Dita Smite"
      ],
      "yourSteps": [
        {
          "id": "f8d44515-104b-485d-bd1a-cacbabe7cbf1",
          "position": 1,
          "title": "Add to Bolt",
          "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "responsibleDisplayName": "Toms Rudzitis",
          "dueAtUtc": "2026-09-28T03:34:12+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        },
        {
          "id": "41bfa126-f46d-42a9-8cb7-bf50d9d150b4",
          "position": 2,
          "title": "Ask the storage for the tyre hotel receipt and photograph each tyre's tread depth",
          "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "responsibleDisplayName": "Toms Rudzitis",
          "dueAtUtc": "2026-09-25T03:34:12+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        },
        {
          "id": "eb35ac59-5f8e-47e7-9bec-09ca30eba52c",
          "position": 4,
          "title": "Tell both drivers when the fitting is booked and where to bring the cars",
          "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "responsibleDisplayName": "Toms Rudzitis",
          "dueAtUtc": "2026-10-01T03:34:12+00:00",
          "doneAtUtc": "2026-09-26T03:34:13.091432+00:00",
          "doneByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
          "doneByDisplayName": "Dita Smite",
          "canMarkDone": false,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-26T03:34:13.007632+00:00",
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
          "id": "b2e4a6c8-0042-4b2e-9b2e-000000000042",
          "position": 2,
          "title": "Tell the driver the time",
          "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "responsibleDisplayName": "Toms Rudzitis",
          "dueAtUtc": "2026-09-25T11:33:28.192297+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-22T03:23:28.192297+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0001-4a1d-9a1d-000000000001",
      "title": "Prepare 204 JLM for a rental",
      "status": 1,
      "dueAtUtc": "2026-09-29T06:33:28.192297+00:00",
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
          "dueAtUtc": "2026-09-27T04:33:28.192297+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-24T03:47:28.192297+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "6164ea53-2d3d-431f-88bf-083e191dcc04",
      "title": "Renew the parking permit",
      "status": 1,
      "dueAtUtc": "2026-10-05T03:34:13+00:00",
      "closedAtUtc": null,
      "aboutKind": null,
      "aboutRecordId": null,
      "aboutLabel": null,
      "aboutRecordExists": false,
      "stepCount": 1,
      "doneStepCount": 0,
      "people": [
        "Toms Rudzitis"
      ],
      "yourSteps": [
        {
          "id": "31c7d9a0-bebc-4e97-9d05-9802bed6a2fd",
          "position": 1,
          "title": "Pay the permit fee in the city portal",
          "responsibleUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "responsibleDisplayName": "Toms Rudzitis",
          "dueAtUtc": "2026-09-29T03:34:13+00:00",
          "doneAtUtc": null,
          "doneByUserId": null,
          "doneByDisplayName": null,
          "canMarkDone": true,
          "canUndo": false
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-26T03:34:13.12388+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "a1d3f5b7-0005-4a1d-9a1d-000000000005",
      "title": "Handle the windscreen insurance case of 204 JLM",
      "status": 1,
      "dueAtUtc": "2026-10-06T10:33:28.192297+00:00",
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
          "doneAtUtc": "2026-09-23T08:43:28.192297+00:00",
          "doneByUserId": "9f2b7c41-0005-4a10-8b01-000000000005",
          "doneByDisplayName": "Toms Rudzitis",
          "canMarkDone": false,
          "canUndo": true
        }
      ],
      "viewerIsCreator": false,
      "createdAtUtc": "2026-09-21T06:03:28.192297+00:00",
      "createdByUserId": "9f2b7c41-0002-4a10-8b01-000000000002",
      "createdByDisplayName": "Signe Priede"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 5,
  "totalPages": 1
};
