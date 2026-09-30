import Link from "next/link";
import { notFound } from "next/navigation";

import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/models/Project";

import { ProjectForm } from "../../../admin/projects/ProjectForm";
import { createDosenProjectAction, updateDosenProjectAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function DosenProjectEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await getSession())!;
  await connectToDatabase();
  const item = await Project.findOne({ _id: id, owner: session.sub }).lean<{
    _id: string;
    title: string;
    description: string;
    content: string;
    status: string;
    images?: string[];
    publishStatus: "review" | "published";
  }>();
  // Only the owner can open it, and only while it's not yet published (locked after that).
  if (!item || item.publishStatus === "published") notFound();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/dosen/projects" style={{ color: "#5b6664", fontWeight: 500 }}>
          My projects
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>{item.title}</span>
      </div>
      <ProjectForm
        mode="edit"
        createAction={createDosenProjectAction}
        updateAction={updateDosenProjectAction}
        forReview
        initial={{
          _id: String(item._id),
          title: item.title,
          description: item.description,
          content: item.content,
          status: item.status,
          image: item.images?.[0],
        }}
      />
    </div>
  );
}
