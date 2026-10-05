import Link from "next/link";

import { MinimalSiteHeader } from "@/components/MinimalSiteHeader";

export const metadata = { title: "Page not found · AILO" };

export default function NotFound() {
  return (
    <>
      <MinimalSiteHeader />
      <main className="wrap" style={{ paddingTop: 96, paddingBottom: 96, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", color: "#b4530f" }}>404</span>
        <h1 style={{ margin: 0, fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.02em" }}>We couldn&apos;t find that page</h1>
        <p style={{ margin: 0, maxWidth: 480, fontSize: 17, lineHeight: 1.6, color: "#4e5957" }}>
          The link may be old or the page may have moved. Head back to the homepage and try again.
        </p>
        <Link href="/" className="btn" style={{ marginTop: 12 }}>
          Back to homepage
        </Link>
      </main>
    </>
  );
}
