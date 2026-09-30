import Link from "next/link";
import { notFound } from "next/navigation";

import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { listNewsCategories } from "@/lib/newsCategories";
import { News } from "@/models/News";

import { NewsForm } from "../../../admin/news/NewsForm";
import { createDosenNewsAction, updateDosenNewsAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function DosenNewsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await getSession())!;
  await connectToDatabase();
  const categories = await listNewsCategories();
  const item = await News.findOne({ _id: id, author: session.sub }).lean<{
    _id: string;
    title: string;
    category: string;
    summary: string;
    content: string;
    status: string;
    tags?: string[];
    images?: string[];
    source5W1H?: { what?: string; who?: string; when?: string; where?: string; why?: string; how?: string };
  }>();
  if (!item || item.status === "published") notFound();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/dosen/news" style={{ color: "#5b6664", fontWeight: 500 }}>
          News drafts
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>{item.title}</span>
      </div>
      <NewsForm
        mode="edit"
        categories={categories}
        createAction={createDosenNewsAction}
        updateAction={updateDosenNewsAction}
        forReview
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
        }}
      />
    </div>
  );
}
