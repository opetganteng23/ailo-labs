/**
 * Validates a `?next=` redirect target so it can only point somewhere
 * inside this app. Without this, a crafted link like
 * `/login?next=https://evil.example` (or `//evil.example`, a
 * protocol-relative URL) would redirect a user off-site right after they
 * enter their credentials.
 */
export function safeNextPath(next: string | null, fallback: string): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
