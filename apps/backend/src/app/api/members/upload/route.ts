import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { UPLOADS_DIR } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/**
 * Public upload endpoint scoped to the membership registration form (photo +
 * proof-of-affiliation document). Deliberately not admin-gated - a visitor
 * applying for membership has no account yet - but restricted to a small set
 * of file types and a modest size cap, unlike the admin-only /api/upload.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ success: false, error: "File is too large (max 8MB)." }, { status: 400 });
  }
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json({ success: false, error: "Unsupported file type. Use PNG, JPEG, WebP, or PDF." }, { status: 400 });
  }

  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  const filename = `${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);

  return NextResponse.json({ success: true, data: { url: `/uploads/${filename}` } });
}
