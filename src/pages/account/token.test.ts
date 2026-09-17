import { describe, expect, it } from 'vitest';
import { NO_LINK_TOKEN, readLinkToken, readTokenFromHash, tokenArrival } from './token';

describe('the token in the link', () => {
  it('reads what follows the hash', () => {
    expect(readTokenFromHash('#CfDJ8Abc-123_xyz')).toBe('CfDJ8Abc-123_xyz');
    expect(readTokenFromHash('CfDJ8Abc-123_xyz')).toBe('CfDJ8Abc-123_xyz');
  });

  it('decodes the escaping an email client may add', () => {
    expect(readTokenFromHash('#CfDJ8%2Babc%3D%3D')).toBe('CfDJ8+abc==');
  });

  it('has nothing to read for an empty or blank fragment', () => {
    expect(readTokenFromHash('')).toBeNull();
    expect(readTokenFromHash('#')).toBeNull();
    expect(readTokenFromHash('#   ')).toBeNull();
  });

  it('keeps a malformed escape as it stands rather than throwing', () => {
    expect(readTokenFromHash('#%E0%A4%A')).toBe('%E0%A4%A');
  });
});

describe('a fragment that arrives while the page is already open', () => {
  /*
   * The tester's T-005: a spent link reopened in the tab that used it kept showing the old success
   * and sent nothing, while the same link in a fresh tab was correctly refused. What separates the
   * two cases is only whether the page had already read a fragment.
   */
  it('has nothing to do when there is no fragment', () => {
    expect(tokenArrival('', false)).toEqual({ kind: 'none' });
    expect(tokenArrival('#', true)).toEqual({ kind: 'none' });
    expect(tokenArrival('#   ', true)).toEqual({ kind: 'none' });
  });

  it('treats the fragment the page was opened with as its first', () => {
    expect(tokenArrival('#CfDJ8first', false)).toEqual({ kind: 'first', token: 'CfDJ8first' });
  });

  it('treats a later fragment as one to start over with', () => {
    expect(tokenArrival('#CfDJ8second', true)).toEqual({ kind: 'again', token: 'CfDJ8second' });
  });

  it('says start over even for the same token again, because only the API knows', () => {
    // A single-use token that has been spent still has to be sent: the refusal is what produces
    // the unusable-link screen, and the app cannot decide it on its own.
    const token = 'CfDJ8same';
    expect(tokenArrival(`#${token}`, false)).toEqual({ kind: 'first', token });
    expect(tokenArrival(`#${token}`, true)).toEqual({ kind: 'again', token });
  });

  it('decodes a later fragment the same way as the first', () => {
    expect(tokenArrival('#CfDJ8%2Babc%3D%3D', true)).toEqual({ kind: 'again', token: 'CfDJ8+abc==' });
  });
});

describe('the state a link page keeps', () => {
  /*
   * This is the test that was missing. Follow-up 4 asserted the *decision* — the same token
   * arriving again reads as "start over" — and the decision was right, while the page stayed stuck,
   * because it stored only the token and React changes nothing when a state value is identical. The
   * effect that sends the token therefore never ran again and the screen sat on "consuming the
   * token" for ever. Found in the joint check of Follow-up 5, on the one path the reviewer's own
   * check could not reach: the *same* link, not a second, different one.
   *
   * So the state is tested as a sequence, which is the only way the repeat is visible at all.
   */
  it('reads the fragment the page was opened with', () => {
    expect(readLinkToken(NO_LINK_TOKEN, '#CfDJ8first'))
      .toEqual({ token: 'CfDJ8first', arrival: 1 });
  });

  it('leaves the page alone when the fragment holds no token', () => {
    expect(readLinkToken(NO_LINK_TOKEN, '')).toBeNull();
    expect(readLinkToken({ token: 'CfDJ8held', arrival: 1 }, '#')).toBeNull();
    expect(readLinkToken({ token: 'CfDJ8held', arrival: 1 }, '#  ')).toBeNull();
  });

  it('counts the same token arriving again as a new arrival', () => {
    const first = readLinkToken(NO_LINK_TOKEN, '#CfDJ8same');
    expect(first).toEqual({ token: 'CfDJ8same', arrival: 1 });

    const again = readLinkToken(first!, '#CfDJ8same');
    // The token is identical; only the counter says anything happened — and it must.
    expect(again).toEqual({ token: 'CfDJ8same', arrival: 2 });
    expect(again).not.toEqual(first);
    expect(again!.arrival).not.toBe(first!.arrival);
  });

  it('counts a different token arriving as a new arrival too', () => {
    const first = readLinkToken(NO_LINK_TOKEN, '#CfDJ8first')!;
    const second = readLinkToken(first, '#CfDJ8second')!;
    expect(second).toEqual({ token: 'CfDJ8second', arrival: 2 });
  });

  it('keeps counting across a whole sequence of visits', () => {
    // The joint check's own sequence: a link, the same one again, a second valid one, then the
    // first one once more. Four visits, four arrivals, four requests.
    let state = NO_LINK_TOKEN;
    const seen: Array<[string | null, number]> = [];
    for (const hash of ['#one', '#one', '#two', '#one']) {
      state = readLinkToken(state, hash) ?? state;
      seen.push([state.token, state.arrival]);
    }
    expect(seen).toEqual([['one', 1], ['one', 2], ['two', 3], ['one', 4]]);
  });

  it('a fragment with nothing in it does not advance the count', () => {
    const held = readLinkToken(NO_LINK_TOKEN, '#one')!;
    expect(readLinkToken(held, '')).toBeNull();
    expect(held.arrival).toBe(1);
  });

  it('decodes a later fragment as it decodes the first', () => {
    const first = readLinkToken(NO_LINK_TOKEN, '#CfDJ8%2Babc%3D%3D')!;
    expect(first.token).toBe('CfDJ8+abc==');
    expect(readLinkToken(first, '#CfDJ8%2Babc%3D%3D'))
      .toEqual({ token: 'CfDJ8+abc==', arrival: 2 });
  });
});
