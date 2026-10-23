import { Types } from "mongoose";

import { User } from "@/models/User";

/** Reads the picker's repeated `teamMember` fields: valid ObjectIds only, no duplicates, at most 30. */
export function readTeamMemberIds(formData: FormData): string[] {
  const ids = formData.getAll("teamMember").map((v) => String(v).trim()).filter((v) => Types.ObjectId.isValid(v) && /^[0-9a-f]{24}$/i.test(v));
  return Array.from(new Set(ids)).slice(0, 30);
}

/** A lecturer's own work always shows on their own profile, even if they didn't tick themselves. */
export async function withOwnProfile(ids: string[], userId: unknown): Promise<string[]> {
  const user = await User.findById(userId).select("team").lean<{ team?: unknown }>();
  const own = user?.team ? String(user.team) : "";
  return own && !ids.includes(own) ? [...ids, own] : ids;
}
