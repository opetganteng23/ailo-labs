import Link from "next/link";

import { ProjectForm } from "../ProjectForm";

const STATUSES = ["planned", "ongoing", "completed"] as const;

export default async function AdminProjectNewPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const defaultStatus = STATUSES.includes(status as (typeof STATUSES)[number]) ? status : undefined;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/projects" style={{ color: "#5b6664", fontWeight: 500 }}>
          Projects
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>New project</span>
      </div>
      <ProjectForm mode="create" defaultStatus={defaultStatus} />
    </div>
  );
}
