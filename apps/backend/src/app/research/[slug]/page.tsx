import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Research } from "@/models/Research";
import { renderRichText } from "@/lib/sanitizeHtml";

export const dynamic = "force-dynamic";

export default async function ResearchDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const item = await Research.findOne({ slug, status: "published" }).lean<{
    title: string;
    description: string;
    content: string;
    image?: string;
    publishedAt?: Date;
    createdAt?: Date;
  }>();

  if (!item) notFound();

  return (
    <>
      <SiteHeader backHref="/research" />
      <main className="wrap page-head" style={{ maxWidth: 820 }}>
        <Link href="/research" className="sec-link" style={{ fontSize: 14 }}>
          Research
        </Link>
        <h1 style={{ marginTop: 12 }}>{item.title}</h1>
        {(item.publishedAt ?? item.createdAt) && (
          <p style={{ color: "#6b7573", fontSize: 13.5, fontWeight: 600, margin: "8px 0 0" }}>
            {new Date(item.publishedAt ?? item.createdAt!).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
        <p style={{ color: "#5b6469", fontSize: 17 }}>{item.description}</p>
        {item.image && (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
          <img className="detail-thumb" src={item.image} alt={item.title} style={{ borderRadius: 20 }} />
        )}
        <div className="rte-body" style={{ marginTop: 24, padding: 0 }} dangerouslySetInnerHTML={{ __html: renderRichText(item.content) }} />
      </main>
      <SiteFooter />
    </>
  );
}
