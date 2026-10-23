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
};

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
    if (!team.photo && member.photo) team.photo = member.photo;
    // Works listed when applying seed an empty profile, but never overwrite what's already there.
    if ((!team.works || team.works.length === 0) && member.works?.length) team.works = member.works;
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
      photo: member.photo,
      member: member._id,
      works: member.works ?? [],
      isActive: true,
    });
  }
}
