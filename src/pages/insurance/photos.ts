/**
 * Photos in the dialogs (Follow-up 17, F17-6), made ready in the browser before they are sent, with
 * no new dependency: the browser's own image decoder and canvas.
 *
 * A picture whose longer side is over 2560 px, or which is over 3 MB, is redrawn at most 2560 px on
 * its longer side and sent as JPEG at quality 0.85; a smaller JPEG, PNG or WebP goes as it is. A file
 * that is not a picture, or a picture this browser cannot open (a HEIC photo on a computer that
 * cannot read it), is refused under its tile before anything is sent. The API stays the judge: it
 * reads every photo by its content, and its refusals land under the tile they name.
 */

/** What the API keeps: JPEG, PNG or WebP by the picture's content. */
export const PHOTO_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];

/** The longer side a picture is drawn at, at most. */
export const MAX_SIDE = 2560;

/** A picture over this size is redrawn, whatever its sides. */
export const MAX_BYTES_AS_IS = 3 * 1024 * 1024;

export const JPEG_QUALITY = 0.85;

/** At most this many photos go in one dialog, as the API takes in one request. */
export const MAX_PHOTOS = 20;

export const NOT_A_PICTURE = 'This file is not a photo. Only photos can be added: JPEG, PNG or WebP.';
export const CANNOT_OPEN =
  'This browser cannot open this photo. Save it as JPEG, PNG or WebP and add it again.';

/** How a picture goes: as it is, or redrawn at `width` × `height` as JPEG. */
export type PhotoPlan = { redraw: false } | { redraw: true; width: number; height: number };

/**
 * Whether a decoded picture is redrawn, and at what size. A picture over the limits is scaled so its
 * longer side is at most 2560 px; one of another kind than the API keeps (a GIF, a BMP, or a HEIC
 * this browser can read) is redrawn as JPEG at its own size.
 */
export function photoPlan(p: { type: string; size: number; width: number; height: number }): PhotoPlan {
  const longer = Math.max(p.width, p.height);
  const tooBig = longer > MAX_SIDE || p.size > MAX_BYTES_AS_IS;
  if (!tooBig && PHOTO_TYPES.includes(p.type)) return { redraw: false };
  const scale = longer > MAX_SIDE ? MAX_SIDE / longer : 1;
  return {
    redraw: true,
    width: Math.max(1, Math.round(p.width * scale)),
    height: Math.max(1, Math.round(p.height * scale)),
  };
}

/** A redrawn picture keeps its name with a .jpg ending: "IMG_2041.HEIC" becomes "IMG_2041.jpg". */
export function jpegName(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName || 'photo';
  return `${stem}.jpg`;
}

/** A photo made ready: what is sent, under what name, and how large it is now. */
export type PreparedPhoto =
  | { ok: true; file: Blob; fileName: string; size: number; redrawn: boolean }
  | { ok: false; error: string };

/** A file the browser's type or name says is a picture; anything else is refused before decoding. */
const looksLikePicture = (file: File) =>
  file.type.startsWith('image/') || (!file.type && /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif|tiff?)$/i.test(file.name));

async function draw(bitmap: ImageBitmap, width: number, height: number): Promise<Blob | null> {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, width, height);
    return canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
}

/**
 * Makes one chosen file ready to send, or says in words why it cannot go. The picture is decoded
 * the right way up (its own orientation), so a redrawn phone photo does not lie on its side.
 */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (!looksLikePicture(file)) return { ok: false, error: NOT_A_PICTURE };
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return { ok: false, error: file.type.startsWith('image/') || !file.type ? CANNOT_OPEN : NOT_A_PICTURE };
  }
  try {
    const plan = photoPlan({ type: file.type, size: file.size, width: bitmap.width, height: bitmap.height });
    if (!plan.redraw) return { ok: true, file, fileName: file.name, size: file.size, redrawn: false };
    const blob = await draw(bitmap, plan.width, plan.height);
    if (!blob) return { ok: false, error: CANNOT_OPEN };
    return { ok: true, file: blob, fileName: jpegName(file.name), size: blob.size, redrawn: true };
  } finally {
    bitmap.close();
  }
}
