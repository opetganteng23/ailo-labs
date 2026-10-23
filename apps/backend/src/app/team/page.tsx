import { categoriesOf, groupTeamByRank, sortTeamByRank } from "@/lib/teamCats";
import Link from "next/link";

import { ScrollRow } from "@/components/ScrollRow";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { listTeamCategories } from "@/lib/teamCategoriesDb";
import { Team } from "@/models/Team";
import { EmptyState } from "@/components/EmptyState";
import { TeamFilterBar } from "./TeamFilterBar";

export const dynamic = "force-dynamic";

type TeamItem = {
  _id: string;
  name: string;
  slug: string;
  position: string;
  category?: string;
  categories?: string[];
  displayOrder?: number;
  researchInterests?: string[];
  photo?: string;
  scopusData?: { hIndex?: number; documentCount?: number };
  profiles?: { linkedin?: string; orcid?: string; googleScholar?: string; sinta?: string; scopus?: string };
};

export default async function TeamListPage({ searchParams }: { searchParams: Promise<{ category?: string; interest?: string; q?: string }> }) {
  const { category, interest, q } = await searchParams;
  const needle = (q ?? "").trim().toLowerCase();
  await connectToDatabase();
  const categories = await listTeamCategories();
  const all = sortTeamByRank(
    (await Team.find({ isActive: true }).lean()) as unknown as TeamItem[],
    categories,
  );
  const interests = Array.from(new Set(all.flatMap((i) => i.researchInterests ?? []))).sort((a, b) => a.localeCompare(b));
  const items = all
    .filter((i) => !category || categoriesOf(i).includes(category))
    .filter((i) => !interest || (i.researchInterests ?? []).includes(interest))
    .filter((i) => !needle || i.name.toLowerCase().includes(needle));
  // A tab for a category nobody is in is just clutter.
  const usedCategories = categories.filter((c) => all.some((i) => categoriesOf(i).includes(c)));
  const filtered = Boolean(category || interest || needle);

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

        <TeamFilterBar categories={usedCategories} interests={interests} current={{ category, interest, q: needle ? (q ?? "").trim() : undefined }} total={items.length} />

        {items.length === 0 && (
          <EmptyState
            variant="public"
            title={filtered ? "Tidak ada hasil" : "No team members yet"}
            message={filtered ? "Tidak ada orang yang cocok dengan filter ini. Coba hapus salah satu filter di atas." : "Our researchers and lecturers will appear here soon."}
            actionHref={filtered ? "/team" : "/"}
            actionLabel={filtered ? "Lihat semua" : "Back to homepage"}
          />
        )}

        {/* One section per category, most senior first, so lecturers, advisors and students don't blur together.
            Filtering to a category shows just that section. */}
        {(category ? [{ category, items }] : groupTeamByRank(items, categories)).map((group) => (
          <div key={group.category} className="team-section" role="group" aria-labelledby={`team-${group.category}`}>
            <div className="team-section-head">
              <h2 id={`team-${group.category}`}>{group.category}</h2>
              <span className="team-section-count">{group.items.length}</span>
            </div>
            <ScrollRow label={group.category}>
              {group.items.map((item) => {
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
            </ScrollRow>
          </div>
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
