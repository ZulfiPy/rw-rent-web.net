import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

/**
 * Follow-up 7 across every screen, read from the sources: no page renders an instant in UTC or
 * labels a person "System" by itself any more. The helpers that decide both live in `src/format`
 * and are tested there; this keeps a page from quietly going back.
 */
const root = fileURLToPath(new URL('..', import.meta.url));

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : [];
  });
}

/** The code without its comments, which may well explain what the page used to do. */
const code = (path: string) =>
  readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const screens = [...sources(join(root, 'pages')), ...sources(join(root, 'app'))];

const offenders = (pattern: RegExp) =>
  screens.filter((path) => pattern.test(code(path))).map((path) => relative(root, path));

describe('every screen reads local time (F7-1)', () => {
  test('there are screens to read', () => {
    expect(screens.length).toBeGreaterThan(20);
  });

  test('no screen formats an instant in UTC', () => {
    expect(offenders(/\bformatUtc(Human|Labelled)?\b/)).toEqual([]);
  });

  test('no screen says UTC', () => {
    expect(offenders(/\bUTC\b/)).toEqual([]);
  });
});

describe('"System" is the technical actor alone (F7-4)', () => {
  test('no screen names anybody "System" by itself', () => {
    expect(offenders(/['"`>]System['"`<]/)).toEqual([]);
  });
});
