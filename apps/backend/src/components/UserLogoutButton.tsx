"use client";

import { useRouter } from "next/navigation";

export function UserLogoutButton() {
  const router = useRouter();

  return (
    <button
      className="btn outline"
      onClick={async () => {
        await fetch("/api/auth/user-logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      Logout
    </button>
  );
}
