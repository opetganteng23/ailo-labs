import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { UPLOADS_DIR } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const MAX_BYTES = 50 * 1024 * 1024;

/** Admin-only upload for book PDFs (kept apart from the image upload, which stays small and image-only). */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, ["super_admin", "admin", "staff_lab"]);
  if (!auth.ok) return auth.response;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ success: false, error: "File is too large (max 50 MB)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // Trust the file's own header, not just the type the browser claims.
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    return NextResponse.json({ success: false, error: "Unsupported file type. Please upload a PDF." }, { status: 400 });
  }

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}.pdf`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);

  return NextResponse.json({ success: true, data: { url: `/uploads/${filename}` } });
}
