"use client";

import Image from "next/image";
import { useState } from "react";

import { hm } from "./util";

const NAV = [
  { href: "#top", label: "Home", active: true },
  { href: "#about", label: "About" },
  { href: "#research", label: "Research" },
  { href: "#projects", label: "Projects" },
  { href: "/services", label: "Services" },
  { href: "#team", label: "Team" },
  { href: "#labs", label: "Labs" },
  { href: "/books", label: "Books" },
  { href: "#news", label: "News" },
];

/** Glass navigation bar over the hero; on phones the menu opens as a dropdown. */
export function HomeHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className={`${hm("site-nav")}${open ? ` ${hm("open")}` : ""}`}>
      <a href="#top" className={hm("brand")}>
        <Image src="/logo-horizontal-white.png" alt="AILO" className={hm("logo")} width={140} height={44} priority />
      </a>
      <nav className={hm("main-nav")}>
        <ul>
          {NAV.map((item) => (
            <li key={item.href}>
              <a href={item.href} className={item.active ? hm("active") : undefined} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <a href="/join" className={hm("btn btn-outline-light")} style={{ height: 40, padding: "0 16px", fontSize: 13.5 }}>
          Join AILO
        </a>
        <a href="/contact" className={hm("btn btn-primary")} style={{ height: 40, padding: "0 16px", fontSize: 13.5 }}>
          Contact us
        </a>
        <button type="button" className={hm("burger")} aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
