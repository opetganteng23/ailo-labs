import Link from "next/link";
import { notFound } from "next/navigation";

import { getSession } from "@/lib/auth";
import { isHtmlTrusted } from "@/lib/htmlTrust";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/models/Project";

import { ProjectForm } from "../../../admin/projects/ProjectForm";
import { createDosenProjectAction, updateDosenProjectAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function DosenProjectEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await getSession())!;
  const htmlAllowed = await isHtmlTrusted(session.sub);
  await connectToDatabase();
  const item = await Project.findOne({ _id: id, owner: session.sub }).lean<{
    categories?: string[];
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
        forReview htmlAllowed={htmlAllowed}
        initial={{
          _id: String(item._id),
          title: item.title,
          categories: item.categories,
          description: item.description,
          content: item.content,
          status: item.status,
          image: item.images?.[0],
        }}
      />
    </div>
  );
}
