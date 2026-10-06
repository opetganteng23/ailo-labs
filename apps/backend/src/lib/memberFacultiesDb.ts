import { connectToDatabase } from "@/lib/mongodb";
import { MEMBER_FACULTIES } from "@/lib/memberFaculties";
import { Member } from "@/models/Member";
import { MemberFaculty } from "@/models/MemberFaculty";

/**
 * Managed member faculties in display order. The first call seeds the
 * collection from the official Telkom University list plus any faculty
 * value already stored on a member, so nothing existing loses its faculty.
 */
export async function listMemberFaculties(): Promise<string[]> {
  await connectToDatabase();
  let docs = (await MemberFaculty.find().sort({ order: 1, name: 1 }).lean()) as unknown as { name: string }[];
  if (docs.length === 0) {
    const used = (await Member.distinct("faculty")) as string[];
    const names = Array.from(new Set([...MEMBER_FACULTIES, ...used].filter(Boolean)));
    await MemberFaculty.insertMany(
      names.map((name, order) => ({ name, order })),
      { ordered: false },
    ).catch(() => undefined);
    docs = (await MemberFaculty.find().sort({ order: 1, name: 1 }).lean()) as unknown as { name: string }[];
  }
  return docs.map((d) => d.name);
}
