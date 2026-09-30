"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dosen", label: "Overview", icon: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z", exact: true },
  { href: "/dosen/research", label: "My research", icon: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3" },
  { href: "/dosen/projects", label: "My projects", icon: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { href: "/dosen/news", label: "News drafts", icon: "M4 5h13v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM17 9h3v10a2 2 0 0 1-2 2M8 9h5M8 13h5M8 17h3" },
  { href: "/dosen/profile", label: "My profile", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" },
];

export function DosenNav() {
  const pathname = usePathname();
  return (
    <nav>
      <div className="admin-nav-group">
        <span className="admin-nav-group-label">LECTURER</span>
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={active ? "active" : undefined}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="admin-nav-group">
        <span className="admin-nav-group-label">SITE</span>
        <Link href="/" target="_blank">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
          </svg>
          View public site
        </Link>
      </div>
    </nav>
  );
}
