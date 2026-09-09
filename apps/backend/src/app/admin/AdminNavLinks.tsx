"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/news", label: "News" },
  { href: "/admin/research", label: "Research" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/labs", label: "Labs" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/chatbot", label: "Chatbot" },
];

export function AdminNavLinks({ showUsers }: { showUsers: boolean }) {
  const pathname = usePathname();
  const links = showUsers ? [...LINKS.slice(0, 8), { href: "/admin/users", label: "Users" }, LINKS[8]] : LINKS;

  return (
    <nav>
      {links.map((link) => {
        const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
        return (
          <Link key={link.href} href={link.href} className={active ? "active" : undefined}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
