import type { Permission } from './permissions';

export type Can = (permission: Permission) => boolean;

/** The single gate. Nothing infers capability from a role name. */
export function createCan(permissions: readonly string[]): Can {
  const held = new Set(permissions);
  return (permission) => held.has(permission);
}

export const CAN_NOTHING: Can = () => false;

/**
 * Hide-by-permission versus disable-with-reason.
 *
 * An action a persona's permissions can never allow is not rendered at all. An action the persona
 * could perform but the record's state blocks is rendered disabled, carrying the reason. Passing a
 * reason without the permission still yields `hidden`.
 */
export type ActionState =
  | { visible: false }
  | { visible: true; disabled: false }
  | { visible: true; disabled: true; reason: string };

export function actionState(
  can: Can,
  permission: Permission,
  blockedReason?: string | null,
): ActionState {
  if (!can(permission)) return { visible: false };
  return blockedReason ? { visible: true, disabled: true, reason: blockedReason } : { visible: true, disabled: false };
}
