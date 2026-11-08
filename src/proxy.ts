import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAppSubdomain } from "@/lib/domain";

const PUBLIC_PATHS = ["/login", "/api/login", "/admin-login"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") || "";
  const isApp = isAppSubdomain(host);

  // 1. Allow static assets and favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Allow public auth paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // 3. Check authentication session
  const session = req.cookies.get("shop_session_token")?.value;
  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // ==========================================
  // CASE A: SUBDOMAIN (app.localhost or app.<domain>)
  // ==========================================
  if (isApp) {
    // A1. Root path on app subdomain -> rewrites to /portal
    if (pathname === "/" || pathname === "") {
      const url = req.nextUrl.clone();
      url.pathname = "/portal";
      return NextResponse.rewrite(url);
    }

    // A2. Portal subroutes on app subdomain:
    // If user accesses /attendance -> rewrite to /portal/attendance
    if (pathname === "/attendance") {
      const url = req.nextUrl.clone();
      url.pathname = "/portal/attendance";
      return NextResponse.rewrite(url);
    }
    // If user accesses /manage or /attendance/manage -> rewrite to /portal/manage
    if (pathname === "/manage" || pathname === "/attendance/manage") {
      const url = req.nextUrl.clone();
      url.pathname = "/portal/manage";
      return NextResponse.rewrite(url);
    }
    // If user accesses /settings -> rewrite to /portal/settings (staff shift/gps settings)
    if (pathname === "/settings") {
      const url = req.nextUrl.clone();
      url.pathname = "/portal/settings";
      return NextResponse.rewrite(url);
    }

    // Direct /portal/... routes continue normally
    if (pathname.startsWith("/portal")) {
      return NextResponse.next();
    }

    // A3. Prevent POS-only routes on app subdomain, redirect to main POS domain
    if (
      pathname.startsWith("/pos") ||
      pathname.startsWith("/sales") ||
      pathname.startsWith("/products") ||
      pathname.startsWith("/stock") ||
      pathname.startsWith("/categories") ||
      pathname.startsWith("/reports") ||
      pathname.startsWith("/dashboard")
    ) {
      const portMatch = host.match(/:(\d+)$/);
      const port = portMatch ? `:${portMatch[1]}` : "";
      const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
      const targetHost = isLocal ? `localhost${port}` : host.replace(/^app\./i, "");
      const protocol = req.nextUrl.protocol.replace(/:$/, "");
      const fullUrl = `${protocol}://${targetHost}${pathname}`;
      const res = new NextResponse(null, { status: 307 });
      res.headers.set("location", fullUrl);
      return res;
    }

    return NextResponse.next();
  }

  // ==========================================
  // CASE B: MAIN DOMAIN (localhost:3000 or <domain>)
  // ==========================================
  // B1. If accessed on main POS domain, redirect attendance / portal to app subdomain
  if (pathname.startsWith("/portal")) {
    const portMatch = host.match(/:(\d+)$/);
    const port = portMatch ? `:${portMatch[1]}` : "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const targetHost = isLocal ? `app.localhost${port}` : `app.${host}`;
    const protocol = req.nextUrl.protocol.replace(/:$/, "");
    const cleanPath = pathname.replace(/^\/portal/, "") || "/";
    const fullUrl = `${protocol}://${targetHost}${cleanPath}`;
    const res = new NextResponse(null, { status: 307 });
    res.headers.set("location", fullUrl);
    return res;
  }

  if (pathname === "/attendance" || pathname === "/attendance/manage") {
    const portMatch = host.match(/:(\d+)$/);
    const port = portMatch ? `:${portMatch[1]}` : "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const targetHost = isLocal ? `app.localhost${port}` : `app.${host}`;
    const protocol = req.nextUrl.protocol.replace(/:$/, "");
    const fullUrl = `${protocol}://${targetHost}${pathname}`;
    const res = new NextResponse(null, { status: 307 });
    res.headers.set("location", fullUrl);
    return res;
  }

  return NextResponse.next();
}

// Export both proxy and middleware for Next.js cross-version support
export { proxy as middleware };

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
