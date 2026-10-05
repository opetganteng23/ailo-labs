export const SORT_OPTIONS = [
  { value: "updated", label: "Recently updated" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A-Z" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export function parseSort(value?: string): SortKey {
  return SORT_OPTIONS.some((o) => o.value === value) ? (value as SortKey) : "updated";
}

/** Same ordering rules for every CMS list (News, Research, Projects). */
export function sortItems<T extends { title: string; updatedAt: string | Date }>(items: T[], sort: SortKey): T[] {
  const copy = [...items];
  if (sort === "title") return copy.sort((a, b) => a.title.localeCompare(b.title));
  const time = (x: T) => new Date(x.updatedAt).getTime();
  return copy.sort((a, b) => (sort === "oldest" ? time(a) - time(b) : time(b) - time(a)));
}

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  review: "In review",
  published: "Published",
  archived: "Archived",
};
