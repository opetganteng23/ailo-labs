import { NextResponse } from "next/server";

import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export function GET() {
  const env = getEnv();

  return NextResponse.json({
    success: true,
    data: {
      service: "ailo-backend",
      status: "ok",
      databaseConfigured: Boolean(env.MONGODB_URI),
      timestamp: new Date().toISOString(),
    },
  });
}
