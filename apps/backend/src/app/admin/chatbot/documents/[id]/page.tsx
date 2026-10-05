import Link from "next/link";
import { notFound } from "next/navigation";

import { connectToDatabase } from "@/lib/mongodb";
import { KnowledgeDoc } from "@/models/KnowledgeDoc";

import { KnowledgeDocForm } from "../KnowledgeDocForm";

export const dynamic = "force-dynamic";

export default async function EditKnowledgeDocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const doc = await KnowledgeDoc.findById(id)
    .lean<{ _id: string; title: string; source: string; content: string; status: string }>()
    .catch(() => null);
  if (!doc) notFound();
  const sources = ((await KnowledgeDoc.distinct("source")) as string[]).sort();
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/chatbot/documents" style={{ color: "#5b6664", fontWeight: 500 }}>
          Documents
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>{doc.title}</span>
      </div>
      <KnowledgeDocForm sources={sources} initial={{ _id: String(doc._id), title: doc.title, source: doc.source, content: doc.content, status: doc.status }} />
    </div>
  );
}
