import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/favicon.ico"];

function isPublic(pathname: string) {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/fonts")
  );
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Use atob (Edge-runtime safe) rather than Buffer to decode the session cookie.
    const decoded = typeof atob === "function" ? atob(token) : null;
    if (!decoded) throw new Error("invalid token");
    const user = JSON.parse(decoded);
    if (!user || !user.email) throw new Error("no user");

    // Restricted accounts cannot reach Agent Forge or the endpoints that call
    // the Claude API and burn credits. The assessment narrative degrades to a
    // deterministic template on a 403, so the scorecard stays complete.
    if (user.role === "restricted") {
      if (
        pathname.startsWith("/api/chat") ||
        pathname.startsWith("/api/assessments/")
      ) {
        return NextResponse.json({ error: "Not available for this account" }, { status: 403 });
      }
      if (pathname.startsWith("/forge")) {
        const deniedUrl = new URL("/", req.url);
        deniedUrl.searchParams.set("denied", "forge");
        return NextResponse.redirect(deniedUrl);
      }
    }
  } catch {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
