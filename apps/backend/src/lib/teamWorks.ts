/**
 * "Karya dan Kontribusi" on a team profile: research, products and creations, publications,
 * patents/IP, books and anything else a person wants to list, each with an optional link.
 * Shared by client components (the editor) and server code, so no server-only imports here.
 */
export const WORK_KINDS = [
  { value: "riset", label: "Riset" },
  { value: "produk", label: "Produk dan Ciptaan" },
  { value: "publikasi", label: "Publikasi" },
  { value: "hki", label: "Paten dan HKI" },
  { value: "buku", label: "Buku" },
  { value: "lainnya", label: "Lainnya" },
] as const;

export type WorkKind = (typeof WORK_KINDS)[number]["value"];

export type Work = { kind: WorkKind; title: string; year?: number; url?: string; description?: string };

const KIND_VALUES = new Set<string>(WORK_KINDS.map((k) => k.value));

/** Only a path on this site ("/projects/...") or an http(s) address is ever turned into a link. */
export function safeHref(raw: string | undefined): string {
  const url = (raw ?? "").trim();
  if (!url) return "";
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (/^https?:\/\/\S+$/i.test(url)) return url;
  return "";
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/** Cleans a list of works from untrusted input (form fields): drops empty rows, caps length, validates links. */
export function cleanWorks(rows: { kind?: string; title?: string; year?: string | number; url?: string; description?: string }[]): Work[] {
  const works: Work[] = [];
  for (const row of rows) {
    const title = String(row.title ?? "").trim().slice(0, 200);
    if (!title) continue;
    const year = Number(row.year);
    works.push({
      kind: KIND_VALUES.has(String(row.kind)) ? (row.kind as WorkKind) : "lainnya",
      title,
      year: Number.isInteger(year) && year >= 1950 && year <= 2100 ? year : undefined,
      url: safeHref(row.url) || undefined,
      description: String(row.description ?? "").trim().slice(0, 600) || undefined,
    });
    if (works.length >= 60) break;
  }
  return works;
}

/** Reads the repeated workKind/workTitle/workYear/workUrl/workDescription fields of the editor. */
export function readWorksFromForm(formData: FormData): Work[] {
  const kinds = formData.getAll("workKind");
  const titles = formData.getAll("workTitle");
  const years = formData.getAll("workYear");
  const urls = formData.getAll("workUrl");
  const descriptions = formData.getAll("workDescription");
  return cleanWorks(titles.map((title, i) => ({ kind: String(kinds[i] ?? ""), title: String(title), year: String(years[i] ?? ""), url: String(urls[i] ?? ""), description: String(descriptions[i] ?? "") })));
}
