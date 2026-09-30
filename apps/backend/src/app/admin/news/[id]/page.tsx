import Link from "next/link";
import { notFound } from "next/navigation";

import { connectToDatabase } from "@/lib/mongodb";
import { listNewsCategories } from "@/lib/newsCategories";
import { News } from "@/models/News";

import { NewsForm } from "../NewsForm";

export const dynamic = "force-dynamic";

export default async function AdminNewsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const categories = await listNewsCategories();
  const item = await News.findById(id).lean<{
    _id: string;
    title: string;
    category: string;
    summary: string;
    content: string;
    status: string;
    tags?: string[];
    images?: string[];
    source5W1H?: { what?: string; who?: string; when?: string; where?: string; why?: string; how?: string };
    publishedAt?: Date;
    publishedAtManual?: boolean;
  }>();
  if (!item) notFound();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/news" style={{ color: "#5b6664", fontWeight: 500 }}>
          News
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>{item.title}</span>
      </div>
      <NewsForm
        mode="edit"
        categories={categories}
        initial={{
          _id: String(item._id),
          title: item.title,
          category: item.category,
          summary: item.summary,
          content: item.content,
          status: item.status,
          tags: item.tags,
          images: item.images,
          source5W1H: item.source5W1H,
          publishedAt: item.publishedAt ? item.publishedAt.toISOString() : undefined,
          publishedAtManual: item.publishedAtManual,
        }}
      />
    </div>
  );
}
