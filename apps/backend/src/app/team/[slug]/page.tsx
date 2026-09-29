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
      <SiteHeader />
      <main className="wrap">
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed */}
        {item.photo && <img className="avatar-thumb" src={item.photo} alt={item.name} style={{ width: 120, height: 120 }} />}
        {item.category && <span className="badge">{item.category}</span>}
        <h1>{item.name}</h1>
        <p style={{ color: "#5b6469" }}>{item.position}</p>
        {(item.jenjang || item.studyProgram) && (
          <p style={{ color: "#5b6469", fontSize: 13.5 }}>
            {[item.jenjang, item.studyProgram].filter(Boolean).join(" - ")}
          </p>
        )}
        {item.bio && <p style={{ marginTop: 16 }}>{item.bio}</p>}
        {item.email && <p>Email: {item.email}</p>}

        {profileEntries.length > 0 && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
            {profileEntries.map(([key, url]) => (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="btn outline">
                {PROFILE_LABELS[key] ?? key}
              </a>
            ))}
          </div>
        )}

        <div className="card" style={{ marginTop: 24, maxWidth: 420 }}>
          <h3>Scopus metrics</h3>
          <p style={{ fontSize: 13, color: "#5b6469" }}>
            Placeholder fields - no live Scopus API call is made yet.
          </p>
          <p>h-index: {item.scopusData?.hIndex ?? "-"}</p>
          <p>Citations: {item.scopusData?.citationCount ?? "-"}</p>
          <p>Documents: {item.scopusData?.documentCount ?? "-"}</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
