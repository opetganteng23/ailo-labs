"use client";

import { useEffect, useState } from "react";

import { hm } from "./util";

/** Optional photo (or slideshow, when there are several) behind a homepage section, plus its tinted overlay. */
export function BackgroundLayer({ images, opacityPercent, tone = "light" }: { images?: string[]; opacityPercent?: number; tone?: "light" | "dark" }) {
  const list = (images ?? []).filter(Boolean);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (list.length < 2) return;
    let swap = 0;
    const timer = window.setInterval(() => {
      setVisible(false);
      swap = window.setTimeout(() => {
        setIndex((i) => (i + 1) % list.length);
        setVisible(true);
      }, 600);
    }, 5000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(swap);
    };
  }, [list.length]);

  if (list.length === 0) return null;
  const opacity = Math.max(0, Math.min(100, opacityPercent ?? (tone === "dark" ? 66 : 88))) / 100;
  const tint = tone === "dark" ? "6,32,36" : "251,249,246";

  return (
    <>
      <div className={hm("section-bg-layer")} style={{ backgroundImage: `url('${list[index]}')`, opacity: visible ? 1 : 0 }} />
      <div className={hm("section-bg-overlay")} style={{ background: `rgba(${tint},${opacity})` }} />
    </>
  );
}
