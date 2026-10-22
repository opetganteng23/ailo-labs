/** A team profile can belong to several categories (e.g. Dosen and Peneliti). `category` stays as the first one for older data and sorting. */
export function categoriesOf(item: { category?: string; categories?: string[] }): string[] {
  const list = (item.categories ?? []).filter(Boolean);
  return list.length > 0 ? list : item.category ? [item.category] : [];
}

/** Reads every checked category from a form, without duplicates. */
export function readCategories(formData: FormData, field = "categories"): string[] {
  return Array.from(new Set(formData.getAll(field).map((v) => String(v).trim()).filter(Boolean)));
}

/** Reads categories from a form: repeated checkboxes and/or one comma-separated field, without duplicates (at most 8). */
export function readCategoryList(formData: FormData, field = "categories"): string[] {
  const raw = formData.getAll(field).flatMap((v) => String(v).split(","));
  return Array.from(new Set(raw.map((v) => v.trim().replace(/\s+/g, " ").slice(0, 40)).filter(Boolean))).slice(0, 8);
}

/**
 * Sorts team profiles by seniority: their most senior category first, per the admin-managed
 * category order (Admin > Team > Categories), then `displayOrder`, then name. Someone in
 * several categories is ranked by whichever of theirs sits highest - e.g. a Dosen who is
 * also Peneliti shows with the other Dosen, not buried under Peneliti. A category the admin
 * list doesn't know about (shouldn't normally happen) sorts last, not first.
 */
export function sortTeamByRank<T extends { category?: string; categories?: string[]; displayOrder?: number; name: string }>(
  items: T[],
  orderedCategories: string[],
): T[] {
  const rank = new Map(orderedCategories.map((c, i) => [c, i]));
  const rankOf = (item: T) => {
    const cats = categoriesOf(item);
    if (cats.length === 0) return orderedCategories.length;
    return Math.min(...cats.map((c) => rank.get(c) ?? orderedCategories.length));
  };
  return [...items].sort((a, b) => rankOf(a) - rankOf(b) || (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name));
}
