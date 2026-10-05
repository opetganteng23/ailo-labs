/** A team profile can belong to several categories (e.g. Dosen and Peneliti). `category` stays as the first one for older data and sorting. */
export function categoriesOf(item: { category?: string; categories?: string[] }): string[] {
  const list = (item.categories ?? []).filter(Boolean);
  return list.length > 0 ? list : item.category ? [item.category] : [];
}

/** Reads every checked category from a form, without duplicates. */
export function readCategories(formData: FormData, field = "categories"): string[] {
  return Array.from(new Set(formData.getAll(field).map((v) => String(v).trim()).filter(Boolean)));
}
