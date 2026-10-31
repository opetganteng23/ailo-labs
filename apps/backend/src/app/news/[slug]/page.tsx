import Link from "next/link";
import { CategoryChips } from "@/components/CategoryChips";
import { categoriesOf } from "@/lib/teamCats";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ReaderToolbar } from "@/components/ReaderToolbar";
import { ArticleEngagement } from "@/components/ArticleEngagement";
import { connectToDatabase } from "@/lib/mongodb";
import { News } from "@/models/News";
import { RichContent } from "@/components/RichContent";
import { isHtmlDocument, renderRichText } from "@/lib/sanitizeHtml";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const item = await News.findOne({ slug, status: "published" }).lean<{
    title: string;
    summary: string;
    content: string;
    category: string;
    categories?: string[];
    images?: string[];
    reactions?: Record<string, number>;
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
          <CategoryChips categories={categoriesOf(item)} />
        </div>
        <h1 style={{ marginTop: 8 }}>{item.title}</h1>
        <p className="lead-justify">{item.summary}</p>
        {item.images?.[0] && !isHtmlDocument(item.content) && (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
          <img className="detail-thumb" src={item.images[0]} alt={item.title} style={{ borderRadius: 20 }} />
        )}
        <RichContent className="rte-body" style={{ marginTop: 24, padding: 0 }} html={renderRichText(item.content)} />
        <ArticleEngagement kind="news" slug={slug} title={item.title} initialCounts={item.reactions ?? {}} />
      </main>
      <ReaderToolbar title={item.title} />
      <SiteFooter />
    </>
  );
}
