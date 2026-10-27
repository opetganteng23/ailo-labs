import crypto from "node:crypto";

import { Team } from "@/models/Team";

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

type TeamBoardMember = {
  _id: unknown;
  name: string;
  email: string;
  photo?: string;
  approvedAs?: string;
  requestedAs?: string;
  works?: unknown[];
  studyLevel?: string;
  studyProgram?: string;
  bio?: string;
  referee?: string;
  researchInterests?: string[];
  profiles?: Record<string, string | undefined>;
};

const PROFILE_KEYS = ["linkedin", "orcid", "googleScholar", "sinta", "scopus"] as const;

/** What a member told us when applying, shaped for a new Team profile. */
export function teamFieldsFromMember(member: TeamBoardMember) {
  const profiles: Record<string, string> = {};
  for (const key of PROFILE_KEYS) if (member.profiles?.[key]) profiles[key] = member.profiles[key]!;
  return {
    photo: member.photo,
    works: member.works ?? [],
    jenjang: member.studyLevel || undefined,
    studyProgram: member.studyProgram || undefined,
    bio: member.bio || undefined,
    referee: member.referee || undefined,
    researchInterests: member.researchInterests ?? [],
    profiles,
  };
}

/**
 * Copies the application's details into a Team profile, only where the profile is still empty:
 * a lecturer's or admin's own edits are never overwritten. Returns true when anything changed.
 */
export function seedTeamFromMember(team: Record<string, any>, member: TeamBoardMember): boolean { // eslint-disable-line @typescript-eslint/no-explicit-any
  const from = teamFieldsFromMember(member);
  let changed = false;
  const fill = (key: string, value: unknown) => {
    const empty = team[key] === undefined || team[key] === null || team[key] === "" || (Array.isArray(team[key]) && team[key].length === 0);
    const has = Array.isArray(value) ? value.length > 0 : !!value;
    if (empty && has) {
      team[key] = value;
      changed = true;
    }
  };
  fill("photo", from.photo);
  fill("works", from.works);
  fill("jenjang", from.jenjang);
  fill("studyProgram", from.studyProgram);
  fill("bio", from.bio);
  fill("referee", from.referee);
  fill("researchInterests", from.researchInterests);
  const current = (team.profiles ?? {}) as Record<string, string | undefined>;
  const merged: Record<string, string | undefined> = {};
  for (const key of PROFILE_KEYS) {
    merged[key] = current[key] || from.profiles[key];
    if (!current[key] && from.profiles[key]) changed = true;
  }
  team.profiles = merged;
  return changed;
}

/**
 * The Team category a member goes under. Students are split by study level
 * ("Peneliti Mahasiswa S1/S2/S3") when the admin has those categories; otherwise the plain category is used.
 */
export function teamCategoryFor(approvedAs: string, studyLevel: string | undefined, allowed: string[]): string {
  if (approvedAs === "Peneliti Mahasiswa" && studyLevel) {
    const split = `Peneliti Mahasiswa ${studyLevel}`;
    if (allowed.includes(split)) return split;
  }
  return approvedAs;
}

/**
 * Creates, reactivates or hides a member's public Team profile. Shared by the
 * manual "Include in Team Board" toggle (Admin > Members) and by automatic
 * enrolment on approval, so both paths create/update the same Team document
 * the same way instead of drifting apart.
 */
export async function syncMemberTeamBoard(member: TeamBoardMember, options: { include: boolean; categories: string[] }) {
  let team = await Team.findOne({ member: member._id }).catch(() => null);
  if (!team) team = await Team.findOne({ email: member.email.toLowerCase() });

  if (!options.include) {
    // Leave the profile in place (a lecturer's edits, Scopus data, etc. aren't lost) - just hide it.
    if (team) {
      team.isActive = false;
      await team.save();
    }
    return;
  }

  if (team) {
    team.category = options.categories[0];
    team.categories = options.categories;
    team.isActive = true;
    team.member = member._id;
    // Details given when applying seed an empty profile, but never overwrite what's already there.
    seedTeamFromMember(team, member);
    await team.save();
  } else {
    let slug = slugify(member.name) || "member";
    if (await Team.exists({ slug })) slug = `${slug}-${crypto.randomBytes(2).toString("hex")}`;
    await Team.create({
      name: member.name,
      slug,
      position: member.approvedAs ?? member.requestedAs,
      category: options.categories[0],
      categories: options.categories,
      email: member.email.toLowerCase(),
      member: member._id,
      ...teamFieldsFromMember(member),
      isActive: true,
    });
  }
}
