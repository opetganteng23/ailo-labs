import Link from "next/link";

import { listResearchInterests } from "@/lib/researchInterests";

import { TeamForm } from "../TeamForm";

export const dynamic = "force-dynamic";

export default async function AdminTeamNewPage() {
  const interestSuggestions = await listResearchInterests();
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/team" style={{ color: "#5b6664", fontWeight: 500 }}>
          Team
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>Add member</span>
      </div>
      <TeamForm mode="create" interestSuggestions={interestSuggestions} />
    </div>
  );
}
