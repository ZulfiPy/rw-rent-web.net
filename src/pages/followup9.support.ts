import type {
  CustomerDeletionCandidateResponse, DriverDeletionCandidateResponse, ProblemDetails,
  RecordDeletionListItemResponse, RecordDeletionResponse, SecurityAuditResponse,
  VehicleDeletionCandidateResponse,
} from '@/api/dto';

/**
 * Follow-up 9's fixtures: the backend's round-8 answers exactly as the API gave them on the scratch
 * stack (port 5002, 2026-09-22), for records the seeded Fleet Manager built for the purpose.
 *
 * - A vehicle (Toyota Yaris) that takes two rentals with it — an Ended one with its cover and an
 *   interruption, and a Cancelled one whose cover the cancellation stopped — and its deletion.
 * - A customer (Lake House) who takes an Ended rental with parts and a Planned one, and the deletion.
 * - A customer (Two Cars) with two running rentals, both covered by one driver (Ilmars Kronbergs)
 *   alone: the plural of reasons 6 and 7.
 * - A driver (Arta Skuja) who takes two authorizations — an open one beside a colleague's on a
 *   running rental, and one on an Ended rental — and whose own customer record is linked to them;
 *   the deletion, its entry, and the entry one of those authorizations left against its rental.
 * - The API's own refusals of a running rental and of a vehicle with one.
 *
 * Typed as the DTOs, so a member the API sends and `dto.ts` does not declare fails the typecheck.
 * Only the tests import this module.
 */

export const runningRentalRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "This rental assignment is running (Active). End it first; then it can be deleted.",
  "code": "record_deletions.blocked"
};

export const runningVehicleRefusal: ProblemDetails = {
  "type": "https://httpstatuses.com/409",
  "title": "Conflict",
  "status": 409,
  "detail": "One of its rental assignments is running (Active). End it first; then the record can be deleted with its rentals.",
  "code": "record_deletions.blocked"
};

export const vehicleWithRentals: VehicleDeletionCandidateResponse = {
  "id": "5651e890-58fb-4147-8df7-69d6f6596cdb",
  "recordLabel": "F9 D09 · Toyota Yaris 2021",
  "plateNumber": "F9 D09",
  "vinCode": "F9VIND09F04D09FXX",
  "make": "Toyota",
  "model": "Yaris",
  "year": 2021,
  "isActive": false,
  "deletion": {
    "state": 1,
    "blocks": [],
    "takes": {
      "rentalAssignments": 2,
      "driverAuthorizations": 2,
      "interruptions": 1,
      "customerLinksCleared": 0
    }
  }
};

export const vehicleWithRentalsDeleted: RecordDeletionResponse = {
  "auditEntryId": "636ab5d2-2b8b-46ba-b348-784f7580d127",
  "kind": 4,
  "recordLabel": "F9 D09 · Toyota Yaris 2021",
  "deletedAuthorizationCount": 2,
  "deletedInterruptionCount": 1,
  "deletedRentalAssignmentCount": 2,
  "clearedCustomerLinkCount": 0
};

export const vehicleWithRentalsEntry: SecurityAuditResponse = {
  "id": "636ab5d2-2b8b-46ba-b348-784f7580d127",
  "eventType": "Vehicle.Deleted",
  "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
  "actorDisplayName": "Arturs Veidenbaums",
  "occurredAtUtc": "2026-09-22T06:48:54.002227+00:00",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "targetUserId": null,
  "targetDisplayName": null,
  "entityType": "Vehicle",
  "entityId": "5651e890-58fb-4147-8df7-69d6f6596cdb",
  "reason": "Practice or test record: Practice records from the training day.",
  "beforeJson": "{\"Id\": \"5651e890-58fb-4147-8df7-69d6f6596cdb\", \"Make\": \"Toyota\", \"Year\": 2021, \"Color\": \"White\", \"Model\": \"Yaris\", \"VinCode\": \"F9VIND09F04D09FXX\", \"BodyType\": \"Wagon\", \"FuelType\": \"Diesel\", \"IsActive\": false, \"GearboxType\": \"Manual\", \"PlateNumber\": \"F9 D09\", \"RecordLabel\": \"F9 D09 · Toyota Yaris 2021\", \"CreatedAtUtc\": \"2026-09-22T06:48:53.913994+00:00\", \"DeletionNote\": \"Practice records from the training day.\", \"UpdatedAtUtc\": \"2026-09-22T06:48:53.986148+00:00\", \"DeletionReason\": \"PracticeOrTestRecord\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"RentalAssignments\": [{\"Id\": \"917b5cb4-e644-418d-97e8-98a554b66460\", \"Note\": \"Handed over at the office.\", \"Status\": \"Ended\", \"VehicleId\": \"5651e890-58fb-4147-8df7-69d6f6596cdb\", \"CustomerId\": \"52ed1030-56cd-49d4-982b-525410ca89bc\", \"ClosedAtUtc\": \"2026-06-10T08:00:00+00:00\", \"RecordLabel\": \"F9 D09 · Riga Bakery D09F\", \"CreatedAtUtc\": \"2026-09-22T06:48:53.939251+00:00\", \"StartedAtUtc\": \"2026-06-02T08:00:00+00:00\", \"UpdatedAtUtc\": \"2026-09-22T06:48:53.959377+00:00\", \"Interruptions\": [{\"Id\": \"0f038a23-bf94-41f4-8471-b3a52524ea7d\", \"Note\": \"Annual service at the dealer.\", \"Reason\": \"ScheduledMaintenance\", \"EndedAtUtc\": \"2026-06-04T08:00:00+00:00\", \"CreatedAtUtc\": \"2026-09-22T06:48:53.952354+00:00\", \"StartedAtUtc\": \"2026-06-03T08:00:00+00:00\", \"UpdatedAtUtc\": null, \"BillingImpact\": \"NotBillable\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": null, \"ConcurrencyToken\": \"d62a6cce-0b41-4313-b093-991fb785c0e9\", \"RentalAssignmentId\": \"917b5cb4-e644-418d-97e8-98a554b66460\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": null, \"RentalAssignmentLabel\": \"F9 D09 · Riga Bakery D09F\"}], \"Authorizations\": [{\"Id\": \"4f77b6dc-3616-4995-afb7-9a0da64ef5d4\", \"Note\": \"Named driver\", \"DriverId\": \"c49226fd-6fbb-4a27-94cb-fb21fd388305\", \"StopReason\": \"AssignmentEnded\", \"CreatedAtUtc\": \"2026-09-22T06:48:53.939251+00:00\", \"StoppedAtUtc\": \"2026-06-10T08:00:00+00:00\", \"UpdatedAtUtc\": \"2026-09-22T06:48:53.959377+00:00\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"ConcurrencyToken\": \"5a7d036c-cd18-40ec-99ce-4577a4bf90a8\", \"AuthorizationType\": \"NamedDriver\", \"AuthorizedFromUtc\": \"2026-06-02T07:00:00+00:00\", \"DriverDisplayName\": \"Oskars Lapins\", \"RentalAssignmentId\": \"917b5cb4-e644-418d-97e8-98a554b66460\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\", \"RentalAssignmentLabel\": \"F9 D09 · Riga Bakery D09F\"}], \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"PlannedEndAtUtc\": \"2026-06-02T18:00:00+00:00\", \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"CancellationNote\": null, \"ConcurrencyToken\": \"fe353b94-67e4-45cb-b72a-17e76a851da1\", \"PlannedStartAtUtc\": null, \"VehiclePlateNumber\": \"F9 D09\", \"CustomerDisplayName\": \"Riga Bakery D09F\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\"}, {\"Id\": \"95d03db7-6666-43fe-a493-88a7d9a49a2b\", \"Note\": \"Booked by phone.\", \"Status\": \"Cancelled\", \"VehicleId\": \"5651e890-58fb-4147-8df7-69d6f6596cdb\", \"CustomerId\": \"20a7ab0a-b8ae-4e3d-936d-7215cf0258f7\", \"ClosedAtUtc\": \"2026-06-21T09:00:00+00:00\", \"RecordLabel\": \"F9 D09 · Sea Tours D09F\", \"CreatedAtUtc\": \"2026-09-22T06:48:53.967273+00:00\", \"StartedAtUtc\": null, \"UpdatedAtUtc\": \"2026-09-22T06:48:53.978337+00:00\", \"Interruptions\": [], \"Authorizations\": [{\"Id\": \"d3f2692f-2bf0-43f1-913c-86a2097a9c84\", \"Note\": \"Named driver\", \"DriverId\": \"c49226fd-6fbb-4a27-94cb-fb21fd388305\", \"StopReason\": \"AssignmentCancelled\", \"CreatedAtUtc\": \"2026-09-22T06:48:53.967273+00:00\", \"StoppedAtUtc\": \"2026-06-21T09:00:00+00:00\", \"UpdatedAtUtc\": \"2026-09-22T06:48:53.978337+00:00\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"ConcurrencyToken\": \"2f5b3eb1-e3e8-40f1-8640-309570197e0a\", \"AuthorizationType\": \"NamedDriver\", \"AuthorizedFromUtc\": \"2026-06-20T07:00:00+00:00\", \"DriverDisplayName\": \"Oskars Lapins\", \"RentalAssignmentId\": \"95d03db7-6666-43fe-a493-88a7d9a49a2b\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\", \"RentalAssignmentLabel\": \"F9 D09 · Sea Tours D09F\"}], \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"PlannedEndAtUtc\": \"2026-06-25T08:00:00+00:00\", \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"CancellationNote\": \"The customer changed plans.\", \"ConcurrencyToken\": \"a22c97cb-f7ae-4871-84d6-54b8c5bd1a30\", \"PlannedStartAtUtc\": \"2026-06-20T08:00:00+00:00\", \"VehiclePlateNumber\": \"F9 D09\", \"CustomerDisplayName\": \"Sea Tours D09F\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\"}], \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\"}",
  "afterJson": null
};

export const customerWithRentals: CustomerDeletionCandidateResponse = {
  "id": "7e22ef32-4285-42a9-a4fa-c8c645087018",
  "recordLabel": "Lake House D09F",
  "displayName": "Lake House D09F",
  "type": 2,
  "identifier": "4000D09F07",
  "email": "f9-d09f07@example.test",
  "isActive": true,
  "deletion": {
    "state": 1,
    "blocks": [],
    "takes": {
      "rentalAssignments": 2,
      "driverAuthorizations": 2,
      "interruptions": 1,
      "customerLinksCleared": 0
    }
  }
};

export const customerTwoRunning: CustomerDeletionCandidateResponse = {
  "id": "37919b83-2a57-46c0-acfc-f7893eb4fd5b",
  "recordLabel": "Two Cars D09F",
  "displayName": "Two Cars D09F",
  "type": 2,
  "identifier": "4000D09F10",
  "email": "f9-d09f10@example.test",
  "isActive": true,
  "deletion": {
    "state": 2,
    "blocks": [
      {
        "reason": 6,
        "count": 2,
        "records": [
          {
            "kind": 1,
            "id": "790c3460-867c-4934-b4ba-451c720239ed",
            "label": "F9W D09 · Two Cars D09F"
          },
          {
            "kind": 1,
            "id": "2925db53-a8d2-469e-bb2c-c31fb2b8b246",
            "label": "F9V D09 · Two Cars D09F"
          }
        ]
      }
    ],
    "takes": {
      "rentalAssignments": 2,
      "driverAuthorizations": 2,
      "interruptions": 0,
      "customerLinksCleared": 0
    }
  }
};

export const driverTwoRunning: DriverDeletionCandidateResponse = {
  "id": "4f8d33a1-8ff4-4d9a-b889-152dec676cb4",
  "recordLabel": "Ilmars Kronbergs · LV-F9-D09F11",
  "firstName": "Ilmars",
  "lastName": "Kronbergs",
  "email": "ilmars.d09f11@example.com",
  "driverLicenseNumber": "LV-F9-D09F11",
  "isActive": true,
  "deletion": {
    "state": 2,
    "blocks": [
      {
        "reason": 7,
        "count": 2,
        "records": [
          {
            "kind": 1,
            "id": "790c3460-867c-4934-b4ba-451c720239ed",
            "label": "F9W D09 · Two Cars D09F"
          },
          {
            "kind": 1,
            "id": "2925db53-a8d2-469e-bb2c-c31fb2b8b246",
            "label": "F9V D09 · Two Cars D09F"
          }
        ]
      }
    ],
    "takes": {
      "rentalAssignments": 0,
      "driverAuthorizations": 2,
      "interruptions": 0,
      "customerLinksCleared": 0
    }
  }
};

export const driverWithLinks: DriverDeletionCandidateResponse = {
  "id": "2b06b5dc-02d9-49ad-b1fe-5d45b63a82c7",
  "recordLabel": "Arta Skuja · LV-F9-D09F14",
  "firstName": "Arta",
  "lastName": "Skuja",
  "email": "arta.d09f14@example.com",
  "driverLicenseNumber": "LV-F9-D09F14",
  "isActive": true,
  "deletion": {
    "state": 1,
    "blocks": [],
    "takes": {
      "rentalAssignments": 0,
      "driverAuthorizations": 2,
      "interruptions": 0,
      "customerLinksCleared": 1
    }
  }
};

export const customerWithRentalsDeleted: RecordDeletionResponse = {
  "auditEntryId": "ba198d11-4180-4266-90a4-8ef1f2c7b95a",
  "kind": 5,
  "recordLabel": "Lake House D09F",
  "deletedAuthorizationCount": 2,
  "deletedInterruptionCount": 1,
  "deletedRentalAssignmentCount": 2,
  "clearedCustomerLinkCount": 0
};

export const customerWithRentalsEntry: SecurityAuditResponse = {
  "id": "ba198d11-4180-4266-90a4-8ef1f2c7b95a",
  "eventType": "Customer.Deleted",
  "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
  "actorDisplayName": "Arturs Veidenbaums",
  "occurredAtUtc": "2026-09-22T06:48:54.212028+00:00",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "targetUserId": null,
  "targetDisplayName": null,
  "entityType": "Customer",
  "entityId": "7e22ef32-4285-42a9-a4fa-c8c645087018",
  "reason": "No longer needed",
  "beforeJson": "{\"Id\": \"7e22ef32-4285-42a9-a4fa-c8c645087018\", \"Type\": \"Business\", \"Email\": \"f9-d09f07@example.test\", \"Address\": \"Brivibas iela 90, Riga\", \"DriverId\": null, \"IsActive\": true, \"LastName\": null, \"FirstName\": null, \"PersonalId\": null, \"CompanyName\": \"Lake House D09F\", \"DateOfBirth\": null, \"PhoneNumber\": \"+371 23 D09F07\", \"RecordLabel\": \"Lake House D09F\", \"CreatedAtUtc\": \"2026-09-22T06:48:54.019451+00:00\", \"DeletionNote\": null, \"UpdatedAtUtc\": null, \"DeletionReason\": \"NoLongerNeeded\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": null, \"RegistrationCode\": \"4000D09F07\", \"DriverDisplayName\": null, \"RentalAssignments\": [{\"Id\": \"ea493fe4-125d-4def-a53b-07d57f18905e\", \"Note\": \"Handed over at the office.\", \"Status\": \"Ended\", \"VehicleId\": \"c3830040-5c98-4ae5-92ca-771427559dc9\", \"CustomerId\": \"7e22ef32-4285-42a9-a4fa-c8c645087018\", \"ClosedAtUtc\": \"2026-05-09T08:00:00+00:00\", \"RecordLabel\": \"F9O D09 · Lake House D09F\", \"CreatedAtUtc\": \"2026-09-22T06:48:54.044575+00:00\", \"StartedAtUtc\": \"2026-05-04T08:00:00+00:00\", \"UpdatedAtUtc\": \"2026-09-22T06:48:54.057322+00:00\", \"Interruptions\": [{\"Id\": \"003d8bf3-5b5d-403f-95a8-44d2ee540a72\", \"Note\": \"Annual service at the dealer.\", \"Reason\": \"ScheduledMaintenance\", \"EndedAtUtc\": \"2026-05-05T12:00:00+00:00\", \"CreatedAtUtc\": \"2026-09-22T06:48:54.051016+00:00\", \"StartedAtUtc\": \"2026-05-05T08:00:00+00:00\", \"UpdatedAtUtc\": null, \"BillingImpact\": \"NotBillable\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": null, \"ConcurrencyToken\": \"c359d48b-600a-4bb8-a714-c5ed8a52005f\", \"RentalAssignmentId\": \"ea493fe4-125d-4def-a53b-07d57f18905e\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": null, \"RentalAssignmentLabel\": \"F9O D09 · Lake House D09F\"}], \"Authorizations\": [{\"Id\": \"eedd6ae1-9fb3-421f-830f-142378bbc4ab\", \"Note\": \"Named driver\", \"DriverId\": \"c49226fd-6fbb-4a27-94cb-fb21fd388305\", \"StopReason\": \"AssignmentEnded\", \"CreatedAtUtc\": \"2026-09-22T06:48:54.044575+00:00\", \"StoppedAtUtc\": \"2026-05-09T08:00:00+00:00\", \"UpdatedAtUtc\": \"2026-09-22T06:48:54.057322+00:00\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"ConcurrencyToken\": \"9b0d8e63-7c28-4a50-b94d-7f12757fb9f7\", \"AuthorizationType\": \"NamedDriver\", \"AuthorizedFromUtc\": \"2026-05-04T07:00:00+00:00\", \"DriverDisplayName\": \"Oskars Lapins\", \"RentalAssignmentId\": \"ea493fe4-125d-4def-a53b-07d57f18905e\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\", \"RentalAssignmentLabel\": \"F9O D09 · Lake House D09F\"}], \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"PlannedEndAtUtc\": \"2026-05-04T18:00:00+00:00\", \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"CancellationNote\": null, \"ConcurrencyToken\": \"b1742de4-88b1-4c51-b057-1b47e5334507\", \"PlannedStartAtUtc\": null, \"VehiclePlateNumber\": \"F9O D09\", \"CustomerDisplayName\": \"Lake House D09F\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\"}, {\"Id\": \"dd1341fd-94d2-479d-ba39-c8a3e69a3639\", \"Note\": \"Booked by phone.\", \"Status\": \"Planned\", \"VehicleId\": \"ec4dac62-004c-4c7c-802c-36f98ba8fe10\", \"CustomerId\": \"7e22ef32-4285-42a9-a4fa-c8c645087018\", \"ClosedAtUtc\": null, \"RecordLabel\": \"F9F D09 · Lake House D09F\", \"CreatedAtUtc\": \"2026-09-22T06:48:54.063795+00:00\", \"StartedAtUtc\": null, \"UpdatedAtUtc\": null, \"Interruptions\": [], \"Authorizations\": [{\"Id\": \"e90f8b21-2b89-4c00-b4ad-c8430fed401b\", \"Note\": \"Named driver\", \"DriverId\": \"c49226fd-6fbb-4a27-94cb-fb21fd388305\", \"StopReason\": null, \"CreatedAtUtc\": \"2026-09-22T06:48:54.063795+00:00\", \"StoppedAtUtc\": null, \"UpdatedAtUtc\": null, \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": null, \"ConcurrencyToken\": \"e5edc198-4599-4e89-8d19-a03e7f53209e\", \"AuthorizationType\": \"NamedDriver\", \"AuthorizedFromUtc\": \"2026-11-02T07:00:00+00:00\", \"DriverDisplayName\": \"Oskars Lapins\", \"RentalAssignmentId\": \"dd1341fd-94d2-479d-ba39-c8a3e69a3639\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": null, \"RentalAssignmentLabel\": \"F9F D09 · Lake House D09F\"}], \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"PlannedEndAtUtc\": \"2026-11-06T08:00:00+00:00\", \"UpdatedByUserId\": null, \"CancellationNote\": null, \"ConcurrencyToken\": \"63d79f66-bd49-4584-b593-0dac37a60081\", \"PlannedStartAtUtc\": \"2026-11-02T08:00:00+00:00\", \"VehiclePlateNumber\": \"F9F D09\", \"CustomerDisplayName\": \"Lake House D09F\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": null}], \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": null}",
  "afterJson": null
};

export const driverWithLinksDeleted: RecordDeletionResponse = {
  "auditEntryId": "5013ab4f-5691-48a6-b149-7a5bfb5cf3a2",
  "kind": 6,
  "recordLabel": "Arta Skuja · LV-F9-D09F14",
  "deletedAuthorizationCount": 2,
  "deletedInterruptionCount": 0,
  "deletedRentalAssignmentCount": 0,
  "clearedCustomerLinkCount": 1
};

export const driverWithLinksEntry: SecurityAuditResponse = {
  "id": "5013ab4f-5691-48a6-b149-7a5bfb5cf3a2",
  "eventType": "Driver.Deleted",
  "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
  "actorDisplayName": "Arturs Veidenbaums",
  "occurredAtUtc": "2026-09-22T06:48:54.240184+00:00",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "targetUserId": null,
  "targetDisplayName": null,
  "entityType": "Driver",
  "entityId": "2b06b5dc-02d9-49ad-b1fe-5d45b63a82c7",
  "reason": "Other: Recorded twice.",
  "beforeJson": "{\"Id\": \"2b06b5dc-02d9-49ad-b1fe-5d45b63a82c7\", \"Email\": \"arta.d09f14@example.com\", \"Address\": \"Tallinas iela 5, Riga\", \"IsActive\": true, \"LastName\": \"Skuja\", \"FirstName\": \"Arta\", \"PersonalId\": null, \"DateOfBirth\": \"1987-04-05\", \"PhoneNumber\": \"+371 27 D09F14\", \"RecordLabel\": \"Arta Skuja · LV-F9-D09F14\", \"CreatedAtUtc\": \"2026-09-22T06:48:54.139261+00:00\", \"DeletionNote\": \"Recorded twice.\", \"UpdatedAtUtc\": null, \"Authorizations\": [{\"Id\": \"21200936-734b-4537-a540-cf10855f9254\", \"Note\": \"Named driver\", \"DriverId\": \"2b06b5dc-02d9-49ad-b1fe-5d45b63a82c7\", \"StopReason\": null, \"CreatedAtUtc\": \"2026-09-22T06:48:54.175681+00:00\", \"StoppedAtUtc\": null, \"UpdatedAtUtc\": null, \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": null, \"ConcurrencyToken\": \"f80c2d86-8e83-40c1-b51f-892bcacca3d0\", \"AuthorizationType\": \"NamedDriver\", \"AuthorizedFromUtc\": \"2026-09-12T07:00:00+00:00\", \"DriverDisplayName\": \"Arta Skuja\", \"RentalAssignmentId\": \"1161eef2-8c52-4e5a-8faa-bfad88fb2c45\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": null, \"RentalAssignmentLabel\": \"F9G D09 · Arta Skuja\"}, {\"Id\": \"655bb496-7a78-4f06-8955-914b23305e2b\", \"Note\": \"Named driver\", \"DriverId\": \"2b06b5dc-02d9-49ad-b1fe-5d45b63a82c7\", \"StopReason\": \"AssignmentEnded\", \"CreatedAtUtc\": \"2026-09-22T06:48:54.187326+00:00\", \"StoppedAtUtc\": \"2026-04-08T08:00:00+00:00\", \"UpdatedAtUtc\": \"2026-09-22T06:48:54.195503+00:00\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"ConcurrencyToken\": \"b07b338c-4565-4a0c-bd40-401a57bf3424\", \"AuthorizationType\": \"NamedDriver\", \"AuthorizedFromUtc\": \"2026-04-06T07:00:00+00:00\", \"DriverDisplayName\": \"Arta Skuja\", \"RentalAssignmentId\": \"d7175fb2-eb6f-4a26-8ad6-6f7f6c7be8c2\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": \"Karlis Zvaigzne\", \"RentalAssignmentLabel\": \"F9P D09 · Riga Bakery D09F\"}], \"DeletionReason\": \"Other\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": null, \"DriverLicenseNumber\": \"LV-F9-D09F14\", \"ClearedCustomerLinks\": [{\"CustomerId\": \"6624fe4e-b063-4d5b-9bec-58342d73c0f1\", \"CustomerDisplayName\": \"Arta Skuja\"}], \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": null}",
  "afterJson": null
};

export const removedWithDriverEntry: SecurityAuditResponse = {
  "id": "31a64276-7a64-424a-b8c3-b9579f5f1f75",
  "eventType": "DriverAuthorization.RemovedWithDriver",
  "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
  "actorDisplayName": "Arturs Veidenbaums",
  "occurredAtUtc": "2026-09-22T06:48:54.240574+00:00",
  "companyId": "0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05",
  "targetUserId": null,
  "targetDisplayName": null,
  "entityType": "RentalAssignment",
  "entityId": "1161eef2-8c52-4e5a-8faa-bfad88fb2c45",
  "reason": "Other: Recorded twice.",
  "beforeJson": "{\"Id\": \"21200936-734b-4537-a540-cf10855f9254\", \"Note\": \"Named driver\", \"DriverId\": \"2b06b5dc-02d9-49ad-b1fe-5d45b63a82c7\", \"StopReason\": null, \"RecordLabel\": \"Arta Skuja · F9G D09 · Arta Skuja\", \"CreatedAtUtc\": \"2026-09-22T06:48:54.175681+00:00\", \"DeletionNote\": \"Recorded twice.\", \"StoppedAtUtc\": null, \"UpdatedAtUtc\": null, \"DeletionReason\": \"Other\", \"CreatedByUserId\": \"9f2b7c41-0003-4a10-8b01-000000000003\", \"UpdatedByUserId\": null, \"ConcurrencyToken\": \"f80c2d86-8e83-40c1-b51f-892bcacca3d0\", \"AuthorizationType\": \"NamedDriver\", \"AuthorizedFromUtc\": \"2026-09-12T07:00:00+00:00\", \"DriverDisplayName\": \"Arta Skuja\", \"RentalAssignmentId\": \"1161eef2-8c52-4e5a-8faa-bfad88fb2c45\", \"CreatedByDisplayName\": \"Karlis Zvaigzne\", \"UpdatedByDisplayName\": null, \"RentalAssignmentLabel\": \"F9G D09 · Arta Skuja\", \"DeletedWithRecordLabel\": \"Arta Skuja · LV-F9-D09F14\"}",
  "afterJson": null
};

export const deletionsAfterCascades: RecordDeletionListItemResponse[] = [
  {
    "auditEntryId": "5013ab4f-5691-48a6-b149-7a5bfb5cf3a2",
    "occurredAtUtc": "2026-09-22T06:48:54.240184+00:00",
    "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
    "actorDisplayName": "Arturs Veidenbaums",
    "kind": 6,
    "recordLabel": "Arta Skuja · LV-F9-D09F14",
    "reason": 4,
    "note": "Recorded twice."
  },
  {
    "auditEntryId": "ba198d11-4180-4266-90a4-8ef1f2c7b95a",
    "occurredAtUtc": "2026-09-22T06:48:54.212028+00:00",
    "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
    "actorDisplayName": "Arturs Veidenbaums",
    "kind": 5,
    "recordLabel": "Lake House D09F",
    "reason": 3,
    "note": null
  },
  {
    "auditEntryId": "636ab5d2-2b8b-46ba-b348-784f7580d127",
    "occurredAtUtc": "2026-09-22T06:48:54.002227+00:00",
    "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
    "actorDisplayName": "Arturs Veidenbaums",
    "kind": 4,
    "recordLabel": "F9 D09 · Toyota Yaris 2021",
    "reason": 2,
    "note": "Practice records from the training day."
  },
  {
    "auditEntryId": "c856002e-6768-4f34-99a5-faf776efd3b9",
    "occurredAtUtc": "2026-09-22T06:48:53.862393+00:00",
    "actorUserId": "9f2b7c41-0001-4a10-8b01-000000000001",
    "actorDisplayName": "Arturs Veidenbaums",
    "kind": 1,
    "recordLabel": "400 NDP · Roberts Liepins",
    "reason": 1,
    "note": null
  }
];
