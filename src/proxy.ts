import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, getAccountForToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/signup"];
// Informational, not an auth form — viewable whether logged in or not, unlike PUBLIC_PATHS
// (which bounces an already-logged-in visitor back to "/").
const ALWAYS_ACCESSIBLE_PATHS = ["/terms"];

// Proxy defaults to the Node.js runtime in Next 16, so we can do the real
// session + admin check here instead of just a cookie-presence guess. Server
// Actions still re-check independently (see requireAdmin() in actions/admin.ts) —
// a matcher change here should never be the only thing standing between a
// request and a privileged mutation.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (ALWAYS_ACCESSIBLE_PATHS.includes(pathname)) return NextResponse.next();

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const account = await getAccountForToken(request.cookies.get(COOKIE_NAME)?.value);

  if (!isPublic && !account) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isPublic && account) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && account && !account.is_admin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Fantasy membership is independent of is_admin — an admin who isn't
  // personally in the league shouldn't see it either.
  if (pathname.startsWith("/fantasy") && account && !account.fantasy_member) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // manifest.webmanifest/sw.js/icons are fetched by the browser/OS outside any
  // user session (e.g. checking "add to home screen" eligibility) — never gate them.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/).*)"],
};
