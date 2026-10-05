import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { sanitizeRichText } from "@/lib/sanitizeHtml";

export const dynamic = "force-dynamic";

/** Returns the HTML exactly as it would be saved and shown to visitors, for the editor's HTML-mode preview. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let body: { html?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "We could not read that request." }, { status: 400 });
  }
  const html = typeof body.html === "string" ? body.html.slice(0, 500_000) : "";
  return NextResponse.json({ success: true, data: { html: sanitizeRichText(html, { trusted: true }) } });
}
