import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { capabilitiesOf } from "@burla/core/auth/rbac";
import { env } from "@burla/core/env";
import { requireStaff } from "@/server/auth/session";
import { Nav } from "@/components/Nav";
import { SignOutButton } from "@/components/SignOutButton";

/**
 * The frame around every signed-in page: the Burla name, the menu, who is
 * signed in, a link to the website, and Sign out.
 *
 * `requireStaff` runs here, on the server, before anything renders — and each
 * page and action checks again for its own permission.
 */
export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const actor = await requireStaff();
  const who = actor.kind === "user" ? actor : undefined;

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15rem_1fr]">
      <aside className="border-line bg-panel md:sticky md:top-0 md:h-dvh md:overflow-y-auto md:border-r">
        <Link href="/" className="flex items-center gap-2.5 border-b border-line px-4 py-3">
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-md bg-accent-dark text-[0.9375rem] font-bold text-white">
            B
          </span>
          <span className="text-[1.0625rem] font-semibold">Burla Admin</span>
        </Link>
        <Nav capabilities={[...capabilitiesOf(actor)]} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-panel px-4 py-2.5">
          <p className="min-w-0 truncate font-medium">{who?.name ?? who?.email}</p>
          <div className="flex shrink-0 items-center gap-4">
            {env.STOREFRONT_URL && (
              <a
                href={env.STOREFRONT_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="hidden items-center gap-1.5 text-[0.9375rem] text-ink-2 hover:text-ink sm:inline-flex"
              >
                View website
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            )}
            <SignOutButton />
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 md:px-6 md:py-6">{children}</main>
      </div>
    </div>
  );
}
