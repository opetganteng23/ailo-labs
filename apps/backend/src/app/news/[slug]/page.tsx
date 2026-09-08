import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { News } from "@/models/News";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const item = await News.findOne({ slug, status: "published" }).lean<{
    title: string;
    summary: string;
    content: string;
    category: string;
  }>();

  if (!item) notFound();

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <span className="badge">{item.category}</span>
        <h1>{item.title}</h1>
        <p style={{ color: "#5b6469" }}>{item.summary}</p>
        <div style={{ whiteSpace: "pre-wrap", marginTop: 24 }}>{item.content}</div>
      </main>
      <SiteFooter />
    </>
  );
}
