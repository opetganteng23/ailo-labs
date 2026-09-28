"use client";

export function UserLogoutButton() {
  return (
    <button
      className="btn outline"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        // Hard navigation avoids a stale router-cache render after the
        // session cookie is cleared.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional hard navigation, see comment above
        window.location.href = "/";
      }}
    >
      Logout
    </button>
  );
}
