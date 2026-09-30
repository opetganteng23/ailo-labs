import Link from "next/link";

import { ProjectForm } from "../../../admin/projects/ProjectForm";
import { createDosenProjectAction, updateDosenProjectAction } from "../../actions";

export default function DosenProjectNewPage() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/dosen/projects" style={{ color: "#5b6664", fontWeight: 500 }}>
          My projects
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>New project</span>
      </div>
      <ProjectForm mode="create" createAction={createDosenProjectAction} updateAction={updateDosenProjectAction} forReview />
    </div>
  );
}
