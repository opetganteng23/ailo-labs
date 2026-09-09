import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

import { updateUserAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminUserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    redirect("/admin/dashboard?error=forbidden");
  }

  const { id } = await params;
  await connectToDatabase();
  const user = await User.findById(id).lean<{
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  }>();
  if (!user) notFound();

  const isSelf = session.sub === String(user._id);

  return (
    <div>
      <p>
        <Link href="/admin/users">Users</Link> / {user.name}
      </p>
      <h1>Edit user</h1>

      <form className="stack" action={updateUserAction} style={{ marginTop: 24, maxWidth: 480 }}>
        <input type="hidden" name="id" value={user._id} />
        <label>
          Name
          <input name="name" required maxLength={160} defaultValue={user.name} />
        </label>
        <label>
          Email
          <input name="email" type="email" required defaultValue={user.email} />
        </label>
        <label>
          New password
          <input name="password" type="password" minLength={8} placeholder="Leave blank to keep current password" />
        </label>
        <label>
          Role
          <select name="role" defaultValue={user.role} disabled={isSelf}>
            <option value="admin">admin</option>
            <option value="staff_lab">staff_lab</option>
            <option value="super_admin">super_admin</option>
          </select>
        </label>
        <label style={{ flexDirection: "row", alignItems: "center", gap: 8, display: "flex" }}>
          <input type="checkbox" name="isActive" defaultChecked={user.isActive} disabled={isSelf} style={{ width: "auto" }} />
          Active
        </label>
        {isSelf && (
          <p style={{ fontSize: 13, color: "#5b6469" }}>
            You cannot change your own role or deactivate your own account.
          </p>
        )}
        <button type="submit" className="btn">
          Save changes
        </button>
      </form>
    </div>
  );
}
