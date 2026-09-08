import type { ReactNode } from "react";

import { getSession } from "@/lib/auth";

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
        <p style={{ fontWeight: 700, marginBottom: 24 }}>AILO Admin</p>
        <a href="/admin/dashboard">Dashboard</a>
        <a href="/admin/news">News</a>
        <a href="/admin/research">Research</a>
        <a href="/admin/projects">Projects</a>
        <a href="/admin/team">Team</a>
        <a href="/admin/labs">Labs</a>
        <a href="/admin/bookings">Bookings</a>
        <a href="/admin/settings">Settings</a>
        {session.role === "super_admin" && <a href="/admin/users">Users</a>}
        <a href="/admin/chatbot">Chatbot</a>
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
