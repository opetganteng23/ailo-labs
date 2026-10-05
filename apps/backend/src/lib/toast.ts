/** Client-side trigger for the shared <Toaster />, for forms that submit via fetch instead of a server action. */
export function toast(type: "success" | "error" | "warning" | "info", message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("ailo:toast", { detail: { type, message } }));
}
