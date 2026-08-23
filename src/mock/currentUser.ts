import type { CurrentUserResponse } from '@/api/dto';
import { getDevState } from '@/dev/devState';
import { personaById, permsOf } from './personas';
import type { MockStore } from './store';
import { notFound } from './transport';

/** GET /api/me for the selected persona. The switcher changes this response and nothing else. */
export function currentUser(store: MockStore): CurrentUserResponse {
  const persona = personaById(getDevState().personaId);
  const user = store.users.find((u) => u.id === persona.userId);
  if (!user) throw notFound('The signed-in user is missing from the store.');
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    companyId: user.companyId ?? null,
    status: user.status,
    roles: user.effectiveRoles,
    // 'u0' is the active-with-no-permissions persona that routes to Access pending.
    permissions: persona.id === 'u0' ? [] : permsOf(persona.role),
  };
}
