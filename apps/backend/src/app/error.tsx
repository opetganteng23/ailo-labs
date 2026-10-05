"use client";

import Link from "next/link";

/** Friendly fallback for any unexpected error while rendering a page (the real error is only logged). */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 24, textAlign: "center" }}>
      <h1 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800 }}>Something went wrong</h1>
      <p style={{ margin: 0, maxWidth: 460, fontSize: 17, lineHeight: 1.6, color: "#4e5957" }}>
        We couldn&apos;t load this page right now. Please try again in a moment.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <button type="button" className="btn" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn outline">
          Back to homepage
        </Link>
      </div>
    </main>
  );
}
