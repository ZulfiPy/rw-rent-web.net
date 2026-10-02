import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, test } from 'vitest';

/**
 * Follow-up 21, F21-1: a link to the app shows its name, a sentence and a picture, the app has its
 * icons and a manifest, and no search engine lists it. A messenger's robot runs no script, so what
 * it reads is `index.html` as it is written and the files beside it: these tests read exactly those,
 * the page's tags, each file of `public/` as bytes, and the sources in `brand/` the pictures are made
 * from by `node brand/make.cjs`.
 */
const ROOT = new URL('../../', import.meta.url);
const file = (path: string) => readFileSync(new URL(path, ROOT));
const text = (path: string) => file(path).toString('utf8');
const has = (path: string) => existsSync(new URL(path, ROOT));

const APP = 'https://rw-rent.net';
const DESCRIPTION = 'Fleet and rental operations for RW-Rent: vehicles, rentals, drivers, customers and insurance cases in one place.';
const ALT = 'RW-Rent. Control at every turn.';

/** The page's head as a robot reads it: comments aside, every `<meta>` and `<link>` with its attributes. */
const head = text('index.html').replace(/<!--[\s\S]*?-->/g, '');
const tags = (name: 'meta' | 'link') => [...head.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'g'))].map((tag) =>
  Object.fromEntries([...tag[1]!.matchAll(/([\w:-]+)(?:="([^"]*)")?/g)].map((pair) => [pair[1]!, pair[2] ?? ''])));
const metas = tags('meta');
const links = tags('link');
const meta = (key: 'name' | 'property', value: string) => metas.filter((tag) => tag[key] === value).map((tag) => tag['content']);

/** A PNG's size and first pixel, read from its bytes: the header, and the first row of its picture. */
function png(bytes: Buffer) {
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(bytes.subarray(12, 16).toString('latin1')).toBe('IHDR');
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const colourType = bytes.readUInt8(25);
  const data: Buffer[] = [];
  for (let at = 8; at < bytes.length;) {
    const length = bytes.readUInt32BE(at);
    if (bytes.subarray(at + 4, at + 8).toString('latin1') === 'IDAT') data.push(bytes.subarray(at + 8, at + 8 + length));
    at += 12 + length;
  }
  // The first pixel of the first row is stored as it is under every row filter: nothing stands left of it or above it.
  const row = inflateSync(Buffer.concat(data));
  const channels = colourType === 6 ? 4 : 3;
  const first = [...row.subarray(1, 1 + channels)];
  return { width, height, alpha: colourType === 6, first };
}

const rgb = (hex: string) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));

/** The dark theme's colours, as the stylesheet gives them. */
const token = (name: string) => new RegExp(`:root \\{[^}]*--${name}: (#[0-9A-Fa-f]{6});`).exec(text('src/styles/tokens.css'))![1]!;
const CANVAS = token('canvas');
const BRAND = token('brand');
const FG = token('fg');

/** The monogram's two paths, as the sign-in page draws them. */
const layout = text('src/pages/account/AuthLayout.tsx');
const UPPER = /const LOGO_UPPER = '([^']+)';/.exec(layout)![1]!;
const LOWER = /const LOGO_LOWER = '([^']+)';/.exec(layout)![1]!;

describe('F21-1: a link to the app shows its name, a sentence and a picture', () => {
  test('the page says what it is: the title and the description', () => {
    expect(/<title>([^<]*)<\/title>/.exec(head)![1]).toBe('RW-Rent');
    expect(meta('name', 'description')).toEqual([DESCRIPTION]);
  });

  test('the Open Graph tags a messenger reads: a website, the name, the sentence, the address and the large picture', () => {
    const og = Object.fromEntries(metas.filter((tag) => tag['property']?.startsWith('og:')).map((tag) => [tag['property'], tag['content']]));
    expect(og).toEqual({
      'og:type': 'website',
      'og:site_name': 'RW-Rent',
      'og:title': 'RW-Rent',
      'og:description': DESCRIPTION,
      'og:url': `${APP}/`,
      'og:image': `${APP}/og-image.png`,
      'og:image:type': 'image/png',
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:alt': ALT,
    });
    // Each once: a robot that meets a tag twice takes whichever it likes.
    expect(metas.filter((tag) => tag['property']?.startsWith('og:'))).toHaveLength(10);
  });

  test('the Twitter tags: the large card with the same name, sentence and picture', () => {
    const twitter = Object.fromEntries(metas.filter((tag) => tag['name']?.startsWith('twitter:')).map((tag) => [tag['name'], tag['content']]));
    expect(twitter).toEqual({
      'twitter:card': 'summary_large_image',
      'twitter:title': 'RW-Rent',
      'twitter:description': DESCRIPTION,
      'twitter:image': `${APP}/og-image.png`,
      'twitter:image:alt': ALT,
    });
  });

  test('the picture is a real file, 1200 by 630 as the tags say, on the app’s dark ground', () => {
    const picture = png(file('public/og-image.png'));
    expect([picture.width, picture.height]).toEqual([1200, 630]);
    expect([String(picture.width), String(picture.height)]).toEqual([meta('property', 'og:image:width')[0], meta('property', 'og:image:height')[0]]);
    expect(picture.first).toEqual(rgb(CANVAS));
    // A messenger takes a picture of at most a few megabytes; this one is far under.
    expect(file('public/og-image.png').length).toBeLessThan(300_000);
  });

  test('the picture’s source draws the monogram, the name in the wordmark’s type and the sign-in page’s line, in the dark theme’s colours', () => {
    const source = text('brand/og-image.html');
    expect(source).toContain(`<path d="${UPPER}"/><path d="${LOWER}"/>`);
    expect(source).toContain('<span class="mark">RW-Rent</span>');
    expect(source).toContain('<p class="line">Control at every turn.</p>');
    // The wordmark's type and the line's, as the sign-in page sets them.
    const styles = text('src/pages/account/Auth.module.css');
    expect(/\.mark \{[^}]*font-family: '(\w+)'[^}]*font-weight: (\d+)/.exec(styles)!.slice(1)).toEqual(['Poppins', '600']);
    expect(source).toMatch(/\.mark \{\{? font-family: 'Poppins', sans-serif; font-weight: 600;/);
    expect(source).toMatch(/\.line \{\{? margin: 0; font-family: 'Michroma', sans-serif;/);
    expect(layout).toContain('<p className={styles.artLine}>Control at every turn.</p>');
    expect(source).toContain(`background: ${CANVAS}; color: ${FG};`);
    expect(source).toContain(`fill: ${BRAND};`);
    expect(source).toContain('width: 1200px; height: 630px;');
  });
});

describe('F21-1: the icons, the theme colour and the manifest', () => {
  test('the page names the tab’s icon twice, the iPhone’s icon, the manifest and the theme colour', () => {
    expect(links.filter((link) => ['icon', 'apple-touch-icon', 'manifest'].includes(link['rel']!))).toEqual([
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/site.webmanifest' },
    ]);
    expect(meta('name', 'theme-color')).toEqual([CANVAS]);
  });

  test('the tab’s icon is the monogram: an SVG of the sign-in page’s two paths in the brand’s red', () => {
    const svg = text('public/favicon.svg');
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="470 187 1060 1125"')).toBe(true);
    expect(svg).toContain(`fill="${BRAND}"`);
    expect([...svg.matchAll(/<path d="([^"]+)"\/>/g)].map((path) => path[1])).toEqual([UPPER, LOWER]);
    // The same viewBox as the sign-in page's logo.
    expect(layout).toContain('viewBox="470 187 1060 1125"');
  });

  test('the .ico for browsers that ask for one holds the monogram at 16, 32 and 48, each a PNG with no ground', () => {
    const ico = file('public/favicon.ico');
    expect([ico.readUInt16LE(0), ico.readUInt16LE(2), ico.readUInt16LE(4)]).toEqual([0, 1, 3]);
    const sizes = [0, 1, 2].map((n) => {
      const entry = ico.subarray(6 + 16 * n, 22 + 16 * n);
      const inside = png(ico.subarray(entry.readUInt32LE(12), entry.readUInt32LE(12) + entry.readUInt32LE(8)));
      expect([inside.width, inside.height]).toEqual([entry.readUInt8(0), entry.readUInt8(1)]);
      expect(inside.alpha).toBe(true);
      expect(inside.first[3]).toBe(0);
      return inside.width;
    });
    expect(sizes).toEqual([16, 32, 48]);
  });

  test('the iPhone’s home-screen icon is 180 by 180 on the app’s dark ground', () => {
    const icon = png(file('public/apple-touch-icon.png'));
    expect([icon.width, icon.height]).toEqual([180, 180]);
    expect(icon.alpha).toBe(false);
    expect(icon.first).toEqual(rgb(CANVAS));
  });

  test('the manifest gives the name and the icons, each icon a real file of the size it says', () => {
    const manifest = JSON.parse(text('public/site.webmanifest')) as {
      name: string; short_name: string; description: string; start_url: string; background_color: string; theme_color: string;
      icons: Array<{ src: string; sizes: string; type: string }>;
    };
    expect(manifest).toEqual({
      name: 'RW-Rent',
      short_name: 'RW-Rent',
      description: DESCRIPTION,
      start_url: '/',
      background_color: CANVAS,
      theme_color: CANVAS,
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      ],
    });
    for (const icon of manifest.icons.filter((one) => one.type === 'image/png')) {
      const drawn = png(file(`public${icon.src}`));
      expect(`${drawn.width}x${drawn.height}`, icon.src).toBe(icon.sizes);
      expect(drawn.first, icon.src).toEqual(rgb(CANVAS));
    }
  });

  test('the icons’ source draws the same two paths in the brand’s red on the dark ground', () => {
    const source = text('brand/icon.html');
    expect(source).toContain(`<path d="${UPPER}"/><path d="${LOWER}"/>`);
    expect(source).toContain(`background: ${CANVAS};`);
    expect(source).toContain(`fill: ${BRAND};`);
  });
});

describe('F21-1: no search engine lists the app, and a messenger’s preview works', () => {
  test('the page says noindex', () => {
    expect(meta('name', 'robots')).toEqual(['noindex']);
  });

  test('robots.txt refuses no robot: one that cannot read the page cannot see its noindex, and a messenger’s robot reads it for the preview', () => {
    const rules = text('public/robots.txt').split('\n').map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
    expect(rules).toEqual(['User-agent: *', 'Allow: /']);
  });
});

describe('F21-1: every one of these is a real file of the build, made from a source kept in the repository', () => {
  test('public/ holds exactly these files, at its root, where the build copies them beside the page', () => {
    expect(readdirSync(new URL('public/', ROOT)).sort()).toEqual([
      'apple-touch-icon.png', 'favicon.ico', 'favicon.svg', 'icon-192.png', 'icon-512.png', 'og-image.png', 'robots.txt', 'site.webmanifest',
    ]);
    // The build takes `public/` as it stands: nothing in the configuration moves or renames it.
    expect(text('vite.config.ts')).not.toMatch(/publicDir|base:/);
  });

  test('every file the page and the manifest name exists', () => {
    const named = [
      ...links.filter((link) => link['href']?.startsWith('/')).map((link) => link['href']!),
      ...[meta('property', 'og:image')[0]!, meta('name', 'twitter:image')[0]!].map((address) => {
        expect(address.startsWith(`${APP}/`)).toBe(true);
        return address.slice(APP.length);
      }),
      '/robots.txt',
    ];
    expect(named.sort()).toEqual(['/apple-touch-icon.png', '/favicon.ico', '/favicon.svg', '/og-image.png', '/og-image.png', '/robots.txt', '/site.webmanifest']);
    for (const path of named) expect(has(`public${path}`), path).toBe(true);
  });

  test('the pictures in public/ are what `node brand/make.cjs` made from the sources as they stand', () => {
    const made = JSON.parse(text('brand/made.json')) as { command: string; sources: Record<string, string>; files: Record<string, string> };
    const fingerprint = (path: string) => createHash('sha256').update(file(path)).digest('hex');
    expect(made.command).toBe('node brand/make.cjs');
    expect(Object.keys(made.sources).sort()).toEqual(['icon.html', 'make.cjs', 'og-image.html']);
    expect(Object.keys(made.files).sort()).toEqual(['apple-touch-icon.png', 'favicon.ico', 'icon-192.png', 'icon-512.png', 'og-image.png']);
    // A source changed since the pictures were made: run the command again.
    for (const [name, recorded] of Object.entries(made.sources)) expect(fingerprint(`brand/${name}`), `brand/${name}`).toBe(recorded);
    // A picture changed by hand, or left behind by an older run.
    for (const [name, recorded] of Object.entries(made.files)) expect(fingerprint(`public/${name}`), `public/${name}`).toBe(recorded);
    expect(text('brand/make.cjs')).toContain(' *     node brand/make.cjs\n');
  });
});
