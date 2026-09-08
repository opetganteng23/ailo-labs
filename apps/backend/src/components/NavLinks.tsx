"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/research", label: "Research" },
  { href: "/projects", label: "Projects" },
  { href: "/team", label: "Team" },
  { href: "/labs", label: "Labs" },
  { href: "/news", label: "News" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul>
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
        return (
          <li key={link.href}>
            <Link href={link.href} className={active ? "active" : undefined}>
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
