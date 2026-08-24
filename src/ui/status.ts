import { ApplicationUserStatus, AssignmentStatus } from '@/api/dto';

export type Tone = 'ok' | 'info' | 'warn' | 'bad' | 'mute' | 'plain';

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
  [AssignmentStatus.Cancelled]: 'mute',
  [AssignmentStatus.Planned]: 'info',
};

export const ASSIGNMENT_STATUS_DOT: Record<AssignmentStatus, string> = {
  [AssignmentStatus.Active]: '50%',
  [AssignmentStatus.Ended]: '1px',
  [AssignmentStatus.Cancelled]: '50% 50% 50% 0',
  [AssignmentStatus.Planned]: '2px',
};
