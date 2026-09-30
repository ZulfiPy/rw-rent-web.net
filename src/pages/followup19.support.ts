import type {
  InsuranceCaseDeletionCandidateResponse, PagedResponse, ProblemDetails, RecordDeletionCandidateCountsResponse, RecordDeletionListItemResponse, RecordDeletionResponse, SecurityAuditResponse, VehicleDeletionCandidateResponse,
} from '@/api/dto';

/**
 * Follow-up 19’s fixtures: the API’s answers exactly as round 14 gave them (port 5003, round 14’s
 * Release build, `rwrent_r14` freshly seeded, 2026-09-30), in the joint check’s first run: Dita’s
 * practice case on 770 HDV with a registration photo, a note, an event with a photo and a casco case
 * of the same car naming it, then closed; Karlis’s practice car P19 26C with a closed case, which a
 * case of 444 WKS names as the same accident; the deletions page’s lists and counts; an open case
 * refused; the practice case and then the car deleted, with their answers and entries; and the
 * recently deleted. Typed as the DTOs, so a member the API sends and `dto.ts` does not declare fails
 * the typecheck. Only the tests import this module.
 */

export const R14_CAPTURED_AT = '2026-09-30T12:05:40.690014+00:00';

/** GET …/candidates/insurance-cases?Show=1: the closed cases, newest registered first */
export const caseCandidatesOutOfUse: PagedResponse<InsuranceCaseDeletionCandidateResponse> = {
  "items": [
    {
      "id": "ea70af72-c6c6-44e1-8a2e-d5b7b40199d3",
      "recordLabel": "P19 26C · Practice: the bonnet dented",
      "vehicleId": "86f9927d-68eb-42e6-901d-6660c7a29be6",
      "vehiclePlateNumber": "P19 26C",
      "type": 1,
      "damage": "Practice: the bonnet dented",
      "status": 5,
      "happenedAtUtc": "2026-09-27T12:05:40.690542+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": "2026-09-30T10:05:40.690542+00:00",
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 1,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 1,
          "accidentLinksCleared": 1
        }
      }
    },
    {
      "id": "2b88e445-be08-440a-aec2-f8bf940c614e",
      "recordLabel": "770 HDV · Practice: front left door scratched",
      "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
      "vehiclePlateNumber": "770 HDV",
      "type": 1,
      "damage": "Practice: front left door scratched",
      "status": 5,
      "happenedAtUtc": "2026-09-28T12:05:40.690542+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": "2026-09-30T11:05:40.690542+00:00",
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 2,
          "insuranceCaseNotes": 1,
          "insuranceCasePhotos": 2,
          "accidentLinksCleared": 1
        }
      }
    },
    {
      "id": "c3e5a7b9-0006-4c3e-9c3e-000000000006",
      "recordLabel": "400 NDP · Right mirror broken by a passing van",
      "vehicleId": "1a5c8e30-0010-41a5-91a5-000000000010",
      "vehiclePlateNumber": "400 NDP",
      "type": 1,
      "damage": "Right mirror broken by a passing van",
      "status": 5,
      "happenedAtUtc": "2026-08-31T09:15:00+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": "2026-09-22T10:00:00+00:00",
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 3,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 1,
          "accidentLinksCleared": 0
        }
      }
    },
    {
      "id": "c3e5a7b9-0007-4c3e-9c3e-000000000007",
      "recordLabel": "119 MPR · Rear door dented in a car park, the other car left",
      "vehicleId": "1a5c8e30-0002-41a5-91a5-000000000002",
      "vehiclePlateNumber": "119 MPR",
      "type": 1,
      "damage": "Rear door dented in a car park, the other car left",
      "status": 5,
      "happenedAtUtc": "2026-08-16T13:00:00+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": "2026-09-10T11:00:00+00:00",
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 2,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 0
        }
      }
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 4,
  "totalPages": 1
};

/** GET …/candidates/insurance-cases?Show=2: every case */
export const caseCandidatesEverything: PagedResponse<InsuranceCaseDeletionCandidateResponse> = {
  "items": [
    {
      "id": "54680478-769a-4e84-81c7-5042946617b4",
      "recordLabel": "444 WKS · Practice: the other car of the same accident",
      "vehicleId": "1a5c8e30-0009-41a5-91a5-000000000009",
      "vehiclePlateNumber": "444 WKS",
      "type": 1,
      "damage": "Practice: the other car of the same accident",
      "status": 1,
      "happenedAtUtc": "2026-09-27T12:05:40.690542+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": null,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 9,
            "count": 1,
            "records": []
          }
        ],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 0,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 0
        }
      }
    },
    {
      "id": "ea70af72-c6c6-44e1-8a2e-d5b7b40199d3",
      "recordLabel": "P19 26C · Practice: the bonnet dented",
      "vehicleId": "86f9927d-68eb-42e6-901d-6660c7a29be6",
      "vehiclePlateNumber": "P19 26C",
      "type": 1,
      "damage": "Practice: the bonnet dented",
      "status": 5,
      "happenedAtUtc": "2026-09-27T12:05:40.690542+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": "2026-09-30T10:05:40.690542+00:00",
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 1,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 1,
          "accidentLinksCleared": 1
        }
      }
    },
    {
      "id": "1cd01e00-aafd-419f-af76-a7272e5a4ab4",
      "recordLabel": "770 HDV · Practice: the casco claim of the same door",
      "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
      "vehiclePlateNumber": "770 HDV",
      "type": 2,
      "damage": "Practice: the casco claim of the same door",
      "status": 1,
      "happenedAtUtc": "2026-09-28T12:05:40.690542+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": null,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 9,
            "count": 1,
            "records": []
          }
        ],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 0,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 0
        }
      }
    },
    {
      "id": "2b88e445-be08-440a-aec2-f8bf940c614e",
      "recordLabel": "770 HDV · Practice: front left door scratched",
      "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
      "vehiclePlateNumber": "770 HDV",
      "type": 1,
      "damage": "Practice: front left door scratched",
      "status": 5,
      "happenedAtUtc": "2026-09-28T12:05:40.690542+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": "2026-09-30T11:05:40.690542+00:00",
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 2,
          "insuranceCaseNotes": 1,
          "insuranceCasePhotos": 2,
          "accidentLinksCleared": 1
        }
      }
    },
    {
      "id": "c3e5a7b9-0002-4c3e-9c3e-000000000002",
      "recordLabel": "204 JLM · Windscreen cracked by a stone",
      "vehicleId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "vehiclePlateNumber": "204 JLM",
      "type": 2,
      "damage": "Windscreen cracked by a stone",
      "status": 4,
      "happenedAtUtc": "2026-09-29T10:25:00+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": null,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 9,
            "count": 1,
            "records": []
          }
        ],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 2,
          "insuranceCaseNotes": 1,
          "insuranceCasePhotos": 2,
          "accidentLinksCleared": 0
        }
      }
    },
    {
      "id": "c3e5a7b9-0003-4c3e-9c3e-000000000003",
      "recordLabel": "770 HDV · Long scratches on both left doors",
      "vehicleId": "1a5c8e30-0003-41a5-91a5-000000000003",
      "vehiclePlateNumber": "770 HDV",
      "type": 1,
      "damage": "Long scratches on both left doors",
      "status": 1,
      "happenedAtUtc": "2026-09-28T05:40:00+00:00",
      "timeIsWhenFound": true,
      "closedAtUtc": null,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 9,
            "count": 1,
            "records": []
          }
        ],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 0,
          "insuranceCaseNotes": 1,
          "insuranceCasePhotos": 3,
          "accidentLinksCleared": 0
        }
      }
    },
    {
      "id": "c3e5a7b9-0005-4c3e-9c3e-000000000005",
      "recordLabel": "482 TKL · Front bumper and right headlight",
      "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
      "vehiclePlateNumber": "482 TKL",
      "type": 2,
      "damage": "Front bumper and right headlight",
      "status": 2,
      "happenedAtUtc": "2026-09-25T14:50:00+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": null,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 9,
            "count": 1,
            "records": []
          }
        ],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 2,
          "insuranceCaseNotes": 1,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 0
        }
      }
    },
    {
      "id": "c3e5a7b9-0004-4c3e-9c3e-000000000004",
      "recordLabel": "482 TKL · Front bumper and right headlight",
      "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
      "vehiclePlateNumber": "482 TKL",
      "type": 1,
      "damage": "Front bumper and right headlight",
      "status": 2,
      "happenedAtUtc": "2026-09-25T14:50:00+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": null,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 9,
            "count": 1,
            "records": []
          }
        ],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 3,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 1
        }
      }
    },
    {
      "id": "c3e5a7b9-0001-4c3e-9c3e-000000000001",
      "recordLabel": "552 KLM · Rear bumper and boot lid dented",
      "vehicleId": "1a5c8e30-0007-41a5-91a5-000000000007",
      "vehiclePlateNumber": "552 KLM",
      "type": 1,
      "damage": "Rear bumper and boot lid dented",
      "status": 3,
      "happenedAtUtc": "2026-09-11T05:35:00+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": null,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 9,
            "count": 1,
            "records": []
          }
        ],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 7,
          "insuranceCaseNotes": 2,
          "insuranceCasePhotos": 6,
          "accidentLinksCleared": 0
        }
      }
    },
    {
      "id": "c3e5a7b9-0006-4c3e-9c3e-000000000006",
      "recordLabel": "400 NDP · Right mirror broken by a passing van",
      "vehicleId": "1a5c8e30-0010-41a5-91a5-000000000010",
      "vehiclePlateNumber": "400 NDP",
      "type": 1,
      "damage": "Right mirror broken by a passing van",
      "status": 5,
      "happenedAtUtc": "2026-08-31T09:15:00+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": "2026-09-22T10:00:00+00:00",
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 3,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 1,
          "accidentLinksCleared": 0
        }
      }
    },
    {
      "id": "c3e5a7b9-0007-4c3e-9c3e-000000000007",
      "recordLabel": "119 MPR · Rear door dented in a car park, the other car left",
      "vehicleId": "1a5c8e30-0002-41a5-91a5-000000000002",
      "vehiclePlateNumber": "119 MPR",
      "type": 1,
      "damage": "Rear door dented in a car park, the other car left",
      "status": 5,
      "happenedAtUtc": "2026-08-16T13:00:00+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": "2026-09-10T11:00:00+00:00",
      "deletion": {
        "state": 1,
        "blocks": [],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 2,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 0
        }
      }
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 11,
  "totalPages": 1
};

/** Everything searched for "baltic": the cases naming Baltic Mutual on either side */
export const caseCandidatesSearchBaltic: PagedResponse<InsuranceCaseDeletionCandidateResponse> = {
  "items": [
    {
      "id": "c3e5a7b9-0002-4c3e-9c3e-000000000002",
      "recordLabel": "204 JLM · Windscreen cracked by a stone",
      "vehicleId": "1a5c8e30-0006-41a5-91a5-000000000006",
      "vehiclePlateNumber": "204 JLM",
      "type": 2,
      "damage": "Windscreen cracked by a stone",
      "status": 4,
      "happenedAtUtc": "2026-09-29T10:25:00+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": null,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 9,
            "count": 1,
            "records": []
          }
        ],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 2,
          "insuranceCaseNotes": 1,
          "insuranceCasePhotos": 2,
          "accidentLinksCleared": 0
        }
      }
    },
    {
      "id": "c3e5a7b9-0005-4c3e-9c3e-000000000005",
      "recordLabel": "482 TKL · Front bumper and right headlight",
      "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
      "vehiclePlateNumber": "482 TKL",
      "type": 2,
      "damage": "Front bumper and right headlight",
      "status": 2,
      "happenedAtUtc": "2026-09-25T14:50:00+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": null,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 9,
            "count": 1,
            "records": []
          }
        ],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 2,
          "insuranceCaseNotes": 1,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 0
        }
      }
    },
    {
      "id": "c3e5a7b9-0004-4c3e-9c3e-000000000004",
      "recordLabel": "482 TKL · Front bumper and right headlight",
      "vehicleId": "1a5c8e30-0001-41a5-91a5-000000000001",
      "vehiclePlateNumber": "482 TKL",
      "type": 1,
      "damage": "Front bumper and right headlight",
      "status": 2,
      "happenedAtUtc": "2026-09-25T14:50:00+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": null,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 9,
            "count": 1,
            "records": []
          }
        ],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 3,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 1
        }
      }
    },
    {
      "id": "c3e5a7b9-0001-4c3e-9c3e-000000000001",
      "recordLabel": "552 KLM · Rear bumper and boot lid dented",
      "vehicleId": "1a5c8e30-0007-41a5-91a5-000000000007",
      "vehiclePlateNumber": "552 KLM",
      "type": 1,
      "damage": "Rear bumper and boot lid dented",
      "status": 3,
      "happenedAtUtc": "2026-09-11T05:35:00+00:00",
      "timeIsWhenFound": false,
      "closedAtUtc": null,
      "deletion": {
        "state": 2,
        "blocks": [
          {
            "reason": 9,
            "count": 1,
            "records": []
          }
        ],
        "takes": {
          "rentalAssignments": 0,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 0,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 7,
          "insuranceCaseNotes": 2,
          "insuranceCasePhotos": 6,
          "accidentLinksCleared": 0
        }
      }
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 4,
  "totalPages": 1
};

export const countsOutOfUse19: RecordDeletionCandidateCountsResponse = {
  "rentalAssignments": 6,
  "driverAuthorizations": 2,
  "interruptions": 2,
  "vehicles": 2,
  "customers": 1,
  "drivers": 1,
  "insuranceCases": 4
};

export const countsEverything19: RecordDeletionCandidateCountsResponse = {
  "rentalAssignments": 12,
  "driverAuthorizations": 6,
  "interruptions": 4,
  "vehicles": 11,
  "customers": 8,
  "drivers": 7,
  "insuranceCases": 11
};

/** GET …/candidates/vehicles?Show=2 with the practice car P19 26C first */
export const vehicleCandidates19: PagedResponse<VehicleDeletionCandidateResponse> = {
  "items": [
    {
      "id": "86f9927d-68eb-42e6-901d-6660c7a29be6",
      "recordLabel": "P19 26C · Fiat Panda 2020",
      "plateNumber": "P19 26C",
      "vinCode": "ACC1926C8CF000000",
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
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 0,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 1
        }
      }
    },
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
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 0,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 0
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
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 0,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 0
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
        "state": 2,
        "blocks": [
          {
            "reason": 8,
            "count": 1,
            "records": [
              {
                "kind": 7,
                "id": "54680478-769a-4e84-81c7-5042946617b4",
                "label": "444 WKS · Practice: the other car of the same accident"
              }
            ]
          }
        ],
        "takes": {
          "rentalAssignments": 1,
          "driverAuthorizations": 0,
          "interruptions": 0,
          "customerLinksCleared": 0,
          "insuranceCases": 1,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 0,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 0
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
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 0,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 0
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
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 0,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 0
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
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 0,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 0
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
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 0,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 0
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
            "count": 2,
            "records": [
              {
                "kind": 7,
                "id": "1cd01e00-aafd-419f-af76-a7272e5a4ab4",
                "label": "770 HDV · Practice: the casco claim of the same door"
              },
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
          "insuranceCases": 3,
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 0,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 0
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
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 0,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 0
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
          "insuranceCaseDriversCleared": 0,
          "insuranceCaseEvents": 0,
          "insuranceCaseNotes": 0,
          "insuranceCasePhotos": 0,
          "accidentLinksCleared": 0
        }
      }
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 11,
  "totalPages": 1
};

/** Deleting 204 JLM's open case: refused with reason 9's sentence */
export const openCaseRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "This insurance case is open. Close it first; then it can be deleted.",
  "code": "record_deletions.blocked"
};

/** The practice case deleted: its answer */
export const practiceCaseDeleted: RecordDeletionResponse = {
  "auditEntryId": "90931695-03e8-4d2c-8f41-4c847221fdaa",
  "kind": 7,
  "recordLabel": "770 HDV · Practice: front left door scratched",
  "deletedAuthorizationCount": 0,
  "deletedInterruptionCount": 0,
  "deletedRentalAssignmentCount": 0,
  "clearedCustomerLinkCount": 0,
  "deletedInsuranceCaseCount": 0,
  "clearedInsuranceCaseDriverCount": 0,
  "deletedInsuranceCaseEventCount": 2,
  "deletedInsuranceCaseNoteCount": 1,
  "deletedInsuranceCasePhotoCount": 2,
  "clearedAccidentLinkCount": 1
};

/** The same deletion again */
export const practiceCaseGoneRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/404",
  "title": "Not Found",
  "status": 404,
  "detail": "Insurance case '2b88e445-be08-440a-aec2-f8bf940c614e' was not found.",
  "code": "record_deletions.not_found"
};

/** Its InsuranceCase.Deleted entry, as Signe reads it */
export const practiceCaseEntry: SecurityAuditResponse = {
  "id": "90931695-03e8-4d2c-8f41-4c847221fdaa",
  "eventType": "InsuranceCase.Deleted",
  "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
  "actorDisplayName": "Arturs Veidenbaums",
  "occurredAtUtc": "2026-09-30T12:05:41.263185+00:00",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "targetUserId": null,
  "targetDisplayName": null,
  "entityType": "InsuranceCase",
  "entityId": "2b88e445-be08-440a-aec2-f8bf940c614e",
  "reason": "Practice or test record",
  "beforeJson": "{\"Id\": \"2b88e445-be08-440a-aec2-f8bf940c614e\", \"Type\": \"Usual\", \"Notes\": [{\"Id\": \"231bbbfc-421e-42d5-a546-7838371f86c3\", \"Text\": \"Practice note of Follow-up 19.\", \"CreatedAtUtc\": \"2026-09-30T12:05:40.911933+00:00\", \"UpdatedAtUtc\": null, \"CreatedByUserId\": \"9f2b7c41-0004-4a10-8b01-000000000004\", \"UpdatedByUserId\": null, \"CreatedByDisplayName\": \"Dita Smite\", \"UpdatedByDisplayName\": null}], \"Place\": \"Parnu mnt 10, Tallinn\", \"Damage\": \"Practice: front left door scratched\", \"Events\": [{\"Id\": \"9c2342a1-8bfd-44ad-9123-c4913ca8bd59\", \"Title\": \"Photos sent to the insurer\", \"Photos\": [{\"Id\": \"bfc85f1a-cc76-4a9b-8e52-1133d874e628\", \"FileName\": \"door-sent.png\", \"ContentType\": \"image/png\", \"SizeInBytes\": 64, \"CreatedAtUtc\": \"2026-09-30T12:05:40.952808+00:00\", \"CreatedByUserId\": \"9f2b7c41-0004-4a10-8b01-000000000004\", \"CreatedByDisplayName\": \"Dita Smite\"}], \"Description\": null, \"CreatedAtUtc\": \"2026-09-30T12:05:40.955746+00:00\", \"UpdatedAtUtc\": null, \"HappenedAtUtc\": \"2026-09-29T12:05:40.690542+00:00\", \"CreatedByUserId\": \"9f2b7c41-0004-4a10-8b01-000000000004\", \"StatusChangedTo\": \"Reported\", \"UpdatedByUserId\": null, \"WaitingForChangedTo\": \"Insurer\", \"CreatedByDisplayName\": \"Dita Smite\", \"UpdatedByDisplayName\": null}, {\"Id\": \"62670fb2-5355-48ee-a565-843130d66328\", \"Title\": \"Closed for practice\", \"Photos\": [], \"Description\": null, \"CreatedAtUtc\": \"2026-09-30T12:05:41.009917+00:00\", \"UpdatedAtUtc\": null, \"HappenedAtUtc\": \"2026-09-30T11:05:40.690542+00:00\", \"CreatedByUserId\": \"9f2b7c41-0004-4a10-8b01-000000000004\", \"StatusChangedTo\": \"Closed\", \"UpdatedByUserId\": null, \"WaitingForChangedTo\": \"Nobody\", \"CreatedByDisplayName\": \"Dita Smite\", \"UpdatedByDisplayName\": null}], \"Photos\": [{\"Id\": \"3d82cf73-229b-4ff2-86b6-d1223c246da3\", \"FileName\": \"door-registered.png\", \"ContentType\": \"image/png\", \"SizeInBytes\": 64, \"CreatedAtUtc\": \"2026-09-30T12:05:40.808328+00:00\", \"CreatedByUserId\": \"9f2b7c41-0004-4a10-8b01-000000000004\", \"CreatedByDisplayName\": \"Dita Smite\"}], \"Status\": \"Closed\", \"AtFault\": null, \"DriverId\": null, \"HandledBy\": null, \"VehicleId\": \"1a5c8e30-0003-41a5-91a5-000000000003\", \"OurInsurer\": null, \"WaitingFor\": \"Nobody\", \"Description\": null, \"RecordLabel\": \"770 HDV · Practice: front left door scratched\", \"CreatedAtUtc\": \"2026-09-30T12:05:40.820828+00:00\", \"DeletionNote\": null, \"OtherInsurer\": null, \"OurInsurerId\": null, \"UpdatedAtUtc\": \"2026-09-30T12:05:41.009917+00:00\", \"HappenedAtUtc\": \"2026-09-28T12:05:40.690542+00:00\", \"DeletionReason\": \"PracticeOrTestRecord\", \"OtherInsurerId\": null, \"OurClaimNumber\": null, \"CreatedByUserId\": \"9f2b7c41-0004-4a10-8b01-000000000004\", \"TimeIsWhenFound\": false, \"UpdatedByUserId\": \"9f2b7c41-0004-4a10-8b01-000000000004\", \"ConcurrencyToken\": \"e9d799dc-ac89-4eb8-8828-3e0878c50312\", \"OtherClaimNumber\": null, \"DriverDisplayName\": null, \"PlaceIsWhereFound\": false, \"SameAccidentCaseId\": null, \"VehiclePlateNumber\": \"770 HDV\", \"ClearedAccidentLinks\": [{\"InsuranceCaseId\": \"1cd01e00-aafd-419f-af76-a7272e5a4ab4\", \"InsuranceCaseLabel\": \"770 HDV · Practice: the casco claim of the same door\"}], \"CreatedByDisplayName\": \"Dita Smite\", \"UpdatedByDisplayName\": \"Dita Smite\", \"SameAccidentCaseLabel\": null}",
  "afterJson": null
};

/** P19 26C deleted with its case: its answer */
export const practiceCar19Deleted: RecordDeletionResponse = {
  "auditEntryId": "4e04a0dc-5662-41de-8064-6095ce3b62eb",
  "kind": 4,
  "recordLabel": "P19 26C · Fiat Panda 2020",
  "deletedAuthorizationCount": 0,
  "deletedInterruptionCount": 0,
  "deletedRentalAssignmentCount": 0,
  "clearedCustomerLinkCount": 0,
  "deletedInsuranceCaseCount": 1,
  "clearedInsuranceCaseDriverCount": 0,
  "deletedInsuranceCaseEventCount": 0,
  "deletedInsuranceCaseNoteCount": 0,
  "deletedInsuranceCasePhotoCount": 0,
  "clearedAccidentLinkCount": 1
};

/** Its Vehicle.Deleted entry */
export const practiceCar19Entry: SecurityAuditResponse = {
  "id": "4e04a0dc-5662-41de-8064-6095ce3b62eb",
  "eventType": "Vehicle.Deleted",
  "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
  "actorDisplayName": "Arturs Veidenbaums",
  "occurredAtUtc": "2026-09-30T12:05:41.41541+00:00",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "targetUserId": null,
  "targetDisplayName": null,
  "entityType": "Vehicle",
  "entityId": "86f9927d-68eb-42e6-901d-6660c7a29be6",
  "reason": "Practice or test record",
  "beforeJson": "{\"Id\": \"86f9927d-68eb-42e6-901d-6660c7a29be6\", \"Make\": \"Fiat\", \"Year\": 2020, \"Color\": \"White\", \"Model\": \"Panda\", \"VinCode\": \"ACC1926C8CF000000\", \"BodyType\": \"Sedan\", \"FuelType\": \"Petrol\", \"IsActive\": true, \"GearboxType\": \"Manual\", \"PlateNumber\": \"P19 26C\", \"RecordLabel\": \"P19 26C · Fiat Panda 2020\", \"CreatedAtUtc\": \"2026-09-30T12:05:41.053127+00:00\", \"DeletionNote\": null, \"UpdatedAtUtc\": null, \"DeletionReason\": \"PracticeOrTestRecord\", \"InsuranceCases\": [{\"Id\": \"ea70af72-c6c6-44e1-8a2e-d5b7b40199d3\", \"Type\": \"Usual\", \"Notes\": [], \"Place\": \"Practice yard\", \"Damage\": \"Practice: the bonnet dented\", \"Events\": [{\"Id\": \"a2d45db9-3a86-4bd9-bcc1-a5769bd787bb\", \"Title\": \"Repaired at our cost\", \"Photos\": [], \"Description\": null, \"CreatedAtUtc\": \"2026-09-30T12:05:41.117148+00:00\", \"UpdatedAtUtc\": null, \"HappenedAtUtc\": \"2026-09-30T10:05:40.690542+00:00\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"StatusChangedTo\": \"Closed\", \"UpdatedByUserId\": null, \"WaitingForChangedTo\": \"Nobody\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": null}], \"Photos\": [{\"Id\": \"2b872090-33e6-467f-961f-9e26d787105b\", \"FileName\": \"bonnet.png\", \"ContentType\": \"image/png\", \"SizeInBytes\": 64, \"CreatedAtUtc\": \"2026-09-30T12:05:41.078851+00:00\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\"}], \"Status\": \"Closed\", \"AtFault\": null, \"DriverId\": null, \"HandledBy\": null, \"VehicleId\": \"86f9927d-68eb-42e6-901d-6660c7a29be6\", \"OurInsurer\": null, \"WaitingFor\": \"Nobody\", \"Description\": null, \"RecordLabel\": \"P19 26C · Practice: the bonnet dented\", \"CreatedAtUtc\": \"2026-09-30T12:05:41.079204+00:00\", \"OtherInsurer\": null, \"OurInsurerId\": null, \"UpdatedAtUtc\": \"2026-09-30T12:05:41.117148+00:00\", \"HappenedAtUtc\": \"2026-09-27T12:05:40.690542+00:00\", \"OtherInsurerId\": null, \"OurClaimNumber\": null, \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"TimeIsWhenFound\": false, \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"ConcurrencyToken\": \"c0f530d5-9063-4c7f-851e-d9665ce23738\", \"OtherClaimNumber\": null, \"DriverDisplayName\": null, \"PlaceIsWhereFound\": false, \"SameAccidentCaseId\": null, \"VehiclePlateNumber\": \"P19 26C\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\", \"SameAccidentCaseLabel\": null}], \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": null, \"RentalAssignments\": [], \"ClearedAccidentLinks\": [{\"InsuranceCaseId\": \"54680478-769a-4e84-81c7-5042946617b4\", \"InsuranceCaseLabel\": \"444 WKS · Practice: the other car of the same accident\"}], \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": null}",
  "afterJson": null
};

/** Recently deleted after both */
export const deletionsMade19: PagedResponse<RecordDeletionListItemResponse> = {
  "items": [
    {
      "auditEntryId": "4e04a0dc-5662-41de-8064-6095ce3b62eb",
      "occurredAtUtc": "2026-09-30T12:05:41.41541+00:00",
      "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "actorDisplayName": "Arturs Veidenbaums",
      "kind": 4,
      "recordLabel": "P19 26C · Fiat Panda 2020",
      "reason": 2,
      "note": null
    },
    {
      "auditEntryId": "90931695-03e8-4d2c-8f41-4c847221fdaa",
      "occurredAtUtc": "2026-09-30T12:05:41.263185+00:00",
      "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
      "actorDisplayName": "Arturs Veidenbaums",
      "kind": 7,
      "recordLabel": "770 HDV · Practice: front left door scratched",
      "reason": 2,
      "note": null
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 2,
  "totalPages": 1
};
