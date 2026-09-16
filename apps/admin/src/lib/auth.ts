import { z } from "zod";

/**
 * What the sign-in form is allowed to send.
 *
 * `.strict()` is the mass-assignment guard (docs/AUTHORIZATION.md §10, test
 * 10): a payload carrying an extra `role`, `status` or `userId` is rejected
 * outright rather than parsed and quietly ignored. Every admin input schema
 * in this application is strict for the same reason.
 */
export const adminSignInSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254, "That email address is too long.")
      .email("Enter a valid email address."),
    // Not length-checked beyond a sanity cap: an old password shorter than
    // today's minimum must still be able to sign in.
    password: z.string().min(1, "Enter your password.").max(128),
  })
  .strict();

export type AdminSignInInput = z.infer<typeof adminSignInSchema>;

/**
 * Where to go after signing in.
 *
 * Only a path on this origin, so a crafted `?next=` cannot bounce a staff
 * member to a look-alike sign-in page and collect the password they type
 * there. Protocol-relative (`//host`) and backslash forms are the ones people
 * forget; both are rejected here.
 */
export function safeNextPath(next: unknown, fallback = "/"): string {
  if (typeof next !== "string" || next.length > 512) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
