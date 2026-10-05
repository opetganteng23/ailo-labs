import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Research } from "@/models/Research";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

type ResearchItem = { _id: string; title: string; slug: string; description: string; image?: string; publishedAt?: string; createdAt?: string };

export default async function ResearchListPage() {
  await connectToDatabase();
  const items = (await Research.find({ status: "published" }).sort({ publishedAt: -1, createdAt: -1 }).lean()) as unknown as ResearchItem[];

  return (
    <>
      <SiteHeader />
      <main className="wrap page-head">
        <div className="sec-head">
          <div>
            <span className="kicker-sm">RESEARCH</span>
            <h1>Research areas</h1>
          </div>
          <div className="sec-desc">
            <p>Applied research tracks pursued by AILO, each pairing theory with a deployable system.</p>
          </div>
        </div>

        {items.length === 0 && <EmptyState variant="public" title="No research yet" message="Research topics will appear here once they are published." actionHref="/" actionLabel="Back to homepage" />}

        <div className="research-grid">
          {items.map((item, i) => (
            <Link key={item._id} href={`/research/${item.slug}`} className="rcard">
              <div className="rcard-top">
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3>{item.title}</h3>
              {(item.publishedAt ?? item.createdAt) && (
                <span className="rcard-date">
                  {new Date(item.publishedAt ?? item.createdAt!).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              )}
              <p>{item.description}</p>
              <span className="explore">Explore</span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
