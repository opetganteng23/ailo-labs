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
    images?: string[];
  }>();

  if (!item) notFound();

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <span className="badge">{item.category}</span>
        <h1>{item.title}</h1>
        <p style={{ color: "#5b6469" }}>{item.summary}</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed */}
        {item.images?.[0] && <img className="detail-thumb" src={item.images[0]} alt={item.title} />}
        <div className="rte-body" style={{ marginTop: 24, padding: 0 }} dangerouslySetInnerHTML={{ __html: item.content }} />
      </main>
      <SiteFooter />
    </>
  );
}
