/**
 * Where photographs live, and how a page finds one.
 *
 * Every photograph the site shows is a row in `media`. The row's key says
 * where the file is:
 *
 *   static/images/products/mango-pickle.webp
 *       A photograph the client supplied that ships with the site, in the
 *       storefront's `public/` folder. Registered, never copied.
 *
 *   uploads/2026/09/7d1c….webp
 *       Uploaded from the admin. Kept in MEDIA_DIR, served by the storefront
 *       at /media/2026/09/7d1c….webp.
 *
 * One lookup for both, so a page never needs to know which kind it has, and
 * changing or removing a photo in the admin changes what every page shows.
 *
 * In production, uploads belong in object storage (Cloudflare R2), because a
 * server's disk does not survive a redeploy. The key scheme already allows
 * for that: only `resolveUploadPath` and the storefront's /media route change.
 */

/** Keys are server-made; this only ever parses our own. */
const STATIC_PREFIX = "static/";
const UPLOADS_PREFIX = "uploads/";

/**
 * A path on the storefront's own origin.
 *
 * Relative, so the storefront can use it as-is; the admin, on another
 * origin, prefixes the storefront's address.
 */
export function mediaPath(key: string): string {
  if (key.startsWith(STATIC_PREFIX)) return `/${key.slice(STATIC_PREFIX.length)}`;
  if (key.startsWith(UPLOADS_PREFIX)) return `/media/${key.slice(UPLOADS_PREFIX.length)}`;
  // Unknown scheme: show nothing rather than guess at a URL.
  return "";
}

export function isUploadKey(key: string): boolean {
  return key.startsWith(UPLOADS_PREFIX);
}

export function staticKey(publicPath: string): string {
  return `${STATIC_PREFIX}${publicPath.replace(/^\/+/, "")}`;
}

/** What a page needs to draw a photograph. */
export interface PhotoRef {
  url: string;
  alt: string;
  width: number;
  height: number;
}

/**
 * The segments of an upload path, checked.
 *
 * `/media/2026/09/<uuid>.webp` — four digits, two digits, a uuid, `.webp`.
 * Anything else is refused before it gets near the filesystem, which is what
 * makes `..` and friends impossible rather than merely filtered.
 */
const UPLOAD_SEGMENTS = [/^\d{4}$/, /^\d{2}$/, /^[0-9a-f-]{36}\.webp$/];

export function isValidUploadPath(segments: readonly string[]): boolean {
  return (
    segments.length === UPLOAD_SEGMENTS.length &&
    segments.every((segment, index) => UPLOAD_SEGMENTS[index]!.test(segment))
  );
}
