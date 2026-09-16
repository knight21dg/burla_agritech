import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { env } from "../env";
import { isUploadKey } from "./index";

/**
 * Saving and reading uploaded photographs.
 *
 * ## What happens to a photo on the way in
 *
 * The bytes are decoded, not trusted. A file is accepted only if sharp can
 * read it as a JPEG, PNG or WebP image — the extension and the browser's
 * claimed type decide nothing, so a renamed script or a PDF is refused. It is
 * then turned the right way up, shrunk to at most 1600px, and re-encoded as
 * WebP.
 *
 * Re-encoding is the important part. It drops everything that was riding in
 * the original: a phone photo carries the GPS position it was taken at, and
 * the owner photographing stock in their own kitchen should not be publishing
 * where they live. It also means every stored file is a well-formed image we
 * produced ourselves.
 */

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_EDGE = 1600;
const ACCEPTED = new Set(["jpeg", "png", "webp"]);

export class PhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoError";
  }
}

function mediaDir(): string {
  const dir = env.MEDIA_DIR;
  if (!dir) {
    throw new PhotoError(
      "Photo uploads are not set up on this computer yet (MEDIA_DIR is missing).",
    );
  }
  return dir;
}

export interface StoredPhoto {
  key: string;
  mimeType: "image/webp";
  sizeBytes: number;
  width: number;
  height: number;
}

export async function storePhoto(file: File): Promise<StoredPhoto> {
  if (file.size === 0) throw new PhotoError("That file is empty. Choose a photo.");
  if (file.size > MAX_BYTES) {
    throw new PhotoError("That photo is too large. Please use one under 10 MB.");
  }

  const input = Buffer.from(await file.arrayBuffer());

  let format: string | undefined;
  try {
    format = (await sharp(input).metadata()).format;
  } catch {
    format = undefined;
  }
  if (!format || !ACCEPTED.has(format)) {
    throw new PhotoError("Please choose a JPG, PNG or WebP photo.");
  }

  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const now = new Date();
  const key = [
    "uploads",
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    `${randomUUID()}.webp`,
  ].join("/");

  const target = resolveUploadPath(key);
  await mkdir(path.dirname(target), { recursive: true });
  // `wx`: never overwrite. A uuid collision would be astonishing; overwriting
  // someone else's photo because of one would be worse.
  await writeFile(target, data, { flag: "wx" });

  return { key, mimeType: "image/webp", sizeBytes: data.length, width: info.width, height: info.height };
}

/** The file for an upload key. Only upload keys; never a static one. */
export function resolveUploadPath(key: string): string {
  if (!isUploadKey(key)) throw new PhotoError("Not an uploaded photo.");
  const base = path.resolve(mediaDir());
  const resolved = path.resolve(base, key);
  // Belt and braces with the key format: the result must stay inside MEDIA_DIR.
  if (!resolved.startsWith(base + path.sep)) throw new PhotoError("Not an uploaded photo.");
  return resolved;
}

export async function readUpload(key: string): Promise<Buffer> {
  return readFile(resolveUploadPath(key));
}

/**
 * Deletes an uploaded file. Static photographs ship with the site and are
 * never deleted from disk — "removing" one only unlinks it from the product.
 */
export async function deleteUpload(key: string): Promise<void> {
  if (!isUploadKey(key)) return;
  await unlink(resolveUploadPath(key)).catch(() => undefined);
}
