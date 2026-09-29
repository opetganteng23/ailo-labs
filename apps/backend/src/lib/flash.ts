import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";

export const FLASH_COOKIE = "ailo_flash";

export type FlashType = "success" | "error";

/**
 * Queues a one-shot notification for the admin UI. The <Toaster /> in the admin
 * layout picks it up from the cookie and shows it, so every server action reports
 * success or failure the same way, whether or not it redirects afterwards.
 */
export async function flash(type: FlashType, message: string) {
  const store = await cookies();
  let queue: unknown[] = [];
  try {
    const existing = JSON.parse(decodeURIComponent(store.get(FLASH_COOKIE)?.value ?? "[]"));
    queue = Array.isArray(existing) ? existing : [];
  } catch {
    queue = [];
  }
  queue.push({ type, message, id: Date.now() + queue.length });
  store.set(FLASH_COOKIE, encodeURIComponent(JSON.stringify(queue.slice(-4))), {
    path: "/",
    maxAge: 60,
    sameSite: "lax",
  });
}

/** Thrown inside a withFlash() body to show its own message instead of the generic error. */
export class FlashError extends Error {}

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
      await flash("error", error.message);
      return false;
    }
    console.error(messages.error, error);
    const duplicate = (error as { code?: number })?.code === 11000;
    await flash("error", duplicate ? "An item with the same name or email already exists." : messages.error);
    return false;
  }
}
