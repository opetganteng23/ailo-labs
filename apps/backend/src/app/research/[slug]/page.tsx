import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Research } from "@/models/Research";

export const dynamic = "force-dynamic";

export default async function ResearchDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const item = await Research.findOne({ slug, status: "published" }).lean<{
    title: string;
    description: string;
    content: string;
    image?: string;
  }>();

  if (!item) notFound();

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <h1>{item.title}</h1>
        <p style={{ color: "#5b6469" }}>{item.description}</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed */}
        {item.image && <img className="detail-thumb" src={item.image} alt={item.title} />}
        <div className="rte-body" style={{ marginTop: 24, padding: 0 }} dangerouslySetInnerHTML={{ __html: item.content }} />
      </main>
      <SiteFooter />
    </>
  );
}
