import Link from "next/link";

import { ResearchForm } from "../ResearchForm";

export default function AdminResearchNewPage() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/research" style={{ color: "#5b6664", fontWeight: 500 }}>
          Research
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>New research</span>
      </div>
      <ResearchForm mode="create" />
    </div>
  );
}
