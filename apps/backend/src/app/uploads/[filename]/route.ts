import fs from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { CONTENT_TYPES, UPLOADS_DIR } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;

  // Reject anything that isn't a plain filename (no path traversal).
  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }

  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }

  try {
    const buffer = await fs.readFile(path.join(UPLOADS_DIR, filename));
    const headers: Record<string, string> = {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    };
    // SVGs can embed <script>; neutralize it if the file is ever opened directly
    // (not via <img>, which already can't execute scripts in an SVG it renders).
    if (contentType === "image/svg+xml") {
      headers["content-security-policy"] = "script-src 'none'; sandbox";
    }
    return new NextResponse(buffer, { headers });
  } catch {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }
}
