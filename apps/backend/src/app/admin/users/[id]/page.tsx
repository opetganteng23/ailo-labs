import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ImageUploadField } from "@/components/ImageUploadField";
import { PasswordInput } from "@/components/PasswordInput";
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
    photo?: string;
    isActive: boolean;
  }>();
  if (!user) notFound();

  const isSelf = session.sub === String(user._id);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/users" style={{ color: "#5b6664", fontWeight: 500 }}>
          Users
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>{user.name}</span>
      </div>

      <section className="admin2-section" style={{ maxWidth: 560 }}>
        <form action={updateUserAction} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <input type="hidden" name="id" value={user._id} />
          <div className="admin2-field">
            <label htmlFor="name">
              Name<span className="req">*</span>
            </label>
            <input id="name" name="name" required maxLength={160} defaultValue={user.name} />
          </div>
          <div className="admin2-field">
            <label htmlFor="email">
              Email<span className="req">*</span>
            </label>
            <input id="email" name="email" type="email" required defaultValue={user.email} />
          </div>
          <ImageUploadField name="photo" label="Photo" defaultValue={user.photo} hint="Square portrait - PNG, JPG or WEBP" />
          <div className="admin2-field">
            <label htmlFor="password">New password</label>
            <PasswordInput id="password" name="password" minLength={8} autoComplete="new-password" placeholder="Leave blank to keep current password" />
          </div>
          <div className="admin2-field">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" defaultValue={user.role} disabled={isSelf}>
              <option value="admin">Admin</option>
              <option value="staff_lab">Staff (lab)</option>
              <option value="dosen">Dosen (lecturer dashboard)</option>
              <option value="super_admin">Super admin</option>
            </select>
          </div>
          <label style={{ flexDirection: "row", alignItems: "center", gap: 8, display: "flex", fontWeight: 500 }}>
            <input type="checkbox" name="isActive" defaultChecked={user.isActive} disabled={isSelf} style={{ width: "auto" }} />
            Active
          </label>
          {isSelf && <p style={{ fontSize: 13, color: "#6b7573", margin: 0 }}>You cannot change your own role or deactivate your own account.</p>}
          <button type="submit" className="admin2-btn" style={{ justifyContent: "center" }}>
            Save changes
          </button>
        </form>
      </section>
    </div>
  );
}
