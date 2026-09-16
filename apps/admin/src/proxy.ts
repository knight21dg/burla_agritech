import { NextResponse, type NextRequest } from "next/server";

/**
 * The first gate, and the weakest one — deliberately.
 *
 * This is Next 16's `proxy` convention, the replacement for `middleware`.
 * It runs before a page does and sees a URL and a cookie, nothing
 * more. It cannot read the database from the edge, so it cannot know whether
 * a cookie is a live session, whose it is, or what they may do. All it does
 * is send someone with no cookie at all to the sign-in page instead of
 * rendering a shell they will be thrown out of.
 *
 * That is a courtesy to the user. The security decision is made in
 * `requireStaff` / `requirePermission`, on the server, on every request and
 * every action — docs/AUTHORIZATION.md §1.
 */

const COOKIE = "burla_admin_session";

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/login") return NextResponse.next();

  if (!request.cookies.has(COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    // Where they were going, so signing in does not also lose their place.
    // Read back through an allowlist in the action, never used as given.
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next's own assets. There is no public page here to
  // exempt: the whole application is behind the door.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
