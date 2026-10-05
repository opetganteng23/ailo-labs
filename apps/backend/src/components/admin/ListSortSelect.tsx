"use client";

import { useRouter } from "next/navigation";

import { SORT_OPTIONS, type SortKey } from "@/lib/cmsList";

/** Sort dropdown for CMS lists: keeps the other filters in the URL and swaps only `sort`. */
export function ListSortSelect({ basePath, params, value }: { basePath: string; params: Record<string, string | undefined>; value: SortKey }) {
  const router = useRouter();
  return (
    <select
      aria-label="Sort"
      className="admin2-sort"
      value={value}
      onChange={(e) => {
        const q = new URLSearchParams();
        for (const [k, v] of Object.entries({ ...params, sort: e.target.value })) if (v) q.set(k, v);
        router.push(`${basePath}?${q.toString()}`);
      }}
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
