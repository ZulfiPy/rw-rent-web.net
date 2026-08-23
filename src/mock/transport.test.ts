import { beforeEach, describe, expect, test } from 'vitest';
import './handlers';
import { createMockTransport } from './transport';
import { resetStore } from './store';
import { ID } from './ids';
import { installTransport, transport } from '@/api/transport';
import { setDevState } from '@/dev/devState';
import type { PagedResponse, UserListItemResponse } from '@/api/dto';

beforeEach(() => {
  resetStore();
  setDevState({ personaId: 'u2', nextFailure: 'none' });
  installTransport(createMockTransport());
});

const users = (query: Record<string, unknown>) =>
  transport().request<PagedResponse<UserListItemResponse>>('GET', '/api/users', { query: query as never });

/** ASP.NET binds route literals and query keys case-insensitively; the mock has to agree. */
describe('binding', () => {
  test('a differently cased path segment still matches its route', async () => {
    const page = await transport().request<PagedResponse<UserListItemResponse>>('GET', '/API/Users', {
      query: { PageSize: 1 },
    });
    expect(page.items.length).toBe(1);
  });

  test('a differently cased query key still binds', async () => {
    const page = await users({ pagesize: 2, pagenumber: 1 });
    expect(page.pageSize).toBe(2);
    expect(page.items.length).toBe(2);
  });

  test('the canonical PascalCase keys bind as before', async () => {
    const page = await users({ PageSize: 3, PageNumber: 1 });
    expect(page.pageSize).toBe(3);
  });

  test('a route parameter is read from the path as given', async () => {
    const user = await transport().request<{ id: string }>('GET', `/api/users/${ID.users.fleet}`);
    expect(user.id).toBe(ID.users.fleet);
  });
});
