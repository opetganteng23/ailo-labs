import { connectToDatabase } from "@/lib/mongodb";
import { News } from "@/models/News";
import { DEFAULT_NEWS_CATEGORIES, NewsCategory } from "@/models/NewsCategory";

/**
 * Managed news categories, alphabetical. The first call seeds the collection
 * from the defaults plus any category already used by an article, so existing
 * news keeps a valid category.
 */
export async function listNewsCategories(): Promise<string[]> {
  await connectToDatabase();
  let docs = (await NewsCategory.find().sort({ name: 1 }).lean()) as unknown as { name: string }[];
  if (docs.length === 0) {
    const used = (await News.distinct("category")) as string[];
    const names = Array.from(new Set([...DEFAULT_NEWS_CATEGORIES, ...used.filter(Boolean)]));
    await NewsCategory.insertMany(
      names.map((name) => ({ name })),
      { ordered: false },
    ).catch(() => undefined);
    docs = (await NewsCategory.find().sort({ name: 1 }).lean()) as unknown as { name: string }[];
  }
  return docs.map((d) => d.name);
}
