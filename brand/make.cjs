/*
 * Makes the picture a link to the app shows, and the app's icons, from their sources in this folder:
 *
 *     node brand/make.cjs
 *
 *   brand/og-image.html              public/og-image.png          1200 by 630
 *   brand/icon.html                  public/apple-touch-icon.png  180 by 180, on the dark ground
 *                                    public/icon-192.png          192 by 192, for the web manifest
 *                                    public/icon-512.png          512 by 512, for the web manifest
 *   brand/icon.html?ground=none      public/favicon.ico           16, 32 and 48, no ground
 *
 * public/favicon.svg, site.webmanifest and robots.txt are written by hand and are their own sources.
 *
 * It opens each page in Chromium and takes its picture. Chromium comes with Playwright, which this
 * project does not depend on: it is read from the testing folder beside the repositories, or from the
 * folder RWRENT_PLAYWRIGHT names. The picture's two typefaces come from Google's servers, as the
 * app's own do, so the command needs the network; it stops if either has not loaded, rather than
 * draw the name in another face.
 *
 * It also writes brand/made.json: the fingerprints of the sources it read and of the files it wrote.
 * A test compares them with what is in the repository, so a source changed without this command run
 * again, or a picture changed by hand, fails the suite.
 */
const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');

const PLAYWRIGHT = process.env.RWRENT_PLAYWRIGHT || '/Users/zulf/rw-rent-api/testing-scratch/node_modules/playwright';
const BRAND = __dirname;
const PUBLIC = join(__dirname, '..', 'public');
const SOURCES = ['og-image.html', 'icon.html', 'make.cjs'];
const FACES = ['600 96px Poppins', '34px Michroma'];

const fingerprint = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** An .ico that holds each size as a PNG, which every browser that asks for /favicon.ico reads. */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + 16 * images.length;
  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((image) => image.png)]);
}

async function main() {
  const { chromium } = require(PLAYWRIGHT);
  const browser = await chromium.launch();
  const written = {};
  const write = (name, bytes) => {
    writeFileSync(join(PUBLIC, name), bytes);
    written[name] = fingerprint(bytes);
    console.log(`public/${name}  ${bytes.length} bytes`);
  };
  try {
    const shot = async (file, query, width, height, options = {}) => {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      await page.goto(pathToFileURL(join(BRAND, file)).href + query, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width, height }, ...options });
      const faces = await page.evaluate((wanted) => wanted.map((face) => document.fonts.check(face)), FACES);
      const loaded = await page.evaluate(() => [...document.fonts].filter((face) => face.status === 'loaded').map((face) => face.family.replace(/["']/g, '')));
      await page.close();
      return { png, faces, loaded };
    };

    const picture = await shot('og-image.html', '', 1200, 630);
    for (const family of ['Poppins', 'Michroma']) {
      if (!picture.loaded.includes(family)) throw new Error(`${family} did not load: the picture would be drawn in another face. Is the network reachable?`);
    }
    if (picture.faces.includes(false)) throw new Error(`a typeface is missing: ${JSON.stringify(picture.faces)}`);
    write('og-image.png', picture.png);

    for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
      write(name, (await shot('icon.html', '', size, size)).png);
    }

    const tab = [];
    for (const size of [16, 32, 48]) {
      tab.push({ size, png: (await shot('icon.html', '?ground=none', size, size, { omitBackground: true })).png });
    }
    write('favicon.ico', ico(tab));
  } finally {
    await browser.close();
  }

  const made = {
    command: 'node brand/make.cjs',
    sources: Object.fromEntries(SOURCES.map((name) => [name, fingerprint(readFileSync(join(BRAND, name)))])),
    files: written,
  };
  writeFileSync(join(BRAND, 'made.json'), `${JSON.stringify(made, null, 2)}\n`);
  console.log('brand/made.json');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
