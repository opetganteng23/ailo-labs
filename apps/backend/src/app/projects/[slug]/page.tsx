import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/models/Project";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const item = await Project.findOne({ slug }).lean<{
    title: string;
    description: string;
    content: string;
    status: string;
    images?: string[];
  }>();

  if (!item) notFound();

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <span className="badge">{item.status}</span>
        <h1>{item.title}</h1>
        <p style={{ color: "#5b6469" }}>{item.description}</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed */}
        {item.images?.[0] && <img className="detail-thumb" src={item.images[0]} alt={item.title} />}
        <div className="rte-body" style={{ marginTop: 24, padding: 0 }} dangerouslySetInnerHTML={{ __html: item.content }} />
      </main>
      <SiteFooter />
    </>
  );
}
