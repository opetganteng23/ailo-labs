import Image from "next/image";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Toaster } from "@/components/Toaster";
import { getSession } from "@/lib/auth";

import { LogoutButton } from "../admin/LogoutButton";

import { DosenNav } from "./DosenNav";

export const metadata = { title: "Lecturer dashboard · AILO" };

/** Shell for lecturers (role "dosen"): same look as the admin console, fewer sections. */
export default async function DosenLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "dosen") redirect("/login?next=/dosen");

  return (
    <div className="admin-shell">
      <aside>
        <div className="admin-brand">
          <span className="admin-brand-mark">
            <Image src="/logo-mark-light.png" alt="AILO" width={30} height={30} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
          </span>
          <div className="admin-brand-text">
            <span className="admin-brand-title">AILO Dosen</span>
            <span className="admin-brand-subtitle">Lecturer dashboard</span>
          </div>
        </div>
        <DosenNav />
        <div className="admin-account-card">
          <div className="admin-account-avatar">{session.name.charAt(0).toUpperCase()}</div>
          <div className="admin-account-info">
            <span className="admin-account-name">{session.name}</span>
            <span className="admin-account-role">Dosen</span>
          </div>
          <LogoutButton redirectTo="/login" />
        </div>
      </aside>
      <main>{children}</main>
      <Toaster />
    </div>
  );
}
