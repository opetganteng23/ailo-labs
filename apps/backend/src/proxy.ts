import { NextRequest, NextResponse } from "next/server";

import { ADMIN_IDLE_SECONDS, createSessionToken, isAdminRole, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { getEnv } from "@/lib/env";

async function handleAdminAuth(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || !isAdminRole(session.role)) {
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

  // Idle-timeout session: sliding renewal. Every admin request while the
  // token is still valid re-issues it with a fresh expiry, so staying active
  // keeps the session alive; ADMIN_IDLE_SECONDS of no requests lets it expire.
  const response = NextResponse.next();
  const renewedToken = await createSessionToken(session);
  response.cookies.set(SESSION_COOKIE, renewedToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_IDLE_SECONDS,
  });
  return response;
}

async function handleBookingAuth(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

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
    return handleAdminAuth(request);
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
