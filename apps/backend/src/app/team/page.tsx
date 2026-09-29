import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { TEAM_CATEGORIES } from "@/models/teamCategories";
import { Team } from "@/models/Team";

export const dynamic = "force-dynamic";

type TeamItem = {
  _id: string;
  name: string;
  slug: string;
  position: string;
  category?: string;
  researchInterests?: string[];
  photo?: string;
  scopusData?: { hIndex?: number; documentCount?: number };
  profiles?: { linkedin?: string; orcid?: string; googleScholar?: string; sinta?: string; scopus?: string };
};

export default async function TeamListPage({ searchParams }: { searchParams: Promise<{ category?: string; interest?: string }> }) {
  const { category, interest } = await searchParams;
  await connectToDatabase();
  const all = (await Team.find({ isActive: true })
    .sort({ category: 1, displayOrder: 1, name: 1 })
    .lean()) as unknown as TeamItem[];
  const interests = Array.from(new Set(all.flatMap((i) => i.researchInterests ?? []))).sort((a, b) => a.localeCompare(b));
  const items = all
    .filter((i) => !category || i.category === category)
    .filter((i) => !interest || (i.researchInterests ?? []).includes(interest));
  const hrefWith = (params: { category?: string; interest?: string }) => {
    const q = new URLSearchParams();
    if (params.category) q.set("category", params.category);
    if (params.interest) q.set("interest", params.interest);
    const s = q.toString();
    return s ? `/team?${s}` : "/team";
  };

  return (
    <>
      <SiteHeader />
      <main className="wrap page-head">
        <div className="sec-head">
          <div>
            <span className="kicker-sm">PEOPLE</span>
            <h1>People behind AILO</h1>
          </div>
          <div className="sec-desc">
            <p>Faculty, researchers, and students across AILO&apos;s research tracks, with publication data pulled from Scopus.</p>
          </div>
        </div>

        <div className="team-filters">
          <Link href={hrefWith({ interest })} className={`team-filter${!category ? " active" : ""}`}>
            All
          </Link>
          {TEAM_CATEGORIES.map((cat) => (
            <Link key={cat} href={hrefWith({ category: cat, interest })} className={`team-filter${category === cat ? " active" : ""}`}>
              {cat}
            </Link>
          ))}
        </div>
        {interests.length > 0 && (
          <div className="team-interest-filters" aria-label="Filter by research interest">
            <span>Research interest</span>
            <Link href={hrefWith({ category })} className={`interest-chip${!interest ? " active" : ""}`}>
              Any
            </Link>
            {interests.map((i) => (
              <Link key={i} href={hrefWith({ category, interest: i })} className={`interest-chip${interest === i ? " active" : ""}`}>
                {i}
              </Link>
            ))}
          </div>
        )}

        {items.length === 0 && <p className="notice">No team members yet.</p>}

        <div className="team-grid">
          {items.map((item) => {
            const badges = [
              item.profiles?.scopus ? "Scopus" : null,
              item.profiles?.googleScholar ? "Scholar" : null,
              item.profiles?.sinta ? "SINTA" : null,
            ].filter(Boolean) as string[];
            return (
              <Link key={item._id} href={`/team/${item.slug}`} className="tcard">
                <div className="tphoto">
                  {item.photo && (
                    // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
                    <img src={item.photo} alt={item.name} />
                  )}
                </div>
                <h4>{item.name}</h4>
                <span className="role">{item.position}</span>
                {(item.researchInterests?.length ?? 0) > 0 && (
                  <div className="tinterests">
                    {item.researchInterests!.slice(0, 3).map((i) => (
                      <span key={i}>{i}</span>
                    ))}
                  </div>
                )}
                {item.scopusData?.hIndex !== undefined && (
                  <span className="met">
                    h-index {item.scopusData.hIndex}
                    {item.scopusData.documentCount ? ` · ${item.scopusData.documentCount} publications` : ""}
                  </span>
                )}
                {badges.length > 0 && (
                  <div className="tbadges">
                    {badges.map((b) => (
                      <span key={b} className="tbadge">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
