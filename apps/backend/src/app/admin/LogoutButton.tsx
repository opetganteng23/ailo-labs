"use client";

export function LogoutButton() {
  return (
    <button
      className="btn outline"
      style={{ marginTop: 10, width: "100%" }}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        // Hard navigation avoids a stale router-cache render after the
        // session cookie is cleared.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional hard navigation, see comment above
        window.location.href = "/admin/login";
      }}
    >
      Log out
    </button>
  );
}
