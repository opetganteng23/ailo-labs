import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { News } from "@/models/News";

export const dynamic = "force-dynamic";

type NewsItem = { _id: string; title: string; slug: string; summary: string; category: string; publishedAt?: string; images?: string[] };

export default async function NewsListPage() {
  await connectToDatabase();
  const items = (await News.find({ status: "published" })
    .sort({ publishedAt: -1 })
    .select("-content -source5W1H")
    .lean()) as unknown as NewsItem[];

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <h1>News</h1>
        <p>Research updates and lab announcements.</p>
        {items.length === 0 && <p className="notice">No published news yet.</p>}
        <div className="grid cols-3" style={{ marginTop: 24 }}>
          {items.map((item) => (
            <Link key={item._id} href={`/news/${item.slug}`} className="card">
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed */}
              {item.images?.[0] && <img className="card-thumb" src={item.images[0]} alt={item.title} />}
              <span className="badge">{item.category}</span>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
