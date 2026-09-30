import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { News } from "@/models/News";
import { sanitizeRichText } from "@/lib/sanitizeHtml";

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
      <SiteHeader backHref="/news" />
      <main className="wrap page-head" style={{ maxWidth: 820 }}>
        <Link href="/news" className="sec-link" style={{ fontSize: 14 }}>
          News
        </Link>
        <div style={{ marginTop: 12 }}>
          <span
            style={{
              background: "var(--orange)",
              color: "#1e1206",
              fontSize: 12,
              fontWeight: 700,
              padding: "5px 12px",
              borderRadius: 999,
            }}
          >
            {item.category}
          </span>
        </div>
        <h1 style={{ marginTop: 8 }}>{item.title}</h1>
        <p style={{ color: "#5b6469", fontSize: 17 }}>{item.summary}</p>
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
