import Link from "next/link";

import { EmptyState } from "@/components/EmptyState";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Book } from "@/models/catalog";

export const dynamic = "force-dynamic";

export const metadata = { title: "Books · AILO" };

type BookItem = { _id: string; title: string; slug: string; description?: string; image?: string; link?: string; file?: string; author?: string; year?: string };

export default async function BooksPage() {
  await connectToDatabase();
  const items = (await Book.find({ status: "published" }).sort({ order: 1, title: 1 }).lean()) as unknown as BookItem[];

  return (
    <>
      <SiteHeader />
      <main className="wrap page-head">
        <div className="sec-head">
          <div>
            <span className="kicker-sm">BOOKS</span>
            <h1>Books &amp; publications</h1>
          </div>
          <div className="sec-desc">
            <p>Books written and published by the AILO team. Pick one to read it right here.</p>
          </div>
        </div>

        {items.length === 0 && <EmptyState variant="public" title="No books yet" message="Books and publications will appear here soon." actionHref="/" actionLabel="Back to homepage" />}

        <div className="projects-grid">
          {items.map((item) => (
            <div key={String(item._id)} className="pcard">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image
                <img src={item.image} alt={item.title} className="pcard-thumb" style={{ objectFit: "contain", width: "100%", background: "#fff" }} />
              ) : (
                <div className="pcard-thumb" />
              )}
              <div className="pcard-body">
                <h3>{item.title}</h3>
                {(item.author || item.year) && <span className="rcard-date">{[item.author, item.year].filter(Boolean).join(" · ")}</span>}
                {item.description && <p>{item.description}</p>}
                {item.file || item.link ? (
                  <Link href={`/books/${item.slug}`} className="explore" style={{ fontWeight: 700, color: "var(--teal-dark)" }}>
                    {item.file ? "Read this book" : "View this book"}
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
