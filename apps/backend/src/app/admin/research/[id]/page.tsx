import Link from "next/link";
import { notFound } from "next/navigation";

import { connectToDatabase } from "@/lib/mongodb";
import { Research } from "@/models/Research";

import { ResearchForm } from "../ResearchForm";

export const dynamic = "force-dynamic";

export default async function AdminResearchEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const item = await Research.findById(id).lean<{
    _id: string;
    title: string;
    description: string;
    content: string;
    status: string;
    image?: string;
    publishedAt?: Date;
    publishedAtManual?: boolean;
  }>();
  if (!item) notFound();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/research" style={{ color: "#5b6664", fontWeight: 500 }}>
          Research
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>{item.title}</span>
      </div>
      <ResearchForm
        mode="edit"
        initial={{
          _id: String(item._id),
          title: item.title,
          description: item.description,
          content: item.content,
          status: item.status,
          image: item.image,
          publishedAt: item.publishedAt ? item.publishedAt.toISOString() : undefined,
          publishedAtManual: item.publishedAtManual,
        }}
      />
    </div>
  );
}
