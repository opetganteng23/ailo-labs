import Image from "next/image";
import type { ReactNode } from "react";

import { getSession } from "@/lib/auth";

import { AdminNavLinks } from "./AdminNavLinks";
import { LogoutButton } from "./LogoutButton";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  // /admin/login renders its own standalone layout (no session yet).
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell">
      <aside>
        <div className="admin-brand">
          <Image src="/logo-horizontal.png" alt="AILO" width={140} height={35} />
        </div>
        <AdminNavLinks showUsers={session.role === "super_admin"} />
        <div style={{ marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 16 }}>
          <p style={{ fontSize: 12, color: "#9aa3a7" }}>
            {session.name} ({session.role})
          </p>
          <LogoutButton />
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
}
