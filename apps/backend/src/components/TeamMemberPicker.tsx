"use client";

import { useEffect, useState } from "react";

type Person = { id: string; name: string };

/**
 * Pick the people who worked on a research item or project. Emits one hidden `teamMember` input per
 * pick (read by lib/teamMembers.ts), so it works inside any server-action form. These picks are what
 * fill "Riset AILO" and "Proyek AILO" on each person's public profile.
 */
export function TeamMemberPicker({ defaultValue = [] }: { defaultValue?: string[] }) {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/team/options")
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return;
        if (json?.success) setPeople(json.data);
        else setFailed(true);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const byId = new Map((people ?? []).map((p) => [p.id, p]));
  const filtered = (people ?? []).filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="member-picker">
      {selected.map((id) => (
        <input key={id} type="hidden" name="teamMember" value={id} />
      ))}
      {selected.length > 0 && (
        <div className="member-picker-chips">
          {selected.map((id) => (
            <button key={id} type="button" className="member-picker-chip" onClick={() => toggle(id)} aria-label={`Hapus ${byId.get(id)?.name ?? "anggota"}`}>
              {byId.get(id)?.name ?? "Anggota"}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
      {failed && <p className="member-picker-note">Daftar anggota gagal dimuat. Muat ulang halaman ini.</p>}
      {!failed && people === null && <p className="member-picker-note">Memuat daftar anggota...</p>}
      {people && people.length > 0 && (
        <>
          <input type="search" className="member-picker-search" placeholder="Cari nama anggota" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Cari anggota tim" />
          <div className="member-picker-list" role="group" aria-label="Anggota tim">
            {filtered.map((p) => (
              <label key={p.id} className="member-picker-row">
                <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                {p.name}
              </label>
            ))}
            {filtered.length === 0 && <p className="member-picker-note">Tidak ada nama yang cocok.</p>}
          </div>
        </>
      )}
    </div>
  );
}
