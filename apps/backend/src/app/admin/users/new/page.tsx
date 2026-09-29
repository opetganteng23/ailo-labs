import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import { User } from "@/models/User";

import { UserCreateForm, type MemberOption } from "../UserCreateForm";

export const dynamic = "force-dynamic";

export default async function AdminUserNewPage() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    redirect("/admin/dashboard?error=forbidden");
  }

  await connectToDatabase();
  const [members, users] = await Promise.all([
    Member.find({ status: "approved" }).sort({ name: 1 }).lean<{ _id: unknown; name: string; email: string; photo?: string; approvedAs?: string; requestedAs: string }[]>(),
    User.find().select("email role").lean<{ email: string; role: string }[]>(),
  ]);
  const roleByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u.role]));
  const options: MemberOption[] = members
    // Members who are already admins/staff don't need adding again.
    .filter((m) => {
      const role = roleByEmail.get(m.email.toLowerCase());
      return !role || role === "borrower";
    })
    .map((m) => ({
      _id: String(m._id),
      name: m.name,
      email: m.email,
      photo: m.photo,
      category: m.approvedAs ?? m.requestedAs,
      hasAccount: roleByEmail.has(m.email.toLowerCase()),
    }));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/users" style={{ color: "#5b6664", fontWeight: 500 }}>
          Users
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>Add user</span>
      </div>

      <section className="admin2-section" style={{ maxWidth: 560 }}>
        <UserCreateForm members={options} />
      </section>
    </div>
  );
}
