import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Inline scripts in rich-text bodies run on the public site, so only an admin save may create them.
 * Each stored script carries an HMAC of its code made with the server secret; at display time a script
 * without a valid signature (edited in the database, or saved by anyone else) is dropped.
 */
function key(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required.");
  return secret;
}

export function signScript(code: string): string {
  return createHmac("sha256", key()).update("rte-script:" + code).digest("hex");
}

export function verifyScript(code: string, sig: string): boolean {
  if (!/^[0-9a-f]{64}$/.test(sig)) return false;
  try {
    return timingSafeEqual(Buffer.from(signScript(code), "hex"), Buffer.from(sig, "hex"));
  } catch {
    return false;
  }
}
