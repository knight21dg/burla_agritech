import { isValidUploadPath } from "@burla/core/media";
import { readUpload } from "@burla/core/media/store";

/**
 * Photographs uploaded from the admin: /media/2026/09/<uuid>.webp
 *
 * The admin saves them to MEDIA_DIR; this serves them. The path is checked
 * against the exact shape the admin writes — year, month, uuid, `.webp` —
 * before it is joined to anything on disk, so there is no path a request can
 * name that leaves that folder or reaches a file we did not write ourselves.
 *
 * Cached for a year and marked immutable, which is safe because a filename is
 * never reused: changing a photo in the admin uploads a new file with a new
 * name, so no browser can be left holding a stale copy.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  if (!isValidUploadPath(path)) return new Response(null, { status: 404 });

  try {
    const bytes = await readUpload(`uploads/${path.join("/")}`);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    // Missing file, or photo uploads not configured on this machine: both are
    // simply "no such photo" to the visitor.
    return new Response(null, { status: 404 });
  }
}
