"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

const SHEET_WIDTH_PX = (210 / 25.4) * 96; // A4 width at 96 dpi
const SHEET_HEIGHT_PX = (297 / 25.4) * 96;

/** Shows the A4 membership sheet shrunk to fit narrow screens; printing always uses the real A4 size. */
export function ScaledSheet({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / SHEET_WIDTH_PX));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={host} className="ms-fit" style={{ height: SHEET_HEIGHT_PX * scale }}>
      <div className="ms-scale" style={{ transform: `scale(${scale})`, width: SHEET_WIDTH_PX, height: SHEET_HEIGHT_PX }}>
        {children}
      </div>
    </div>
  );
}
