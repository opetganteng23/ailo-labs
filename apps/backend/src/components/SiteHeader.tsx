import Image from "next/image";
import Link from "next/link";

import { getSession } from "@/lib/auth";

import { NavLinks } from "./NavLinks";
import { UserLogoutButton } from "./UserLogoutButton";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="site">
      <div className="row">
        <Link href="/" className="brand">
          <Image
            src="/logo-horizontal.png"
            alt="AILO"
            width={200}
            height={50}
            priority
            style={{ height: 48, width: "auto" }}
          />
        </Link>
        <input type="checkbox" id="nav-toggle" className="nav-toggle-checkbox" />
        <label htmlFor="nav-toggle" className="nav-toggle-btn" aria-label="Toggle menu">
          <span />
          <span />
          <span />
        </label>
        <div className="header-nav-menu">
          <nav>
            <NavLinks />
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/join" className="btn-outline-dark" style={{ height: 40, padding: "0 16px", fontSize: 13.5 }}>
              Join AILO
            </Link>
            {session ? (
              <>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{session.name}</span>
                <UserLogoutButton />
              </>
            ) : (
              <Link href="/login" className="btn-primary" style={{ height: 40, padding: "0 16px", fontSize: 13.5 }}>
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
