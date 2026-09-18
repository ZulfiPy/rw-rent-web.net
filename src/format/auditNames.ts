import type { SecurityAuditResponse, Uuid } from '@/api/dto';

/**
 * Who a history row names (F7-4).
 *
 * The owner's check on real data found the administrator labelled "System" in a Company
 * Principal's audit list. The app resolved every name from the user directory the reader may see,
 * the administrator is outside the Company and so outside that directory, and anyone the app could
 * not find became "System". "System" is now reserved for the technical actor, the one actor with
 * no human behind it (the bootstrap, the background cleanup).
 *
 * An audit entry names its actor and its target itself since the backend's round 5, so the
 * audit surfaces take the names from the entry and every reader sees the person. A link to the
 * user record is still offered only when the reader's own directory holds that user.
 */
export const SYSTEM_ACTOR = 'System';

/** A real person the reader's directory does not hold, on a row that carries no name of its own. */
export const OUTSIDE_COMPANY = 'Outside your company';

/** The technical actor's fixed id (SYSTEM-001), the one account that is nobody. */
export const TECHNICAL_ACTOR_ID: Uuid = '00000000-0000-0000-0000-000000000001';

type ActorNamed = Pick<SecurityAuditResponse, 'actorDisplayName'>;
type TargetNamed = Pick<SecurityAuditResponse, 'targetUserId' | 'targetDisplayName'>;

/** The entry's actor: their name, or "System" when the entry carries none (the technical actor). */
export const auditActorName = (entry: ActorNamed): string => entry.actorDisplayName ?? SYSTEM_ACTOR;

/** Whether the entry's actor is the technical actor: the API names every other actor. */
export const isSystemActor = (entry: ActorNamed): boolean => entry.actorDisplayName == null;

/** The entry's target user by name; null when the entry is not about a user. */
export const auditTargetName = (entry: TargetNamed): string | null =>
  entry.targetUserId ? entry.targetDisplayName ?? 'Unknown user' : null;

/**
 * A user a row names only by id, when the reader's directory does not hold them: the role
 * history carries ids and no names. The technical actor is "System"; anyone else is a real person
 * outside the reader's company, such as the administrator who granted a role.
 */
export const unlistedUserName = (id: Uuid | null | undefined): string =>
  id === TECHNICAL_ACTOR_ID ? SYSTEM_ACTOR : OUTSIDE_COMPANY;
