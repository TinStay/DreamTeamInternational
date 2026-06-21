import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/zh" || pathname.startsWith("/zh/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/zh/, "/en") || "/en";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/zh", "/zh/:path*"],
};
