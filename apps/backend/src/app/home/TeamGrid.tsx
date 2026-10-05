"use client";

import { useState } from "react";

import type { TeamCard } from "./data";
import { hm } from "./util";

const SAMPLE: TeamCard[] = [
  { name: "Dr. Andini Prasetyo", position: "Lab Director · Optimization", slug: "", category: "Dosen", hIndex: 14, documentCount: 38, badges: [] },
  { name: "Dr. Rangga Wibisono", position: "NLP Research Lead", slug: "", category: "Peneliti", hIndex: 9, documentCount: 21, badges: [] },
  { name: "Dr. Kirana Salsabila", position: "Computer Vision Lead", slug: "", category: "Peneliti", hIndex: 11, documentCount: 27, badges: [] },
  { name: "Fajar Nugroho, M.T.", position: "Research Engineer", slug: "", category: "Peneliti Mahasiswa", documentCount: 6, badges: [] },
];

/** Short labels for the filter chips; any category an admin adds later uses its own name. */
const SHORT: Record<string, string> = { "Peneliti Alumni": "Alumni", "Honorary Advisory Board": "Advisory Board" };

/** Team preview with client-side category filter chips. */
export function TeamGrid({ items, categories }: { items: TeamCard[]; categories: string[] }) {
  const list = items.length > 0 ? items : SAMPLE;
  const chips = categories.length > 0 ? categories : ["Dosen", "Peneliti", "Peneliti Mahasiswa", "Peneliti Alumni", "Honorary Advisory Board"];
  const [filter, setFilter] = useState("");

  return (
    <>
      <div className={hm("team-filters")} id="teamFilters">
        <button type="button" className={hm(filter === "" ? "team-filter active" : "team-filter")} onClick={() => setFilter("")}>
          All
        </button>
        {chips.map((cat) => (
          <button key={cat} type="button" className={hm(filter === cat ? "team-filter active" : "team-filter")} onClick={() => setFilter(cat)}>
            {SHORT[cat] ?? cat}
          </button>
        ))}
      </div>
      <div className={hm("team-grid")} id="team-grid">
        {list.map((t, i) => {
          const match = !filter || t.category === filter;
          const metrics =
            t.hIndex !== undefined ? `h-index ${t.hIndex}${t.documentCount ? ` · ${t.documentCount} publications` : ""}` : t.documentCount ? `${t.documentCount} publications` : "";
          return (
            <a key={`${t.slug}-${i}`} className={hm(match ? "tcard" : "tcard hidden")} href={t.slug ? `/team/${t.slug}` : "/team"} data-category={t.category ?? ""}>
              <div className={hm("tphoto")} style={t.photo ? { backgroundImage: `url('${t.photo}')`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
              <h4>{t.name}</h4>
              <div className={hm("role")}>{t.position}</div>
              {metrics && <div className={hm("met")}>{metrics}</div>}
              {t.badges.length > 0 && (
                <div className={hm("tbadges")}>
                  {t.badges.map((b) => (
                    <span key={b} className={hm("tbadge")}>
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </a>
          );
        })}
        <a className={hm("tcard tcard-cta")} href="/join">
          <span className={hm("icon")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <h4>Your profile could be here</h4>
          <p>Register as an AILO member and join the network.</p>
        </a>
      </div>
    </>
  );
}
