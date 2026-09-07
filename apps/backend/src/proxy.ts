import { NextRequest, NextResponse } from "next/server";

import { getEnv } from "@/lib/env";

export function proxy(request: NextRequest) {
  const configuredOrigin = getEnv().CORS_ORIGIN;
  const requestOrigin = request.headers.get("origin");
  const response = request.method === "OPTIONS"
    ? new NextResponse(null, { status: 204 })
    : NextResponse.next();

  if (configuredOrigin && requestOrigin === configuredOrigin) {
    response.headers.set("Access-Control-Allow-Origin", configuredOrigin);
    response.headers.set("Vary", "Origin");
  }

  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
