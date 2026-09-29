"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * A submit button that asks for confirmation in a dialog before submitting its
 * form. Used for every destructive admin action (delete, revoke).
 */
export function ConfirmSubmit({
  children,
  title = "Delete this item?",
  message = "This can't be undone.",
  confirmLabel = "Delete",
  className,
  style,
  ariaLabel,
}: {
  children: ReactNode;
  title?: string;
  message?: string;
  confirmLabel?: string;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={className}
        style={style}
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      {open && (
        <div className="confirm-overlay" role="presentation" onClick={() => setOpen(false)}>
          <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
            <span className="confirm-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6z" />
              </svg>
            </span>
            <h2 id="confirm-title">{title}</h2>
            <p>{message}</p>
            <div className="confirm-actions">
              <button type="button" className="admin2-btn outline" onClick={() => setOpen(false)} autoFocus>
                Cancel
              </button>
              <button
                type="button"
                className="admin2-btn danger-solid"
                onClick={() => {
                  setOpen(false);
                  buttonRef.current?.form?.requestSubmit();
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
