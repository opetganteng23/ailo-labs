"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A single horizontally scrolling row (swipe on touch, scroll-snap, prev/next buttons for mouse
 * users). Used where a list can outgrow its width but should never push the page further down.
 * The buttons only appear when there is actually something off-screen in that direction.
 */
export function ScrollRow({ children, label }: { children: ReactNode; label: string }) {
  const row = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = row.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [update, children]);

  function scrollBy(direction: 1 | -1) {
    const el = row.current;
    if (el) el.scrollBy({ left: direction * Math.max(240, el.clientWidth * 0.85), behavior: "smooth" });
  }

  return (
    <div className="scroll-row-wrap">
      {canPrev && (
        <button type="button" className="scroll-row-btn prev" onClick={() => scrollBy(-1)} aria-label={`Geser ${label} ke kiri`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </button>
      )}
      <div className="scroll-row" ref={row} role="group" aria-label={label} tabIndex={0}>
        {children}
      </div>
      {canNext && (
        <button type="button" className="scroll-row-btn next" onClick={() => scrollBy(1)} aria-label={`Geser ${label} ke kanan`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      )}
    </div>
  );
}
