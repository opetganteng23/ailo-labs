import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

import { createUserAction } from "../actions";

export default async function AdminUserNewPage() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    redirect("/admin/dashboard?error=forbidden");
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/users" style={{ color: "#5b6664", fontWeight: 500 }}>
          Users
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>Add user</span>
      </div>

      <section className="admin2-section" style={{ maxWidth: 480 }}>
        <form action={createUserAction} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="admin2-field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" required maxLength={160} />
          </div>
          <div className="admin2-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="admin2-field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required minLength={8} />
          </div>
          <div className="admin2-field">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" defaultValue="admin">
              <option value="admin">Admin</option>
              <option value="staff_lab">Staff (lab)</option>
              <option value="super_admin">Super admin</option>
            </select>
          </div>
          <button type="submit" className="admin2-btn" style={{ justifyContent: "center" }}>
            Create user
          </button>
        </form>
      </section>
    </div>
  );
}
