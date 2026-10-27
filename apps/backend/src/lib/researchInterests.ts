import { connectToDatabase } from "@/lib/mongodb";
import { RESEARCH_INTEREST_OPTIONS } from "@/lib/researchInterestOptions";
import { Team } from "@/models/Team";

/** Starting set of AILO research areas, merged with whatever members already use. */
export const BASE_RESEARCH_INTERESTS = RESEARCH_INTEREST_OPTIONS;

export async function listResearchInterests(): Promise<string[]> {
  await connectToDatabase();
  const used = ((await Team.distinct("researchInterests")) as string[]).filter(Boolean);
  const seen = new Map<string, string>();
  for (const i of [...BASE_RESEARCH_INTERESTS, ...used]) if (!seen.has(i.toLowerCase())) seen.set(i.toLowerCase(), i);
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}
