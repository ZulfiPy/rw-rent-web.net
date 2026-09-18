import { describe, expect, test } from 'vitest';
import {
  OUTSIDE_COMPANY, SYSTEM_ACTOR, TECHNICAL_ACTOR_ID, auditActorName, auditTargetName, isSystemActor,
  unlistedUserName,
} from './auditNames';

describe('an audit entry names its actor itself (F7-4)', () => {
  test('a person is named whether or not the reader\'s directory holds them', () => {
    // The owner's case: the Principal reading the administrator's activation of their account.
    const entry = { actorDisplayName: 'Arturs Veidenbaums' };
    expect(auditActorName(entry)).toBe('Arturs Veidenbaums');
    expect(isSystemActor(entry)).toBe(false);
  });

  test('"System" is the actor the API does not name: the technical actor', () => {
    expect(auditActorName({ actorDisplayName: null })).toBe(SYSTEM_ACTOR);
    expect(isSystemActor({ actorDisplayName: null })).toBe(true);
  });

  test('an entry from before the names arrived reads as the technical actor would', () => {
    expect(auditActorName({})).toBe('System');
    expect(isSystemActor({})).toBe(true);
  });
});

describe('an audit entry names its target itself', () => {
  test('a target user is named', () => {
    expect(auditTargetName({ targetUserId: 'u5', targetDisplayName: 'Toms Rudzitis' })).toBe('Toms Rudzitis');
  });

  test('an entry about no user has no target name', () => {
    expect(auditTargetName({ targetUserId: null, targetDisplayName: null })).toBeNull();
    expect(auditTargetName({})).toBeNull();
  });

  test('a target without a name is an unknown user, never "System"', () => {
    expect(auditTargetName({ targetUserId: 'u5', targetDisplayName: null })).toBe('Unknown user');
  });
});

describe('a role row names an actor the reader cannot see', () => {
  test('the technical actor is "System"', () => {
    expect(unlistedUserName(TECHNICAL_ACTOR_ID)).toBe(SYSTEM_ACTOR);
  });

  test('anyone else is a person outside the reader\'s company', () => {
    // The seeded administrator, who granted Karlis Zvaigzne his Fleet Manager role.
    expect(unlistedUserName('9f2b7c41-0001-4a10-8b01-000000000001')).toBe(OUTSIDE_COMPANY);
    expect(unlistedUserName(null)).toBe(OUTSIDE_COMPANY);
  });
});
