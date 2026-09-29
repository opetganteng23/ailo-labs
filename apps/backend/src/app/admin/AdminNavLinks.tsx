"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS = {
  dashboard: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  news: "M4 5h13v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM17 9h3v10a2 2 0 0 1-2 2M8 9h5M8 13h5M8 17h3",
  research: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3",
  projects: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  team: "M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6",
  labs: "M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 20h8M12 16v4",
  bookings: "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4",
  messages: "M4 5h16v11H8l-4 4z",
  members: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM9 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 16.5a3 3 0 0 1 6 0M14 10h4M14 14h3",
  chatbot: "M8 8h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3zM12 4v4M9.5 13.5h.01M14.5 13.5h.01",
  users: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
} as const;

type IconKey = keyof typeof ICONS;
type NavItem = { key: IconKey; href: string; label: string; badge?: number };

function buildGroups(pendingMembersCount: number): { label: string; items: NavItem[] }[] {
  return [
    { label: "OVERVIEW", items: [{ key: "dashboard", href: "/admin/dashboard", label: "Dashboard" }] },
    {
      label: "CONTENT",
      items: [
        { key: "news", href: "/admin/news", label: "News" },
        { key: "research", href: "/admin/research", label: "Research" },
        { key: "projects", href: "/admin/projects", label: "Projects" },
        { key: "team", href: "/admin/team", label: "Team" },
        { key: "labs", href: "/admin/labs", label: "Labs" },
      ],
    },
    {
      label: "OPERATIONS",
      items: [
        { key: "members", href: "/admin/members", label: "Members", badge: pendingMembersCount || undefined },
        { key: "bookings", href: "/admin/bookings", label: "Bookings" },
        { key: "messages", href: "/admin/messages", label: "Messages" },
        { key: "chatbot", href: "/admin/chatbot", label: "Chatbot" },
      ],
    },
  ];
}

const SYSTEM_GROUP_LABEL = "SYSTEM";

export function AdminNavLinks({ showUsers, pendingMembersCount = 0 }: { showUsers: boolean; pendingMembersCount?: number }) {
  const pathname = usePathname();
  const groups = buildGroups(pendingMembersCount);

  function isActive(href: string) {
    return pathname === href || pathname?.startsWith(`${href}/`);
  }

  function renderItem(item: NavItem) {
    const active = isActive(item.href);
    return (
      <Link key={item.href} href={item.href} className={active ? "active" : undefined}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={ICONS[item.key]} />
        </svg>
        {item.label}
        {!!item.badge && <span className="admin-nav-badge">{item.badge}</span>}
      </Link>
    );
  }

  return (
    <nav>
      {groups.map((group) => (
        <div key={group.label} className="admin-nav-group">
          <span className="admin-nav-group-label">{group.label}</span>
          {group.items.map(renderItem)}
        </div>
      ))}
      <div className="admin-nav-group">
        <span className="admin-nav-group-label">{SYSTEM_GROUP_LABEL}</span>
        {showUsers && renderItem({ key: "users", href: "/admin/users", label: "Users" })}
        {renderItem({ key: "settings", href: "/admin/settings", label: "Settings" })}
      </div>
    </nav>
  );
}
