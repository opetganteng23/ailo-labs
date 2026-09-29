import Image from "next/image";
import type { ReactNode } from "react";

import { getSession, isAdminRole } from "@/lib/auth";

import { AdminNavLinks } from "./AdminNavLinks";
import { LogoutButton } from "./LogoutButton";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  // Only show the admin shell (sidebar, nav) for an actual admin/staff session.
  // A borrower session is also a valid "session" (shared cookie), so this must
  // check the role, not just whether a session exists - otherwise a logged-in
  // borrower visiting /admin/login would see the admin sidebar around it.
  if (!session || !isAdminRole(session.role)) {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell">
      <aside>
        <div className="admin-brand">
          <Image src="/logo-horizontal.png" alt="AILO" width={140} height={35} />
          <span className="admin-brand-subtitle">Content console</span>
        </div>
        <AdminNavLinks showUsers={session.role === "super_admin"} />
        <div className="admin-account-card">
          <div className="admin-account-avatar">{session.name.charAt(0).toUpperCase()}</div>
          <div className="admin-account-info">
            <span className="admin-account-name">{session.name}</span>
            <span className="admin-account-role">{session.role === "super_admin" ? "Super admin" : session.role}</span>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
}
