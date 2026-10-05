import { connectToDatabase } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import { Team } from "@/models/Team";
import { TEAM_CATEGORIES } from "@/models/teamCategories";
import { TeamCategory } from "@/models/TeamCategory";

/**
 * Managed team categories in display order. The first call seeds the
 * collection from the original fixed list plus any category already used by a
 * team profile or member, so nothing existing loses its category.
 */
export async function listTeamCategories(): Promise<string[]> {
  await connectToDatabase();
  let docs = (await TeamCategory.find().sort({ order: 1, name: 1 }).lean()) as unknown as { name: string }[];
  if (docs.length === 0) {
    const usedTeam = (await Team.distinct("category")) as string[];
    const usedMulti = (await Team.distinct("categories")) as string[];
    const usedMembers = (await Member.distinct("teamCategory")) as string[];
    const names = Array.from(new Set([...TEAM_CATEGORIES, ...usedTeam, ...usedMulti, ...usedMembers].filter(Boolean)));
    await TeamCategory.insertMany(
      names.map((name, order) => ({ name, order })),
      { ordered: false },
    ).catch(() => undefined);
    docs = (await TeamCategory.find().sort({ order: 1, name: 1 }).lean()) as unknown as { name: string }[];
  }
  return docs.map((d) => d.name);
}
