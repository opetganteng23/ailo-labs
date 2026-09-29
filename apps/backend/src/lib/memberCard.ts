import { Member } from "@/models/Member";

/** Generates the next sequential card id for the current year, e.g. AILO-2026-0001. */
export async function generateCardId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await Member.countDocuments({ cardId: { $regex: `^AILO-${year}-` } });
  return `AILO-${year}-${String(count + 1).padStart(4, "0")}`;
}
