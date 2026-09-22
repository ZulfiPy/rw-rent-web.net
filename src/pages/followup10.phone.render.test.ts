import { createElement as h } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { UserRecord } from './users/UserRecord';
import { clearRenders, renderPage } from './followup7b.support';
import { directoryAdmin, directoryPrincipal, historyHolder, meAdmin, tomsHolder } from './followup10.support';

/**
 * The Roles tab below 768 pixels (Follow-up 10): the role history is cards, and a Record deleter's
 * card carries Expiry and Revoke for the administrator alone. A server render always takes the
 * desktop tier, so the tier is set here; everything else is the real page.
 */
vi.mock('@/app/useViewport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/useViewport')>()),
  useTier: () => 'phone' as const,
}));

afterEach(clearRenders);

const roles = (permissions: string[], directory: typeof directoryAdmin) => renderPage(h(UserRecord), {
  at: `/users/${tomsHolder.id}?tab=roles`,
  route: '/users/:userId',
  permissions,
  data: [
    [qk.users.detail(tomsHolder.id), tomsHolder],
    [qk.roles.history(tomsHolder.id, { PageSize: 100 }), historyHolder],
    [qk.users.list({ PageSize: 100 }), directory],
  ],
});

/** The first card that carries a text, up to the next card. */
const card = (markup: string, text: string) => {
  const at = markup.indexOf(text);
  expect(at).toBeGreaterThan(-1);
  const start = markup.lastIndexOf('<div class="_card_', at);
  const next = markup.indexOf('<div class="_card_', at + 1);
  return markup.slice(start, next > -1 ? next : undefined);
};

describe('the Record deleter card on a phone', () => {
  test('carries Expiry and Revoke for the administrator', () => {
    const markup = roles(meAdmin.permissions, directoryAdmin);
    expect(markup).not.toContain('<table');
    const effective = card(markup, '>Record deleter<');
    expect(effective).toContain('>Effective<');
    expect(effective).toContain('Expiry</button>');
    expect(effective).toContain('Revoke</button>');
  });

  test('carries no action for a Company Principal', () => {
    const markup = roles(
      ['Roles.ReadHistory', 'Roles.ManageViewerFleetManager', 'Users.ReadDirectory'],
      directoryPrincipal,
    );
    const effective = card(markup, '>Record deleter<');
    expect(effective).toContain('>Effective<');
    expect(effective).not.toContain('Expiry</button>');
    expect(effective).not.toContain('Revoke</button>');
  });
});
