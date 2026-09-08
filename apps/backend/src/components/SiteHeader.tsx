import Image from "next/image";
import Link from "next/link";

import { getUserSession } from "@/lib/auth";

import { NavLinks } from "./NavLinks";
import { UserLogoutButton } from "./UserLogoutButton";

export async function SiteHeader() {
  const session = await getUserSession();

  return (
    <header className="site">
      <div className="row">
        <Link href="/" className="brand">
          <Image
            src="/logo-horizontal.png"
            alt="AILO"
            width={120}
            height={30}
            priority
            style={{ height: 30, width: "auto" }}
          />
        </Link>
        <nav>
          <NavLinks />
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {session ? (
            <>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{session.name}</span>
              <UserLogoutButton />
            </>
          ) : (
            <Link href="/login" className="btn outline">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
