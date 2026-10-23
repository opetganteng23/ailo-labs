"use client";

import { useState } from "react";

import { WORK_KINDS, type Work } from "@/lib/teamWorks";

type Row = Work & { id: number };

let nextId = 1;
const blank = (): Row => ({ id: nextId++, kind: "produk", title: "", year: undefined, url: "", description: "" });

/**
 * Repeater for a profile's "Karya dan Kontribusi". Renders plain named inputs
 * (workKind / workTitle / workYear / workUrl / workDescription, one set per row) so it drops into
 * any server-action form; the server validates and cleans them (lib/teamWorks.ts).
 */
export function WorksEditor({ defaultValue = [], onChange }: { defaultValue?: Work[]; onChange?: (works: Work[]) => void }) {
  const [rows, setRows] = useState<Row[]>(() => defaultValue.map((w) => ({ ...w, id: nextId++ })));
  // Forms that keep their own state (the Join form) read the rows through onChange; server-action forms just use the named inputs.
  function commit(next: Row[]) {
    setRows(next);
    onChange?.(next.map((row) => ({ kind: row.kind, title: row.title, year: row.year, url: row.url, description: row.description })));
  }

  function update(id: number, patch: Partial<Work>) {
    commit(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <div className="works-editor">
      {rows.length === 0 && <p style={{ margin: 0, fontSize: 14, color: "#6b7573" }}>Belum ada karya. Tambahkan riset, produk, publikasi, atau ciptaan lainnya.</p>}
      {rows.map((row, index) => (
        <div key={row.id} className="works-row">
          <div className="works-row-top">
            <select name="workKind" value={row.kind} onChange={(e) => update(row.id, { kind: e.target.value as Work["kind"] })} aria-label={`Jenis karya ${index + 1}`}>
              {WORK_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
            <input name="workYear" type="number" min={1950} max={2100} placeholder="Tahun" value={row.year ?? ""} onChange={(e) => update(row.id, { year: e.target.value ? Number(e.target.value) : undefined })} aria-label={`Tahun karya ${index + 1}`} />
            <button type="button" className="works-remove" onClick={() => commit(rows.filter((r) => r.id !== row.id))} aria-label={`Hapus karya ${index + 1}`} title="Hapus">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <input name="workTitle" type="text" maxLength={200} placeholder="Judul atau nama karya" value={row.title} onChange={(e) => update(row.id, { title: e.target.value })} aria-label={`Judul karya ${index + 1}`} />
          <input
            name="workUrl"
            type="text"
            placeholder="Tautan: alamat https://... atau halaman di situs ini, misalnya /projects/nama-proyek"
            value={row.url ?? ""}
            onChange={(e) => update(row.id, { url: e.target.value })}
            aria-label={`Tautan karya ${index + 1}`}
          />
          <textarea name="workDescription" rows={2} maxLength={600} placeholder="Keterangan singkat (opsional)" value={row.description ?? ""} onChange={(e) => update(row.id, { description: e.target.value })} aria-label={`Keterangan karya ${index + 1}`} />
        </div>
      ))}
      <button type="button" className="admin2-btn outline" style={{ alignSelf: "flex-start" }} onClick={() => commit([...rows, blank()])}>
        Tambah karya
      </button>
    </div>
  );
}
