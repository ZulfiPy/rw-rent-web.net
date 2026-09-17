import { describe, expect, it } from 'vitest';
import { readTokenFromHash, tokenArrival } from './token';

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
