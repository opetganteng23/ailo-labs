import { categoriesOf } from "@/lib/teamCats";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ReaderToolbar } from "@/components/ReaderToolbar";
import { connectToDatabase } from "@/lib/mongodb";
import { isExternalHref, safeHref, WORK_KINDS, type Work } from "@/lib/teamWorks";
import { Project } from "@/models/Project";
import { Research } from "@/models/Research";
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
    _id: unknown;
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
    works?: Work[];
    researchInterests?: string[];
    scopusData?: { hIndex?: number; citationCount?: number; documentCount?: number };
  }>();

  if (!item) notFound();

  const profileEntries = Object.entries(item.profiles ?? {}).filter(([, url]) => !!url);

  // Projects on this site that list the person as a team member (the link runs from the project side).
  const projects = await Project.find({ teamMembers: item._id, publishStatus: { $nin: ["review", "archived"] } })
    .sort({ publishedAt: -1, createdAt: -1 })
    .select("title slug description status")
    .lean<{ title: string; slug: string; description?: string; status?: string }[]>();
  const research = await Research.find({ relatedTeamMembers: item._id, status: "published" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .select("title slug description")
    .lean<{ title: string; slug: string; description?: string }[]>();
  const works = item.works ?? [];
  const workGroups = WORK_KINDS.map((k) => ({ ...k, items: works.filter((w) => w.kind === k.value) })).filter((g) => g.items.length > 0);
  const hasContributions = workGroups.length > 0 || projects.length > 0 || research.length > 0;
  const hasMetrics = [item.scopusData?.hIndex, item.scopusData?.citationCount, item.scopusData?.documentCount].some((n) => n !== undefined && n !== null);

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

        {(item.researchInterests?.length ?? 0) > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }} aria-label="Minat riset">
            {item.researchInterests!.map((interest) => (
              <span key={interest} className="interest-chip" style={{ cursor: "default" }}>
                {interest}
              </span>
            ))}
          </div>
        )}

        <section className="contrib" aria-label="Karya dan kontribusi">
            <h2 className="contrib-title">Karya dan Kontribusi</h2>
            {!hasContributions && (
              <p className="contrib-empty">Belum ada karya yang dicantumkan di profil ini. Riset, proyek, produk, dan publikasi akan tampil di sini.</p>
            )}
            {research.length > 0 && (
              <div className="contrib-group">
                <h3>Riset AILO</h3>
                <ul>
                  {research.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/research/${r.slug}`} className="contrib-item">
                        <span className="contrib-name">{r.title}</span>
                        {r.description && <span className="contrib-desc">{r.description.length > 160 ? `${r.description.slice(0, 157)}...` : r.description}</span>}
                        <span className="contrib-open">Buka riset</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {projects.length > 0 && (
              <div className="contrib-group">
                <h3>Proyek AILO</h3>
                <ul>
                  {projects.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/projects/${p.slug}`} className="contrib-item">
                        <span className="contrib-name">{p.title}</span>
                        {p.status && <span className="contrib-meta">{p.status}</span>}
                        {p.description && <span className="contrib-desc">{p.description.length > 160 ? `${p.description.slice(0, 157)}...` : p.description}</span>}
                        <span className="contrib-open">Buka proyek</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {workGroups.map((group) => (
              <div key={group.value} className="contrib-group">
                <h3>{group.label}</h3>
                <ul>
                  {group.items.map((w, i) => {
                    const href = safeHref(w.url);
                    const body = (
                      <>
                        <span className="contrib-name">{w.title}</span>
                        {w.year && <span className="contrib-meta">{w.year}</span>}
                        {w.description && <span className="contrib-desc">{w.description}</span>}
                        {href && <span className="contrib-open">{isExternalHref(href) ? "Buka tautan" : "Buka halaman"}</span>}
                      </>
                    );
                    return (
                      <li key={`${w.title}-${i}`}>
                        {!href ? (
                          <div className="contrib-item static">{body}</div>
                        ) : isExternalHref(href) ? (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="contrib-item">
                            {body}
                          </a>
                        ) : (
                          <Link href={href} className="contrib-item">
                            {body}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>

        {hasMetrics && (
          <div className="rcard" style={{ marginTop: 24, maxWidth: 420 }}>
            <h3 style={{ fontSize: 17 }}>Scopus metrics</h3>
            <p style={{ margin: 0 }}>h-index: {item.scopusData?.hIndex ?? "-"}</p>
            <p style={{ margin: 0 }}>Citations: {item.scopusData?.citationCount ?? "-"}</p>
            <p style={{ margin: 0 }}>Documents: {item.scopusData?.documentCount ?? "-"}</p>
          </div>
        )}
      </main>
      <ReaderToolbar title={item.name} />
      <SiteFooter />
    </>
  );
}
