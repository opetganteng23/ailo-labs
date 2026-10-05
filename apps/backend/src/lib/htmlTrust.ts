import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

/** Whether a lecturer account may use the editor's HTML mode. Admin roles always can and never go through this check. */
export async function isHtmlTrusted(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  try {
    await connectToDatabase();
    const user = await User.findById(userId).select("role htmlTrusted isActive").lean<{ role: string; htmlTrusted?: boolean; isActive?: boolean }>();
    return Boolean(user && user.role === "dosen" && user.isActive !== false && user.htmlTrusted === true);
  } catch {
    return false;
  }
}
