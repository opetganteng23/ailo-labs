import { headers } from "next/headers";

/** Derives the current request's origin (scheme + host) for building absolute URLs, e.g. for a QR code payload. */
export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
