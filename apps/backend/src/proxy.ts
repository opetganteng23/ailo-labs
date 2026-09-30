import { NextRequest, NextResponse } from "next/server";

import { ADMIN_IDLE_SECONDS, createSessionToken, isAdminRole, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { getEnv } from "@/lib/env";

async function handleAdminAuth(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // /admin has no page of its own (only the shell layout) - it must always
  // land on a real page, whether or not the visitor is logged in yet, or
  // Next.js renders a bare 404 inside the admin shell.
  if (pathname === "/admin" || pathname === "/admin/") {
    const target = request.nextUrl.clone();
    target.pathname = "/admin/dashboard";
    return NextResponse.redirect(target);
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

/** The lecturer dashboard is only for "dosen" accounts; everyone else signs in first. */
async function handleDosenAuth(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || session.role !== "dosen") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = session && isAdminRole(session.role) ? "/admin/dashboard" : "/login";
    loginUrl.search = session ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
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

  if (pathname.startsWith("/dosen")) {
    return handleDosenAuth(request);
  }

  const response = request.method === "OPTIONS" ? new NextResponse(null, { status: 204 }) : NextResponse.next();
  return applyCors(request, response);
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/dosen/:path*"],
};
