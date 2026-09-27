import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  CANNOT_OPEN, JPEG_QUALITY, MAX_BYTES_AS_IS, NOT_A_PICTURE, jpegName, photoPlan, preparePhoto,
} from './photos';

/**
 * Photos are made smaller in the browser before they are sent (Follow-up 17, F17-6): over 2560 px on
 * the longer side, or over 3 MB, a picture is redrawn at most 2560 px as JPEG at 0.85; a smaller JPEG,
 * PNG or WebP goes as it is; a file that is not a picture, or one this browser cannot open, is refused
 * before anything is sent.
 */
describe('how a picture goes', () => {
  test('a smaller JPEG, PNG or WebP goes as it is', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(photoPlan({ type, size: 2_000_000, width: 2560, height: 1920 })).toEqual({ redraw: false });
    }
    expect(photoPlan({ type: 'image/jpeg', size: MAX_BYTES_AS_IS, width: 1200, height: 1600 })).toEqual({ redraw: false });
  });

  test('a longer side over 2560 is scaled to 2560, the other side in proportion', () => {
    expect(photoPlan({ type: 'image/jpeg', size: 2_000_000, width: 4032, height: 3024 }))
      .toEqual({ redraw: true, width: 2560, height: 1920 });
    expect(photoPlan({ type: 'image/png', size: 900_000, width: 1080, height: 2561 }))
      .toEqual({ redraw: true, width: 1080, height: 2560 });
  });

  test('over 3 MB it is redrawn at its own size when its sides are within 2560', () => {
    expect(photoPlan({ type: 'image/jpeg', size: MAX_BYTES_AS_IS + 1, width: 2400, height: 1800 }))
      .toEqual({ redraw: true, width: 2400, height: 1800 });
  });

  test('another kind of picture the browser opens (a GIF, a HEIC it reads) is redrawn as JPEG', () => {
    expect(photoPlan({ type: 'image/gif', size: 40_000, width: 400, height: 300 })).toEqual({ redraw: true, width: 400, height: 300 });
    expect(photoPlan({ type: 'image/heic', size: 2_500_000, width: 4032, height: 3024 })).toEqual({ redraw: true, width: 2560, height: 1920 });
  });

  test('a redrawn picture keeps its name with a .jpg ending', () => {
    expect(jpegName('IMG_2041.HEIC')).toBe('IMG_2041.jpg');
    expect(jpegName('scan.of.bumper.png')).toBe('scan.of.bumper.jpg');
    expect(jpegName('photo')).toBe('photo.jpg');
    expect(jpegName('')).toBe('photo.jpg');
  });
});

describe('making a chosen file ready', () => {
  afterEach(() => vi.unstubAllGlobals());

  const bitmap = (width: number, height: number) => ({ width, height, close: vi.fn() });

  test('a file that is not a picture is refused before anything is decoded', async () => {
    const decode = vi.fn();
    vi.stubGlobal('createImageBitmap', decode);
    const pdf = new File(['%PDF-1.7'], 'claim.pdf', { type: 'application/pdf' });
    expect(await preparePhoto(pdf)).toEqual({ ok: false, error: NOT_A_PICTURE });
    expect(decode).not.toHaveBeenCalled();
  });

  test('a picture this browser cannot open is refused in words that say so', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn(() => Promise.reject(new DOMException('The source image could not be decoded.'))));
    const heic = new File(['....ftypheic'], 'IMG_7001.HEIC', { type: 'image/heic' });
    expect(await preparePhoto(heic)).toEqual({ ok: false, error: CANNOT_OPEN });
  });

  test('a small JPEG goes as it is, the picture decoded the right way up', async () => {
    const decoded = bitmap(1600, 1200);
    const decode = vi.fn(() => Promise.resolve(decoded));
    vi.stubGlobal('createImageBitmap', decode);
    const jpeg = new File([new Uint8Array(500_000)], 'IMG_2041.jpg', { type: 'image/jpeg' });
    expect(await preparePhoto(jpeg)).toEqual({ ok: true, file: jpeg, fileName: 'IMG_2041.jpg', size: 500_000, redrawn: false });
    expect(decode).toHaveBeenCalledWith(jpeg, { imageOrientation: 'from-image' });
    expect(decoded.close).toHaveBeenCalled();
  });

  test('a large photo is redrawn at 2560 px as JPEG at quality 0.85', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn(() => Promise.resolve(bitmap(4032, 3024))));
    const drawn: Array<{ width: number; height: number; options: unknown }> = [];
    class FakeCanvas {
      constructor(public width: number, public height: number) {}
      getContext() { return { drawImage: vi.fn() }; }
      convertToBlob(options: unknown) {
        drawn.push({ width: this.width, height: this.height, options });
        return Promise.resolve(new Blob([new Uint8Array(1_200_000)], { type: 'image/jpeg' }));
      }
    }
    vi.stubGlobal('OffscreenCanvas', FakeCanvas);
    const big = new File([new Uint8Array(6_000_000)], 'IMG_3001.png', { type: 'image/png' });
    const ready = await preparePhoto(big);
    expect(ready).toMatchObject({ ok: true, fileName: 'IMG_3001.jpg', size: 1_200_000, redrawn: true });
    expect(drawn).toEqual([{ width: 2560, height: 1920, options: { type: 'image/jpeg', quality: JPEG_QUALITY } }]);
  });
});
