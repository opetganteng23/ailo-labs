"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Shared shell for the admin and lecturer consoles. On phones the sidebar
 * becomes a slide-in drawer opened from a top bar, instead of stacking above
 * the page content.
 */
export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  // Remember which page the drawer was opened on, so navigating anywhere closes it without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const value = typeof next === "function" ? next(open) : next;
    setOpenedOn(value ? pathname : null);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenedOn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="admin-shell" data-nav-open={open}>
      <header className="admin-topbar">
        <button type="button" className="admin-topbar-menu" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
        <span className="admin-topbar-title">{title}</span>
      </header>
      <div className="admin-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
      {children}
    </div>
  );
}
