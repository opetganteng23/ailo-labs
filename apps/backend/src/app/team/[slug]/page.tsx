import { categoriesOf } from "@/lib/teamCats";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/models/Team";

export const dynamic = "force-dynamic";

const PROFILE_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  orcid: "ORCID",
  googleScholar: "Google Scholar",
  sinta: "SINTA",
  scopus: "Scopus",
};

export default async function TeamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const item = await Team.findOne({ slug, isActive: true }).lean<{
    name: string;
    position: string;
    category?: string;
    categories?: string[];
    jenjang?: string;
    studyProgram?: string;
    bio?: string;
    email?: string;
    photo?: string;
    profiles?: Record<string, string | undefined>;
    scopusData?: { hIndex?: number; citationCount?: number; documentCount?: number };
  }>();

  if (!item) notFound();

  const profileEntries = Object.entries(item.profiles ?? {}).filter(([, url]) => !!url);

  return (
    <>
      <SiteHeader backHref="/team" />
      <main className="wrap page-head" style={{ maxWidth: 820 }}>
        <Link href="/team" className="sec-link" style={{ fontSize: 14 }}>
          Team
        </Link>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginTop: 20, flexWrap: "wrap" }}>
          <div style={{ width: 140, aspectRatio: "3/3.6", borderRadius: 18, background: "var(--paper-dim)", border: "1px solid var(--line)", overflow: "hidden", flexShrink: 0 }}>
            {item.photo && (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
              <img src={item.photo} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </div>
          <div style={{ flex: "1 1 300px" }}>
            {categoriesOf(item).length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {categoriesOf(item).map((cat) => (
                  <span key={cat} style={{ fontSize: 12, fontWeight: 700, color: "var(--teal-dark)", background: "var(--paper-dim)", borderRadius: 999, padding: "4px 10px" }}>
                    {cat}
                  </span>
                ))}
              </div>
            )}
            <h1 style={{ margin: 0 }}>{item.name}</h1>
            <p style={{ color: "var(--teal-dark)", fontWeight: 600, marginTop: 4 }}>{item.position}</p>
            {(item.jenjang || item.studyProgram) && <p style={{ color: "#5b6469", fontSize: 13.5 }}>{[item.jenjang, item.studyProgram].filter(Boolean).join(" - ")}</p>}
            {item.email && (
              <p style={{ fontSize: 14 }}>
                <a href={`mailto:${item.email}`} style={{ color: "var(--teal-dark)", fontWeight: 600 }}>
                  {item.email}
                </a>
              </p>
            )}
            {profileEntries.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                {profileEntries.map(([key, url]) => (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="tbadge">
                    {PROFILE_LABELS[key] ?? key}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {item.bio && <p style={{ marginTop: 28, fontSize: 16, lineHeight: 1.6, color: "#3a4348" }}>{item.bio}</p>}

        <div className="rcard" style={{ marginTop: 24, maxWidth: 420 }}>
          <h3 style={{ fontSize: 17 }}>Scopus metrics</h3>
          <p style={{ fontSize: 13, color: "#5b6469", margin: 0 }}>Placeholder fields - no live Scopus API call is made yet.</p>
          <p style={{ margin: 0 }}>h-index: {item.scopusData?.hIndex ?? "-"}</p>
          <p style={{ margin: 0 }}>Citations: {item.scopusData?.citationCount ?? "-"}</p>
          <p style={{ margin: 0 }}>Documents: {item.scopusData?.documentCount ?? "-"}</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
