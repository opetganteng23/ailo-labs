import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ReaderToolbar } from "@/components/ReaderToolbar";
import { connectToDatabase } from "@/lib/mongodb";
import { Book } from "@/models/catalog";

export const dynamic = "force-dynamic";

/** Reading page for one book: the PDF fills the page, with a way back to the list. */
export default async function BookReaderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const book = await Book.findOne({ slug, status: "published" }).lean<{
    title: string;
    author?: string;
    year?: string;
    description?: string;
    file?: string;
    link?: string;
  }>();
  if (!book) notFound();

  return (
    <>
      <SiteHeader backHref="/books" />
      <main className="wrap page-head" style={{ maxWidth: 1000 }}>
        <Link href="/books" className="sec-link" style={{ fontSize: 14 }}>
          Books
        </Link>
        <h1 style={{ marginTop: 12 }}>{book.title}</h1>
        {(book.author || book.year) && <p style={{ color: "#6b7573", fontSize: 14, fontWeight: 600, margin: "8px 0 0" }}>{[book.author, book.year].filter(Boolean).join(" · ")}</p>}
        {book.description && <p style={{ color: "#5b6469", fontSize: 17 }}>{book.description}</p>}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "20px 0" }}>
          {book.file && (
            <a href={book.file} target="_blank" rel="noopener noreferrer" className="btn outline">
              Open PDF in a new tab
            </a>
          )}
          {book.link && (
            <a href={book.link} target="_blank" rel="noopener noreferrer" className="btn outline">
              Open the book&apos;s website
            </a>
          )}
        </div>

        {book.file ? (
          <iframe src={`${book.file}#view=FitH`} title={book.title} style={{ width: "100%", height: "min(82vh, 900px)", border: "1px solid #e3e1da", borderRadius: 16, background: "#fff" }} />
        ) : (
          !book.link && <p className="notice">This book has no readable file yet.</p>
        )}
      </main>
      <ReaderToolbar title={book.title} />
      <SiteFooter />
    </>
  );
}
