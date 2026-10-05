import Link from "next/link";

import { connectToDatabase } from "@/lib/mongodb";
import { KnowledgeDoc } from "@/models/KnowledgeDoc";

import { KnowledgeDocForm } from "../KnowledgeDocForm";

export const dynamic = "force-dynamic";

export default async function NewKnowledgeDocPage() {
  await connectToDatabase();
  const sources = ((await KnowledgeDoc.distinct("source")) as string[]).sort();
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/chatbot/documents" style={{ color: "#5b6664", fontWeight: 500 }}>
          Documents
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>New document</span>
      </div>
      <KnowledgeDocForm sources={sources} />
    </div>
  );
}
