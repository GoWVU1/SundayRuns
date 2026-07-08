import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, getAccountForToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/signup"];

// Proxy defaults to the Node.js runtime in Next 16, so we can do the real
// session + admin check here instead of just a cookie-presence guess. Server
// Actions still re-check independently (see requireAdmin() in actions/admin.ts) —
// a matcher change here should never be the only thing standing between a
// request and a privileged mutation.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
