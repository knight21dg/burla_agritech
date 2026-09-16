"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/login/actions";

function Button() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-1.5 text-[0.8125rem] text-ink-2 hover:text-ink"
    >
      <LogOut className="size-3.5" aria-hidden="true" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

/**
 * A form, not a link: signing out changes state on the server, and a GET that
 * changes state can be triggered by an image tag on any page in the world.
 */
export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button />
    </form>
  );
}
