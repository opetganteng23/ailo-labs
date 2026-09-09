import Link from "next/link";
import { notFound } from "next/navigation";

import { connectToDatabase } from "@/lib/mongodb";
import { News } from "@/models/News";

import { NewsForm } from "../NewsForm";

export const dynamic = "force-dynamic";

export default async function AdminNewsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const item = await News.findById(id).lean<{
    _id: string;
    title: string;
    category: string;
    summary: string;
    content: string;
    status: string;
    images?: string[];
    source5W1H?: { what?: string; who?: string; when?: string; where?: string; why?: string; how?: string };
  }>();
  if (!item) notFound();

  return (
    <div>
      <p>
        <Link href="/admin/news">News</Link> / {item.title}
      </p>
      <h1>Edit article</h1>
      <NewsForm
        mode="edit"
        initial={{
          _id: String(item._id),
          title: item.title,
          category: item.category,
          summary: item.summary,
          content: item.content,
          status: item.status,
          images: item.images,
          source5W1H: item.source5W1H,
        }}
      />
    </div>
  );
}
