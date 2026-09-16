import { requireStaff } from "@/server/auth/session";
import { Nav } from "@/components/Nav";
import { SignOutButton } from "@/components/SignOutButton";

/**
 * Everything inside this group is behind the door.
 *
 * `requireStaff` runs here, on the server, before any child renders — and
 * again inside each page that shows something not every role may see. The
 * middleware redirect that got the visitor here checked only that a cookie
 * exists; this is where the session is actually read and the roles loaded.
 *
 * Nothing in this layout is cached: it is one lookup, shared by the whole
 * request through React's cache, and staff data must never be served stale
 * from a shared cache to the wrong person.
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const actor = await requireStaff();
  const who = actor.kind === "user" ? actor : undefined;

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[13.5rem_1fr]">
      <aside className="border-line bg-panel md:min-h-dvh md:border-r">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3 md:py-4">
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-sm bg-accent-dark text-[0.6875rem] font-bold text-white"
          >
            B
          </span>
          <div className="leading-tight">
            <p className="text-[0.8125rem] font-semibold">Burla Admin</p>
            <p className="text-[0.6875rem] text-ink-3">Internal</p>
          </div>
        </div>
        <Nav actor={actor} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-line bg-panel px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[0.8125rem] font-medium">
              {who?.name ?? who?.email}
            </p>
            <p className="truncate text-[0.6875rem] text-ink-3">
              {who?.roles.join(" · ")}
            </p>
          </div>
          <SignOutButton />
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
