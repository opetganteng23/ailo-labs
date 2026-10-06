import { Member } from "@/models/Member";

/**
 * Generates the next sequential card id for the current year, e.g. AILO-2026-0001.
 *
 * Based on the highest number ever issued this year, not a document count: a
 * count goes down when a member is deleted, which would reissue an id that's
 * still in use by another member and trip the unique index (it did, in
 * production - see TODO.md). The max-based approach never reuses a number
 * regardless of deletions.
 */
export async function generateCardId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `AILO-${year}-`;
  const latest = await Member.find({ cardId: { $regex: `^${prefix}\\d{4}$` } })
    .sort({ cardId: -1 })
    .limit(1)
    .select("cardId")
    .lean<{ cardId: string }[]>();
  const highest = latest.length ? Number(latest[0].cardId.slice(prefix.length)) : 0;
  return `${prefix}${String(highest + 1).padStart(4, "0")}`;
}
