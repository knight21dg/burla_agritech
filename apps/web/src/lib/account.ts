import { z } from "zod";

/**
 * Sign-up and sign-in rules, shared by the forms and the server actions.
 *
 * Passwords: at least 8 characters and at most 128, nothing else demanded —
 * length is what makes a password strong, and composition rules mostly make
 * people write them down (NIST SP 800-63B).
 */

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "That email address is too long.")
  .email("Enter a valid email address.");

export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter your name.")
      .max(80, "Keep your name under 80 characters."),
    email,
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(128, "Use at most 128 characters."),
  })
  .strict();

export const signInSchema = z
  .object({
    email,
    // Not length-checked beyond a sanity cap: an old password shorter than
    // today's minimum must still be able to sign in.
    password: z.string().min(1, "Enter your password.").max(128),
  })
  .strict();

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

/**
 * Where to go after signing in. Only a path on this site — never another
 * origin, so a crafted link cannot bounce a shopper to a look-alike site.
 */
export function safeNextPath(next: unknown, fallback = "/account"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
