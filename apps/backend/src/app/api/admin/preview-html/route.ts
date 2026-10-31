import { NextRequest, NextResponse } from "next/server";

import { isAdminRole, requireSession } from "@/lib/auth";
import { SCRIPT_ROLES } from "@/lib/htmlTrust";
import { isHtmlTrusted } from "@/lib/htmlTrust";
import { renderRichText, sanitizeRichText, stripPendingScripts } from "@/lib/sanitizeHtml";

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
  // An admin's preview never runs a lecturer's unreviewed script (they are marked data-pending until an admin saves them).
  // A lecturer previewing their own page does run it, in their own session, so they can try it before submitting.
  const admin = SCRIPT_ROLES.includes(auth.session.role);
  const source = admin ? stripPendingScripts(html) : html;
  return NextResponse.json({ success: true, data: { html: renderRichText(sanitizeRichText(source, { trusted: true, scripts: true })) } });
}
