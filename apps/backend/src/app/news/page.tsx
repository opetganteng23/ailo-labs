import Link from "next/link";
import { CategoryFilter } from "@/components/CategoryFilter";
import { categoriesOf } from "@/lib/teamCats";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { News } from "@/models/News";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

type NewsItem = { _id: string; title: string; slug: string; summary: string; category: string; categories?: string[]; publishedAt?: string; images?: string[] };

export default async function NewsListPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  await connectToDatabase();
  const items = (await News.find({ status: "published" })
    .sort({ publishedAt: -1 })
    .select("-content -source5W1H")
    .lean()) as unknown as NewsItem[];

  const allCategories = Array.from(new Set(items.flatMap((i) => categoriesOf(i)))).sort((a, b) => a.localeCompare(b));
  const shown = category ? items.filter((i) => categoriesOf(i).includes(category)) : items;

  return (
    <>
      <SiteHeader />
      <main className="wrap page-head">
        <div className="sec-head">
          <div>
            <span className="kicker-sm">NEWS</span>
            <h1>Latest from the lab</h1>
          </div>
          <div className="sec-desc">
            <p>Research updates, publications, and lab announcements.</p>
          </div>
        </div>

        {items.length === 0 && <EmptyState variant="public" title="No news yet" message="Fresh updates from the lab will appear here." actionHref="/" actionLabel="Back to homepage" />}

        <CategoryFilter basePath="/news" categories={allCategories} active={category} />

        <div className="news-grid">
          {shown.map((item) => (
            <Link key={item._id} href={`/news/${item.slug}`} className="ncard">
              <div className="nthumb" style={item.images?.[0] ? { backgroundImage: `url(${item.images[0]})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                <span className="tag">{categoriesOf(item).join(" · ")}</span>
              </div>
              <div className="nbody">
                {item.publishedAt && <span className="date">{new Date(item.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>}
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <span className="read">Read article</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
