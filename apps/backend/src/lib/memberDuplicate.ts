import { Member } from "@/models/Member";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Lower-case, no punctuation, single spaces: "Dr. Rizky  Fadhillah, S.Kom." -> "dr rizky fadhillah skom". */
export function normalizeName(name: string) {
  return name.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
}

/**
 * Finds an existing (non-rejected) member with the same email or the same name.
 * Rejected applications don't count, so those people can apply again.
 */
export async function findDuplicateMember(name: string, email: string) {
  const byEmail = await Member.findOne({
    email: { $regex: `^${escapeRegex(email.trim())}$`, $options: "i" },
    status: { $ne: "rejected" },
  }).lean<{ status: string }>();
  if (byEmail) return { field: "email" as const, status: byEmail.status };

  const wanted = normalizeName(name);
  if (!wanted) return null;
  // Names are compared after normalising, so check candidates sharing the first word.
  const first = wanted.split(" ")[0];
  const candidates = await Member.find({ name: { $regex: escapeRegex(first), $options: "i" }, status: { $ne: "rejected" } })
    .select("name status")
    .lean<{ name: string; status: string }[]>();
  const hit = candidates.find((c) => normalizeName(c.name) === wanted);
  return hit ? { field: "name" as const, status: hit.status } : null;
}

export function duplicateMessage(dup: { status: string }) {
  return dup.status === "pending"
    ? "Anda sudah mendaftar sebagai member. Pendaftaran Anda sedang ditinjau - kami akan mengabari lewat email."
    : "Anda sudah menjadi member.";
}
