"use client";

import { useEffect, useRef, useState } from "react";

const FLASH_COOKIE = "ailo_flash";
const REQUIRED_MESSAGE = "This field is required.";

type Toast = { id: number; type: "success" | "error"; message: string };

function readFlashCookie(): Toast[] {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${FLASH_COOKIE}=`));
  if (!match) return [];
  document.cookie = `${FLASH_COOKIE}=; path=/; max-age=0`;
  try {
    const parsed = JSON.parse(decodeURIComponent(match.slice(FLASH_COOKIE.length + 1)));
    const list: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
    return list.flatMap((item) => {
      const t = item as { id?: unknown; type?: unknown; message?: unknown };
      return (t.type === "success" || t.type === "error") && typeof t.message === "string"
        ? [{ id: Number(t.id) || Date.now() + Math.random(), type: t.type, message: t.message }]
        : [];
    });
  } catch {
    // A malformed cookie is simply dropped.
    return [];
  }
}

function markInvalid(field: HTMLElement) {
  field.classList.add("field-invalid");
  const next = field.nextElementSibling;
  if (!(next instanceof HTMLElement && next.dataset.fieldError)) {
    const msg = document.createElement("span");
    msg.className = "field-error";
    msg.dataset.fieldError = "true";
    msg.textContent = REQUIRED_MESSAGE;
    field.insertAdjacentElement("afterend", msg);
  }
}

function clearInvalid(field: HTMLElement) {
  field.classList.remove("field-invalid");
  const next = field.nextElementSibling;
  if (next instanceof HTMLElement && next.dataset.fieldError) next.remove();
}

/**
 * One notification system for the whole admin panel:
 * - success / error toasts queued by server actions (flash cookie) or by client code (`toast()`),
 * - required-field validation: any blocked submit outlines the empty fields in red,
 *   adds "This field is required." under each and shows one summary toast.
 */
export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastInvalidToast = useRef(0);

  useEffect(() => {
    function push(t: Omit<Toast, "id"> & { id?: number }) {
      const id = t.id ?? Date.now() + Math.random();
      setToasts((list) => (list.some((x) => x.id === id) ? list : [...list, { ...t, id }]));
      window.setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), t.type === "error" ? 7000 : 4000);
    }

    // Server actions set the cookie on their response; poll so toasts also appear
    // after actions that don't navigate.
    const poll = window.setInterval(() => {
      readFlashCookie().forEach(push);
    }, 300);

    function onToast(event: Event) {
      const detail = (event as CustomEvent<{ type: "success" | "error"; message: string }>).detail;
      if (detail) push(detail);
    }

    function onInvalid(event: Event) {
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) return;
      markInvalid(field);
      const now = Date.now();
      if (now - lastInvalidToast.current > 800) {
        lastInvalidToast.current = now;
        push({ type: "error", message: "Please fill in the required fields marked in red." });
      }
    }

    function onInput(event: Event) {
      const field = event.target;
      if (field instanceof HTMLElement && field.classList.contains("field-invalid")) {
        if (!("checkValidity" in field) || (field as HTMLInputElement).checkValidity()) clearInvalid(field);
      }
    }

    window.addEventListener("ailo:toast", onToast);
    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("ailo:toast", onToast);
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("change", onInput, true);
    };
  }, []);

  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon" aria-hidden="true">
            {t.type === "success" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5 9-10" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M12 7v6M12 17h.01" />
              </svg>
            )}
          </span>
          <span className="toast-message">{t.message}</span>
          <button type="button" className="toast-close" aria-label="Dismiss" onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
