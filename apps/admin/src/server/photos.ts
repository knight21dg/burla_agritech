import "server-only";
import { eq } from "drizzle-orm";
import { db, type Database } from "@burla/core/db";
import { categories, media, productImages } from "@burla/core/db/schema";
import { env } from "@burla/core/env";
import { isUploadKey, mediaPath } from "@burla/core/media";
import { deleteUpload, PhotoError, storePhoto, type StoredPhoto } from "@burla/core/media/store";

/**
 * Photos, from the admin's side.
 *
 * The order of events matters. A new photo's file is written first, outside
 * any transaction — a file is not something a transaction can roll back.
 * Its `media` row is then written inside the same transaction as the product
 * or category change. If that transaction fails, the file is deleted again,
 * so a failed save leaves no orphan behind.
 *
 * A photo that stops being used is tidied up only after the change has
 * committed, and only if it was an upload: the photographs that ship with the
 * site are never deleted from disk.
 */

type Executor = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

export { PhotoError };

/** Where the admin can load a photo from: the shop serves every one of them. */
export function photoUrl(key: string): string {
  const path = mediaPath(key);
  if (!path) return "";
  return `${(env.STOREFRONT_URL ?? "").replace(/\/+$/, "")}${path}`;
}

/** Writes the file. Call before the transaction; see `discard` if it fails. */
export async function prepareUpload(file: File): Promise<StoredPhoto> {
  return storePhoto(file);
}

/** The `media` row for a prepared upload, inside the caller's transaction. */
export async function recordUpload(
  exec: Executor,
  stored: StoredPhoto,
  filename: string,
  uploadedBy: string | null,
): Promise<string> {
  const [row] = await exec
    .insert(media)
    .values({
      r2Key: stored.key,
      // The original name is kept only to be readable; the stored file is
      // always ours, re-encoded, under a random name.
      filename: filename.slice(0, 200) || "photo",
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      width: stored.width,
      height: stored.height,
      uploadedBy,
    })
    .returning({ id: media.id });
  return row!.id;
}

/** A save failed after the file was written: take the file back out. */
export async function discard(stored: StoredPhoto | undefined): Promise<void> {
  if (stored) await deleteUpload(stored.key);
}

/**
 * After a commit: if a photo is no longer used anywhere and was an upload,
 * remove its row and its file. Anything still in use, or shipped with the
 * site, is left alone.
 */
export async function releaseIfUnused(mediaId: string | null | undefined): Promise<void> {
  if (!mediaId) return;

  const [row] = await db.select({ key: media.r2Key }).from(media).where(eq(media.id, mediaId)).limit(1);
  if (!row || !isUploadKey(row.key)) return;

  const [onProduct] = await db
    .select({ id: productImages.id })
    .from(productImages)
    .where(eq(productImages.mediaId, mediaId))
    .limit(1);
  const [onCategory] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.heroImageId, mediaId))
    .limit(1);
  if (onProduct || onCategory) return;

  await db.delete(media).where(eq(media.id, mediaId));
  await deleteUpload(row.key);
}

/** The photo chosen in a form, if it is a real file and not an empty input. */
export function fileFrom(form: FormData, field: string): File | undefined {
  const value = form.get(field);
  return value instanceof File && value.size > 0 ? value : undefined;
}
