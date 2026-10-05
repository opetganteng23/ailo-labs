import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";

export const FLASH_COOKIE = "ailo_flash";

export type FlashType = "success" | "error" | "warning" | "info";

/**
 * Queues a one-shot notification for the admin UI. The <Toaster /> in the admin
 * layout picks it up from the cookie and shows it, so every server action reports
 * success or failure the same way, whether or not it redirects afterwards.
 */
export async function flash(type: FlashType, message: string) {
  const store = await cookies();
  let queue: unknown[] = [];
  try {
    const existing = JSON.parse(store.get(FLASH_COOKIE)?.value ?? "[]");
    queue = Array.isArray(existing) ? existing : [];
  } catch {
    queue = [];
  }
  queue.push({ type, message, id: Date.now() + queue.length });
  // Next.js URI-encodes cookie values itself; encoding here too made the
  // browser-side JSON unreadable and every toast was silently dropped.
  store.set(FLASH_COOKIE, JSON.stringify(queue.slice(-4)), {
    path: "/",
    maxAge: 60,
    sameSite: "lax",
  });
}

/** Thrown inside a withFlash() body to show its own message instead of the generic error. */
export class FlashError extends Error {
  constructor(
    message: string,
    readonly level: "error" | "warning" | "info" = "error",
  ) {
    super(message);
  }
}

/**
 * Runs a server-action body and reports the outcome as a toast. Redirects and
 * other Next.js control-flow errors pass through untouched. Returns false when
 * the body failed, so the caller can skip a follow-up redirect.
 */
export async function withFlash(run: () => Promise<void>, messages: { success: string; error: string }): Promise<boolean> {
  try {
    await run();
    await flash("success", messages.success);
    return true;
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof FlashError) {
      await flash(error.level, error.message);
      return false;
    }
    console.error(messages.error, error);
    const mongoError = error as { code?: number; keyPattern?: Record<string, unknown> };
    if (mongoError?.code === 11000) {
      const field = Object.keys(mongoError.keyPattern ?? {})[0];
      await flash("error", field ? `An item with the same ${field} already exists.` : "An item with the same value already exists.");
    } else {
      await flash("error", messages.error);
    }
    return false;
  }
}
