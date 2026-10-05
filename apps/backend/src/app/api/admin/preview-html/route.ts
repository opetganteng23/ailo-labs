import { NextRequest, NextResponse } from "next/server";

import { isAdminRole, requireSession } from "@/lib/auth";
import { isHtmlTrusted } from "@/lib/htmlTrust";
import { renderRichText } from "@/lib/sanitizeHtml";

export const dynamic = "force-dynamic";

/** Returns the HTML exactly as it would be saved and shown to visitors, for the editor's HTML-mode preview. */
export async function POST(request: NextRequest) {
  const auth = await requireSession(request, ["super_admin", "admin", "staff_lab", "dosen"]);
  if (!auth.ok) return auth.response;
  if (!isAdminRole(auth.session.role) && !(await isHtmlTrusted(auth.session.sub))) {
    return NextResponse.json({ success: false, error: "Not allowed." }, { status: 403 });
  }

  let body: { html?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "We could not read that request." }, { status: 400 });
  }
  const html = typeof body.html === "string" ? body.html.slice(0, 500_000) : "";
  return NextResponse.json({ success: true, data: { html: renderRichText(html) } });
}
