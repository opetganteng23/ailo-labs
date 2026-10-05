import Link from "next/link";

import { getSession } from "@/lib/auth";
import { isHtmlTrusted } from "@/lib/htmlTrust";

import { ResearchForm } from "../../../admin/research/ResearchForm";
import { createDosenResearchAction, updateDosenResearchAction } from "../../actions";

export default async function DosenResearchNewPage() {
  const htmlAllowed = await isHtmlTrusted((await getSession())?.sub);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/dosen/research" style={{ color: "#5b6664", fontWeight: 500 }}>
          My research
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>New research</span>
      </div>
      <ResearchForm mode="create" createAction={createDosenResearchAction} updateAction={updateDosenResearchAction} forReview htmlAllowed={htmlAllowed} />
    </div>
  );
}
