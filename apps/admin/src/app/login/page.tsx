import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isStaff } from "@burla/core/auth/rbac";
import { currentActor } from "@/server/auth/session";
import { safeNextPath } from "@/lib/auth";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in" };

/**
 * The only page in this application that an anonymous request may render.
 *
 * There is no "create an account" link, because there is no sign-up route:
 * staff accounts are made by someone who already has one, or from the command
 * line (`npm run admin:create`). A public sign-up on an admin domain is how
 * the front door gets left open.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { next } = await searchParams;
  const destination = safeNextPath(typeof next === "string" ? next : undefined);

  // Already signed in: no reason to show the form again.
  const actor = await currentActor();
  if (isStaff(actor)) redirect(destination);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-12">
      <div className="panel p-6">
        <p className="label">Burla Global Agri Products</p>
        <h1 className="mt-1 text-lg">Staff sign-in</h1>
        <p className="mt-1 text-[0.8125rem] text-ink-2">
          This area is for Burla staff. Customer accounts do not have access.
        </p>

        <div className="mt-6">
          <SignInForm next={destination} />
        </div>
      </div>

      <p className="mt-4 text-center text-[0.75rem] text-ink-3">
        Trouble signing in? Ask an administrator to check your account.
      </p>
    </main>
  );
}
