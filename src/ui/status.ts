import {
  ApplicationUserStatus, AssignmentStatus, SystemAdministratorTransferStatus, VehicleAvailability,
} from '@/api/dto';

export type Tone = 'ok' | 'info' | 'warn' | 'bad' | 'mute' | 'accent' | 'plain';

/** Status tones, ported from the prototype. */
export const USER_STATUS_TONE: Record<ApplicationUserStatus, Tone> = {
  [ApplicationUserStatus.PendingActivation]: 'warn',
  [ApplicationUserStatus.Active]: 'ok',
  [ApplicationUserStatus.Suspended]: 'bad',
  [ApplicationUserStatus.RegistrationRejected]: 'mute',
  [ApplicationUserStatus.RegistrationExpired]: 'mute',
};

/**
 * The chip's dot is shaped per status as well as coloured — a circle for Active, a square for
 * Pending, a cut corner for Suspended — so the state survives a colour-blind reading.
 */
export const USER_STATUS_DOT: Record<ApplicationUserStatus, string> = {
  [ApplicationUserStatus.PendingActivation]: '2px',
  [ApplicationUserStatus.Active]: '50%',
  [ApplicationUserStatus.Suspended]: '50% 50% 50% 0',
  [ApplicationUserStatus.RegistrationRejected]: '1px',
  [ApplicationUserStatus.RegistrationExpired]: '1px',
};

/** An assignment's four states carry the same shape language: running, closed, withdrawn, ahead. */
export const ASSIGNMENT_STATUS_TONE: Record<AssignmentStatus, Tone> = {
  [AssignmentStatus.Active]: 'ok',
  [AssignmentStatus.Ended]: 'mute',
  [AssignmentStatus.Cancelled]: 'bad',
  [AssignmentStatus.Planned]: 'info',
};

export const ASSIGNMENT_STATUS_DOT: Record<AssignmentStatus, string> = {
  [AssignmentStatus.Active]: '50%',
  [AssignmentStatus.Ended]: '1px',
  [AssignmentStatus.Cancelled]: '50% 50% 50% 0',
  [AssignmentStatus.Planned]: '2px',
};

/**
 * A vehicle's availability, decided by the server and read from the row. The four states keep the
 * shape language: a circle for available and in use, a square for reserved, a hairline for retired.
 */
export const VEHICLE_AVAILABILITY_TONE: Record<VehicleAvailability, Tone> = {
  [VehicleAvailability.Available]: 'ok',
  [VehicleAvailability.InUse]: 'info',
  [VehicleAvailability.Reserved]: 'warn',
  [VehicleAvailability.Retired]: 'mute',
};

export const VEHICLE_AVAILABILITY_DOT: Record<VehicleAvailability, string> = {
  [VehicleAvailability.Available]: '50%',
  [VehicleAvailability.InUse]: '50%',
  [VehicleAvailability.Reserved]: '2px',
  [VehicleAvailability.Retired]: '1px',
};

/** The administrator transfer's four states; expired reads like cancelled, as a closed row. */
export const TRANSFER_STATUS_TONE: Record<SystemAdministratorTransferStatus, Tone> = {
  [SystemAdministratorTransferStatus.AwaitingAcceptance]: 'warn',
  [SystemAdministratorTransferStatus.Accepted]: 'ok',
  [SystemAdministratorTransferStatus.Cancelled]: 'mute',
  [SystemAdministratorTransferStatus.Expired]: 'mute',
};

export const TRANSFER_STATUS_DOT: Record<SystemAdministratorTransferStatus, string> = {
  [SystemAdministratorTransferStatus.AwaitingAcceptance]: '2px',
  [SystemAdministratorTransferStatus.Accepted]: '50%',
  [SystemAdministratorTransferStatus.Cancelled]: '2px',
  [SystemAdministratorTransferStatus.Expired]: '1px',
};
