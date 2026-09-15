import { describe, expect, it } from 'vitest';
import { readTokenFromHash } from './token';

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
