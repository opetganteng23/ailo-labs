import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { sanitizeRichText } from "@/lib/sanitizeHtml";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { planned: "Planned", ongoing: "Ongoing", completed: "Completed" };
const STATUS_CLASS: Record<string, string> = { planned: "status-planned", ongoing: "status-ongoing", completed: "status-completed" };

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const item = await Project.findOne({ slug, publishStatus: { $nin: ["review", "archived"] } }).lean<{
    title: string;
    description: string;
    content: string;
    status: string;
    images?: string[];
    publishedAt?: Date;
    createdAt?: Date;
  }>();

  if (!item) notFound();

  return (
    <>
      <SiteHeader backHref="/projects" />
      <main className="wrap page-head" style={{ maxWidth: 820 }}>
        <Link href="/projects" className="sec-link" style={{ fontSize: 14 }}>
          Projects
        </Link>
        <div style={{ marginTop: 12 }}>
          <span className={`pstatus ${STATUS_CLASS[item.status] ?? "status-planned"}`}>{STATUS_LABEL[item.status] ?? item.status}</span>
        </div>
        <h1 style={{ marginTop: 8 }}>{item.title}</h1>
        {(item.publishedAt ?? item.createdAt) && (
          <p style={{ color: "#6b7573", fontSize: 13.5, fontWeight: 600, margin: "8px 0 0" }}>
            {new Date(item.publishedAt ?? item.createdAt!).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
        <p style={{ color: "#5b6469", fontSize: 17 }}>{item.description}</p>
        {item.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
          <img className="detail-thumb" src={item.images[0]} alt={item.title} style={{ borderRadius: 20 }} />
        )}
        <div className="rte-body" style={{ marginTop: 24, padding: 0 }} dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.content) }} />
      </main>
      <SiteFooter />
    </>
  );
}
