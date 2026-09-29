import type {
  DriverDeletionCandidateResponse, InsuranceCaseCountsResponse, InsuranceCaseResponse, ProblemDetails, RecordDeletionResponse, SecurityAuditResponse, VehicleDeletionCandidateResponse,
} from '@/api/dto';

/**
 * Follow-up 17's joint check, as the API answered it on the scratch stack (port 5002, round 12's
 * Release build): the practice case Dita registered, its event, its correction and note; 552 KLM
 * with the casco case of its accident; and a practice car and driver on the deletions page, blocked
 * by an open case, then deleted with it. Typed as the DTOs; only the tests import this module. The
 * tests read these with the clock set to `PRACTICE_AT`, when the answers were given.
 *
 * Follow-up 18 moved the cases to round 13's contract: each insurer, a name in round 12, is the
 * seeded insurer of that name as round 13 gives it (`followup17.support.ts` says how). The deletions'
 * audit copies stay as round 12 wrote them, with the names: a copy is never rewritten.
 */

export const PRACTICE_AT = "2026-09-27T09:12:53.205408+00:00";

export const practiceRegistered: InsuranceCaseResponse = {
  "id": "72e34e23-de09-40ab-afdc-874d27d6627e",
  "type": 1,
  "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
  "vehiclePlate": "770 HDV",
  "vehicleLabel": "770 HDV · Audi A4",
  "damage": "Practice: the right mirror scratched",
  "description": null,
  "happenedAtUtc": "2026-09-27T08:42:00+00:00",
  "timeIsWhenFound": false,
  "place": "Practice yard, Tallinn",
  "placeIsWhereFound": false,
  "driverId": "6e1b3f72-0002-46e1-96e1-000000000002",
  "driverDisplayName": "Ilze Berzina",
  "rental": {
    "rentalAssignmentId": "2d7b5c86-0002-42d7-92d7-000000000002",
    "customerDisplayName": "Ilze Berzina",
    "startedAtUtc": "2026-09-23T09:12:50.276743+00:00",
    "closedAtUtc": null
  },
  "ourInsurer": {
    "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
    "name": "Baltic Mutual",
    "email": "claims@balticmutual.example",
    "phoneNumber": "+371 6700 1100",
    "isActive": true
  },
  "ourClaimNumber": null,
  "otherInsurer": null,
  "otherClaimNumber": null,
  "handledBy": null,
  "status": 1,
  "waitingFor": 1,
  "waitingSinceUtc": "2026-09-27T09:12:53.409178+00:00",
  "closedAtUtc": null,
  "atFault": null,
  "sameAccidentCaseId": null,
  "sameAccidentCases": [],
  "photos": [
    {
      "id": "0b5958b9-c9e7-4463-bdec-cd60879dc30a",
      "fileName": "mirror-1.png",
      "contentType": "image/png",
      "sizeInBytes": 2366,
      "createdAtUtc": "2026-09-27T09:12:53.395639+00:00",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "5c8284bc-6a6d-436b-a00f-1c602dd82e10",
      "fileName": "mirror-2.png",
      "contentType": "image/png",
      "sizeInBytes": 2329,
      "createdAtUtc": "2026-09-27T09:12:53.395639+00:00",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "events": [],
  "notes": [],
  "canChange": true,
  "concurrencyToken": "0cb1a742-65ff-4c02-a77c-e1bf31485e33",
  "createdAtUtc": "2026-09-27T09:12:53.409178+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": null,
  "updatedByUserId": null,
  "updatedByDisplayName": null
};

export const practiceAfterEvent: InsuranceCaseResponse = {
  "id": "72e34e23-de09-40ab-afdc-874d27d6627e",
  "type": 1,
  "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
  "vehiclePlate": "770 HDV",
  "vehicleLabel": "770 HDV · Audi A4",
  "damage": "Practice: the right mirror scratched",
  "description": null,
  "happenedAtUtc": "2026-09-27T08:42:00+00:00",
  "timeIsWhenFound": false,
  "place": "Practice yard, Tallinn",
  "placeIsWhereFound": false,
  "driverId": "6e1b3f72-0002-46e1-96e1-000000000002",
  "driverDisplayName": "Ilze Berzina",
  "rental": {
    "rentalAssignmentId": "2d7b5c86-0002-42d7-92d7-000000000002",
    "customerDisplayName": "Ilze Berzina",
    "startedAtUtc": "2026-09-23T09:12:50.276743+00:00",
    "closedAtUtc": null
  },
  "ourInsurer": {
    "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
    "name": "Baltic Mutual",
    "email": "claims@balticmutual.example",
    "phoneNumber": "+371 6700 1100",
    "isActive": true
  },
  "ourClaimNumber": null,
  "otherInsurer": null,
  "otherClaimNumber": null,
  "handledBy": null,
  "status": 2,
  "waitingFor": 3,
  "waitingSinceUtc": "2026-09-27T09:02:00+00:00",
  "closedAtUtc": null,
  "atFault": null,
  "sameAccidentCaseId": null,
  "sameAccidentCases": [],
  "photos": [
    {
      "id": "0b5958b9-c9e7-4463-bdec-cd60879dc30a",
      "fileName": "mirror-1.png",
      "contentType": "image/png",
      "sizeInBytes": 2366,
      "createdAtUtc": "2026-09-27T09:12:53.395639+00:00",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "5c8284bc-6a6d-436b-a00f-1c602dd82e10",
      "fileName": "mirror-2.png",
      "contentType": "image/png",
      "sizeInBytes": 2329,
      "createdAtUtc": "2026-09-27T09:12:53.395639+00:00",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "events": [
    {
      "id": "2745c6da-28a9-4a89-b20f-028b5ce8414f",
      "happenedAtUtc": "2026-09-27T09:02:00+00:00",
      "title": "Reported to Baltic Mutual",
      "description": "By phone.",
      "statusChangedTo": 2,
      "waitingForChangedTo": 3,
      "photos": [
        {
          "id": "f06e03e9-389d-45b3-96d2-77adfb8a00a9",
          "fileName": "report.png",
          "contentType": "image/png",
          "sizeInBytes": 780,
          "createdAtUtc": "2026-09-27T09:12:53.538189+00:00",
          "createdByDisplayName": "Dita Smite"
        }
      ],
      "createdAtUtc": "2026-09-27T09:12:53.54135+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    }
  ],
  "notes": [],
  "canChange": true,
  "concurrencyToken": "1baddf4a-3f24-471e-a5b9-81aaa69c2107",
  "createdAtUtc": "2026-09-27T09:12:53.409178+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-27T09:12:53.54135+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const countsAfterEvent: InsuranceCaseCountsResponse = {
  "open": 6,
  "waitingForUs": 2,
  "closed": 2
};

export const practiceFinal: InsuranceCaseResponse = {
  "id": "72e34e23-de09-40ab-afdc-874d27d6627e",
  "type": 1,
  "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
  "vehiclePlate": "770 HDV",
  "vehicleLabel": "770 HDV · Audi A4",
  "damage": "Practice: the right mirror scratched",
  "description": null,
  "happenedAtUtc": "2026-09-27T08:42:00+00:00",
  "timeIsWhenFound": false,
  "place": "Practice yard, Tallinn",
  "placeIsWhereFound": false,
  "driverId": "6e1b3f72-0002-46e1-96e1-000000000002",
  "driverDisplayName": "Ilze Berzina",
  "rental": {
    "rentalAssignmentId": "2d7b5c86-0002-42d7-92d7-000000000002",
    "customerDisplayName": "Ilze Berzina",
    "startedAtUtc": "2026-09-23T09:12:50.276743+00:00",
    "closedAtUtc": null
  },
  "ourInsurer": {
    "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
    "name": "Baltic Mutual",
    "email": "claims@balticmutual.example",
    "phoneNumber": "+371 6700 1100",
    "isActive": true
  },
  "ourClaimNumber": "BM-PRACTICE-1",
  "otherInsurer": null,
  "otherClaimNumber": null,
  "handledBy": 1,
  "status": 2,
  "waitingFor": 3,
  "waitingSinceUtc": "2026-09-27T09:02:00+00:00",
  "closedAtUtc": null,
  "atFault": 2,
  "sameAccidentCaseId": null,
  "sameAccidentCases": [],
  "photos": [
    {
      "id": "0b5958b9-c9e7-4463-bdec-cd60879dc30a",
      "fileName": "mirror-1.png",
      "contentType": "image/png",
      "sizeInBytes": 2366,
      "createdAtUtc": "2026-09-27T09:12:53.395639+00:00",
      "createdByDisplayName": "Dita Smite"
    },
    {
      "id": "5c8284bc-6a6d-436b-a00f-1c602dd82e10",
      "fileName": "mirror-2.png",
      "contentType": "image/png",
      "sizeInBytes": 2329,
      "createdAtUtc": "2026-09-27T09:12:53.395639+00:00",
      "createdByDisplayName": "Dita Smite"
    }
  ],
  "events": [
    {
      "id": "2745c6da-28a9-4a89-b20f-028b5ce8414f",
      "happenedAtUtc": "2026-09-27T09:02:00+00:00",
      "title": "Reported to Baltic Mutual by phone",
      "description": null,
      "statusChangedTo": 2,
      "waitingForChangedTo": 3,
      "photos": [],
      "createdAtUtc": "2026-09-27T09:12:53.54135+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": "2026-09-27T09:12:53.670103+00:00",
      "canCorrect": true
    }
  ],
  "notes": [
    {
      "id": "30634fbd-1291-477f-b174-efc4bbcb91b4",
      "text": "Practice note: the mirror glass is fine.",
      "createdAtUtc": "2026-09-27T09:12:53.712749+00:00",
      "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
      "createdByDisplayName": "Dita Smite",
      "updatedAtUtc": null,
      "canCorrect": true
    }
  ],
  "canChange": true,
  "concurrencyToken": "05f2e723-bdc4-40ab-8c71-a2cf8bbc2b76",
  "createdAtUtc": "2026-09-27T09:12:53.409178+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-27T09:12:53.602359+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const klmWithCasco: InsuranceCaseResponse = {
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
    "startedAtUtc": "2026-08-28T09:12:50.276743+00:00",
    "closedAtUtc": null
  },
  "ourInsurer": {
    "id": "a7c9e1f3-0001-4a7c-9a7c-000000000001",
    "name": "Baltic Mutual",
    "email": "claims@balticmutual.example",
    "phoneNumber": "+371 6700 1100",
    "isActive": true
  },
  "ourClaimNumber": "BM-26-04417",
  "otherInsurer": {
    "id": "a7c9e1f3-0002-4a7c-9a7c-000000000002",
    "name": "Meridian Insurance",
    "email": "claims@meridian-insurance.example",
    "phoneNumber": "+372 600 2200",
    "isActive": true
  },
  "otherClaimNumber": "MI-2026-118305",
  "handledBy": 2,
  "status": 3,
  "waitingFor": 3,
  "waitingSinceUtc": "2026-09-20T11:40:00+00:00",
  "closedAtUtc": null,
  "atFault": null,
  "sameAccidentCaseId": null,
  "sameAccidentCases": [
    {
      "id": "ee5adabf-8db2-4a70-bb58-35e214ddc3e5",
      "label": "552 KLM · Rear bumper and boot lid dented",
      "type": 2,
      "status": 1
    }
  ],
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
  "concurrencyToken": "40b5dabf-2115-4c44-a3f3-dba3feda7522",
  "createdAtUtc": "2026-09-08T07:05:00+00:00",
  "createdByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "createdByDisplayName": "Dita Smite",
  "updatedAtUtc": "2026-09-21T07:33:00+00:00",
  "updatedByUserId": "9f2b7c41-0004-4a10-8b01-000000000004",
  "updatedByDisplayName": "Dita Smite"
};

export const practiceCarBlocked: VehicleDeletionCandidateResponse = {
  "id": "2be82007-f0c7-4eb7-94f2-53e24a8cfabd",
  "recordLabel": "P17 24B · Fiat Panda 2020",
  "plateNumber": "P17 24B",
  "vinCode": "ACC1724B8CF000000",
  "make": "Fiat",
  "model": "Panda",
  "year": 2020,
  "isActive": true,
  "deletion": {
    "state": 2,
    "blocks": [
      {
        "reason": 8,
        "count": 1,
        "records": [
          {
            "kind": 7,
            "id": "15e20eff-0292-4350-afcc-d5ef4c6de2ab",
            "label": "P17 24B · Practice: the bonnet dented"
          }
        ]
      }
    ],
    "takes": {
      "rentalAssignments": 0,
      "driverAuthorizations": 0,
      "interruptions": 0,
      "customerLinksCleared": 0,
      "insuranceCases": 1,
      "insuranceCaseDriversCleared": 0
    }
  }
};

export const practiceCarBlockedRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "One of its insurance cases is open. Close it first; then the vehicle can be deleted with its cases.",
  "code": "record_deletions.blocked"
};

export const practiceCarReady: VehicleDeletionCandidateResponse = {
  "id": "2be82007-f0c7-4eb7-94f2-53e24a8cfabd",
  "recordLabel": "P17 24B · Fiat Panda 2020",
  "plateNumber": "P17 24B",
  "vinCode": "ACC1724B8CF000000",
  "make": "Fiat",
  "model": "Panda",
  "year": 2020,
  "isActive": true,
  "deletion": {
    "state": 1,
    "blocks": [],
    "takes": {
      "rentalAssignments": 0,
      "driverAuthorizations": 0,
      "interruptions": 0,
      "customerLinksCleared": 0,
      "insuranceCases": 1,
      "insuranceCaseDriversCleared": 0
    }
  }
};

export const practiceCarDeleted: RecordDeletionResponse = {
  "auditEntryId": "5109cea6-3da7-4fd6-bc7d-78127ee37bc9",
  "kind": 4,
  "recordLabel": "P17 24B · Fiat Panda 2020",
  "deletedAuthorizationCount": 0,
  "deletedInterruptionCount": 0,
  "deletedRentalAssignmentCount": 0,
  "clearedCustomerLinkCount": 0,
  "deletedInsuranceCaseCount": 1,
  "clearedInsuranceCaseDriverCount": 0
};

export const practiceCarEntry: SecurityAuditResponse = {
  "id": "5109cea6-3da7-4fd6-bc7d-78127ee37bc9",
  "eventType": "Vehicle.Deleted",
  "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
  "actorDisplayName": "Arturs Veidenbaums",
  "occurredAtUtc": "2026-09-27T09:12:54.244343+00:00",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "targetUserId": null,
  "targetDisplayName": null,
  "entityType": "Vehicle",
  "entityId": "2be82007-f0c7-4eb7-94f2-53e24a8cfabd",
  "reason": "Practice or test record",
  "beforeJson": "{\"Id\": \"2be82007-f0c7-4eb7-94f2-53e24a8cfabd\", \"Make\": \"Fiat\", \"Year\": 2020, \"Color\": \"White\", \"Model\": \"Panda\", \"VinCode\": \"ACC1724B8CF000000\", \"BodyType\": \"Sedan\", \"FuelType\": \"Petrol\", \"IsActive\": true, \"GearboxType\": \"Manual\", \"PlateNumber\": \"P17 24B\", \"RecordLabel\": \"P17 24B · Fiat Panda 2020\", \"CreatedAtUtc\": \"2026-09-27T09:12:53.914979+00:00\", \"DeletionNote\": null, \"UpdatedAtUtc\": null, \"DeletionReason\": \"PracticeOrTestRecord\", \"InsuranceCases\": [{\"Id\": \"15e20eff-0292-4350-afcc-d5ef4c6de2ab\", \"Type\": \"Usual\", \"Notes\": [], \"Place\": \"Practice yard\", \"Damage\": \"Practice: the bonnet dented\", \"Events\": [{\"Id\": \"4569c302-d278-4cc3-8626-7cb46ec6a8d7\", \"Title\": \"Repaired at our cost\", \"Photos\": [], \"Description\": null, \"CreatedAtUtc\": \"2026-09-27T09:12:54.120618+00:00\", \"UpdatedAtUtc\": null, \"HappenedAtUtc\": \"2026-09-27T08:12:00+00:00\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"StatusChangedTo\": \"Closed\", \"UpdatedByUserId\": null, \"WaitingForChangedTo\": \"Nobody\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": null}], \"Photos\": [{\"Id\": \"94b0e276-4738-460c-a19c-8e4062bfa2df\", \"FileName\": \"bonnet.png\", \"ContentType\": \"image/png\", \"SizeInBytes\": 135, \"CreatedAtUtc\": \"2026-09-27T09:12:53.995684+00:00\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\"}], \"Status\": \"Closed\", \"AtFault\": null, \"DriverId\": null, \"HandledBy\": null, \"VehicleId\": \"2be82007-f0c7-4eb7-94f2-53e24a8cfabd\", \"OurInsurer\": null, \"WaitingFor\": \"Nobody\", \"Description\": null, \"RecordLabel\": \"P17 24B · Practice: the bonnet dented\", \"CreatedAtUtc\": \"2026-09-27T09:12:53.995952+00:00\", \"OtherInsurer\": null, \"UpdatedAtUtc\": \"2026-09-27T09:12:54.120618+00:00\", \"HappenedAtUtc\": \"2026-09-25T09:12:00+00:00\", \"OurClaimNumber\": null, \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"TimeIsWhenFound\": false, \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"ConcurrencyToken\": \"bb11065e-9a94-41f9-b36f-fb4dc6dedac7\", \"OtherClaimNumber\": null, \"DriverDisplayName\": null, \"PlaceIsWhereFound\": false, \"SameAccidentCaseId\": null, \"VehiclePlateNumber\": \"P17 24B\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\", \"SameAccidentCaseLabel\": null}], \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": null, \"RentalAssignments\": [], \"ClearedAccidentLinks\": [{\"InsuranceCaseId\": \"1d610f31-e6ac-4125-a1b6-1b89c47d298f\", \"InsuranceCaseLabel\": \"444 WKS · Practice: the other car of the same accident\"}], \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": null}",
  "afterJson": null
};

export const practiceDriverCandidate: DriverDeletionCandidateResponse = {
  "id": "8fcb05cb-bf03-433e-aafc-66195cbade7b",
  "recordLabel": "Prakse Vaditajs24B8CF · LV-P17-24B8CF",
  "firstName": "Prakse",
  "lastName": "Vaditajs24B8CF",
  "email": "practice17.24b8cf@example.com",
  "driverLicenseNumber": "LV-P17-24B8CF",
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
      "insuranceCaseDriversCleared": 1
    }
  }
};

export const practiceDriverDeleted: RecordDeletionResponse = {
  "auditEntryId": "7d336297-4bce-4962-820d-a092de8e928a",
  "kind": 6,
  "recordLabel": "Prakse Vaditajs24B8CF · LV-P17-24B8CF",
  "deletedAuthorizationCount": 0,
  "deletedInterruptionCount": 0,
  "deletedRentalAssignmentCount": 0,
  "clearedCustomerLinkCount": 0,
  "deletedInsuranceCaseCount": 0,
  "clearedInsuranceCaseDriverCount": 1
};

export const practiceDriverEntry: SecurityAuditResponse = {
  "id": "7d336297-4bce-4962-820d-a092de8e928a",
  "eventType": "Driver.Deleted",
  "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
  "actorDisplayName": "Arturs Veidenbaums",
  "occurredAtUtc": "2026-09-27T09:12:54.33621+00:00",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "targetUserId": null,
  "targetDisplayName": null,
  "entityType": "Driver",
  "entityId": "8fcb05cb-bf03-433e-aafc-66195cbade7b",
  "reason": "Practice or test record",
  "beforeJson": "{\"Id\": \"8fcb05cb-bf03-433e-aafc-66195cbade7b\", \"Email\": \"practice17.24b8cf@example.com\", \"Address\": \"Practice street 1\", \"IsActive\": true, \"LastName\": \"Vaditajs24B8CF\", \"FirstName\": \"Prakse\", \"PersonalId\": null, \"DateOfBirth\": \"1990-05-05\", \"PhoneNumber\": \"+37121009400\", \"RecordLabel\": \"Prakse Vaditajs24B8CF · LV-P17-24B8CF\", \"CreatedAtUtc\": \"2026-09-27T09:12:53.972682+00:00\", \"DeletionNote\": null, \"UpdatedAtUtc\": null, \"Authorizations\": [], \"DeletionReason\": \"PracticeOrTestRecord\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": null, \"DriverLicenseNumber\": \"LV-P17-24B8CF\", \"ClearedCustomerLinks\": [], \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": null, \"ClearedInsuranceCaseDrivers\": [{\"InsuranceCaseId\": \"1d610f31-e6ac-4125-a1b6-1b89c47d298f\", \"InsuranceCaseLabel\": \"444 WKS · Practice: the other car of the same accident\"}]}",
  "afterJson": null
};

export const countsAtEnd: InsuranceCaseCountsResponse = {
  "open": 8,
  "waitingForUs": 4,
  "closed": 2
};
