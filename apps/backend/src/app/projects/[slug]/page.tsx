import { notFound } from "next/navigation";

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
  }>();

  if (!item) notFound();

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <span className="badge">{item.status}</span>
        <h1>{item.title}</h1>
        <p style={{ color: "#5b6469" }}>{item.description}</p>
        <div style={{ whiteSpace: "pre-wrap", marginTop: 24 }}>{item.content}</div>
      </main>
    </>
  );
}
