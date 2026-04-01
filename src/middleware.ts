import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // Allow admin subdomain and vercel.app domain to access the panel
  if (
    host.startsWith("admin.") ||
    host.endsWith(".vercel.app") ||
    host === "localhost:3000"
  ) {
    return NextResponse.next();
  }

  // Allow API routes from any host
  if (url.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // For any other subdomain, rewrite to static project files
  const subdomainMatch = host.match(/^([^.]+)\.wtf-agency\.works$/);
  if (subdomainMatch) {
    const subdomain = subdomainMatch[1];
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    url.pathname = `/projects/${subdomain}${path}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
