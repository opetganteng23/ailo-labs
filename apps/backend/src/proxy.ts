import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE, USER_SESSION_COOKIE, verifySessionToken, verifyUserSessionToken } from "@/lib/auth";
import { getEnv } from "@/lib/env";

async function handleAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return null;
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin/users") && session.role !== "super_admin") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/admin/dashboard";
    dashboardUrl.search = "?error=forbidden";
    return NextResponse.redirect(dashboardUrl);
  }

  return null;
}

async function handleBookingAuth(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(USER_SESSION_COOKIE)?.value;
  const session = token ? await verifyUserSessionToken(token) : null;

  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  return null;
}

function applyCors(request: NextRequest, response: NextResponse) {
  const configuredOrigin = getEnv().CORS_ORIGIN;
  const requestOrigin = request.headers.get("origin");

  if (configuredOrigin && requestOrigin === configuredOrigin) {
    response.headers.set("Access-Control-Allow-Origin", configuredOrigin);
    response.headers.set("Vary", "Origin");
  }

  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const redirect = await handleAdminAuth(request);
    if (redirect) return redirect;
    return NextResponse.next();
  }

  if (/^\/labs\/[^/]+\/booking\/?$/.test(pathname)) {
    const redirect = await handleBookingAuth(request);
    if (redirect) return redirect;
    return NextResponse.next();
  }

  const response = request.method === "OPTIONS" ? new NextResponse(null, { status: 204 }) : NextResponse.next();
  return applyCors(request, response);
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/labs/:slug/booking"],
};
