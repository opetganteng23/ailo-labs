"use client";

export function LogoutButton() {
  return (
    <button
      aria-label="Log out"
      className="admin-logout-btn"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        // Hard navigation avoids a stale router-cache render after the
        // session cookie is cleared.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional hard navigation, see comment above
        window.location.href = "/admin/login";
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />
      </svg>
    </button>
  );
}
