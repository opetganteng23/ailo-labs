import { notFound } from "next/navigation";

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
  }>();

  if (!item) notFound();

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <h1>{item.title}</h1>
        <p style={{ color: "#5b6469" }}>{item.description}</p>
        <div style={{ whiteSpace: "pre-wrap", marginTop: 24 }}>{item.content}</div>
      </main>
    </>
  );
}
