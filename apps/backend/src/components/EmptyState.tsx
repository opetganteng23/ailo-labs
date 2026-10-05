import Link from "next/link";

type EmptyStateProps = {
  title: string;
  message?: string;
  /** Primary way out of the empty state, e.g. creating the first item. */
  actionHref?: string;
  actionLabel?: string;
  /** "admin" matches the admin console buttons; "public" the website buttons. */
  variant?: "admin" | "public";
};

/** One empty-state pattern for every list in the admin console and on the public site. */
export function EmptyState({ title, message, actionHref, actionLabel, variant = "admin" }: EmptyStateProps) {
  return (
    <div className={`empty-state empty-state-${variant}`}>
      <span className="empty-state-icon" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8l9-5 9 5v8l-9 5-9-5z" />
          <path d="M3 8l9 5 9-5M12 13v8" />
        </svg>
      </span>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {actionHref && actionLabel && (
        <Link href={actionHref} className={variant === "admin" ? "admin2-btn" : "btn"}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
