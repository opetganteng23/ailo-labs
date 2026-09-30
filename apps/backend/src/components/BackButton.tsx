"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Goes back to the previous page when the visitor came from this site,
 * otherwise to `fallbackHref` (e.g. someone opened a shared link directly).
 */
export function BackButton({ fallbackHref = "/", label = "Back" }: { fallbackHref?: string; label?: string }) {
  const router = useRouter();

  return (
    <Link
      href={fallbackHref}
      className="back-btn"
      onClick={(e) => {
        const sameSite = typeof document !== "undefined" && document.referrer.startsWith(window.location.origin);
        if (sameSite && window.history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {label}
    </Link>
  );
}
