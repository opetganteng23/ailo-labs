"use client";

import { useEffect, useState } from "react";

import type { BookCard } from "./data";
import { hm } from "./util";

/**
 * Floating "Books" button stacked above the chatbot button. It opens a centred window with the book list;
 * picking a book reads it inside that window (PDF), with a way back to the list or to the full reading page.
 */
export function BooksWidget({ books }: { books: BookCard[] }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<BookCard | null>(null);

  function close() {
    setOpen(false);
    setCurrent(null);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setCurrent(null);
      }
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (books.length === 0) return null;

  return (
    <>
      <button type="button" className={hm("fab fab-books")} aria-label="Open AILO books" aria-expanded={open} onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
          <path d="M5 17a3 3 0 0 1 3-3h10" />
        </svg>
      </button>

      {open && (
        <div className={hm("books-overlay")} onClick={close} role="presentation">
          <div className={hm("books-modal")} role="dialog" aria-modal="true" aria-label="AILO books" onClick={(e) => e.stopPropagation()}>
            <header className={hm("books-head")}>
              {current ? (
                <button type="button" className={hm("books-back")} onClick={() => setCurrent(null)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                  All books
                </button>
              ) : (
                <h2>Books &amp; publications</h2>
              )}
              {current && <span className={hm("books-title")}>{current.title}</span>}
              <button type="button" className={hm("books-close")} aria-label="Close" onClick={close}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </header>

            {!current ? (
              <div className={hm("books-list")}>
                {books.map((b) => (
                  <button key={b.slug} type="button" className={hm("books-item")} onClick={() => setCurrent(b)}>
                    <span className={hm("books-cover")} style={b.image ? { backgroundImage: `url('${b.image}')` } : undefined} />
                    <span className={hm("books-meta")}>
                      <b>{b.title}</b>
                      {(b.author || b.year) && <small>{[b.author, b.year].filter(Boolean).join(" · ")}</small>}
                      {b.description && <span>{b.description}</span>}
                      <em>{b.file ? "Read" : b.link ? "Open" : "Details"}</em>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className={hm("books-reader")}>
                <div className={hm("books-actions")}>
                  {current.file && (
                    <a href={current.file} target="_blank" rel="noopener noreferrer">
                      Open PDF in a new tab
                    </a>
                  )}
                  <a href={`/books/${current.slug}`}>Open on its own page</a>
                  {current.link && (
                    <a href={current.link} target="_blank" rel="noopener noreferrer">
                      Book website
                    </a>
                  )}
                </div>
                {current.file ? (
                  <iframe src={`${current.file}#view=FitH`} title={current.title} />
                ) : (
                  <div className={hm("books-empty")}>
                    {current.description && <p>{current.description}</p>}
                    <p>{current.link ? "This book is read on its own website - use the link above." : "This book has no readable file yet."}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
