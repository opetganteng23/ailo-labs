import Link from "next/link";
import { notFound } from "next/navigation";

import { getSession } from "@/lib/auth";
import { isHtmlTrusted } from "@/lib/htmlTrust";
import { connectToDatabase } from "@/lib/mongodb";
import { Research } from "@/models/Research";

import { ResearchForm } from "../../../admin/research/ResearchForm";
import { createDosenResearchAction, updateDosenResearchAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function DosenResearchEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await getSession())!;
  const htmlAllowed = await isHtmlTrusted(session.sub);
  await connectToDatabase();
  const item = await Research.findOne({ _id: id, owner: session.sub }).lean<{
    _id: string;
    title: string;
    description: string;
    content: string;
    status: string;
    image?: string;
  }>();
  // Only the owner can open it, and only while it's not yet published (locked after that).
  if (!item || item.status === "published") notFound();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/dosen/research" style={{ color: "#5b6664", fontWeight: 500 }}>
          My research
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>{item.title}</span>
      </div>
      <ResearchForm
        mode="edit"
        createAction={createDosenResearchAction}
        updateAction={updateDosenResearchAction}
        forReview htmlAllowed={htmlAllowed}
        initial={{
          _id: String(item._id),
          title: item.title,
          description: item.description,
          content: item.content,
          status: item.status,
          image: item.image,
        }}
      />
    </div>
  );
}
