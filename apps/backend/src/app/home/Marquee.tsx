"use client";

import { useEffect, useRef } from "react";

import type { StripItem } from "./data";
import { hm } from "./util";

const SAMPLE: StripItem[] = [
  { bold: "Optimization", text: "Reinforcement Learning" },
  { bold: "NLP", text: "Retrieval-Augmented Generation" },
  { bold: "Computer Vision", text: "Edge Deployment" },
  { bold: "Applied ML", text: "Smart Campus Systems" },
];

const SPEED_PX_PER_SEC = 60;

function Item({ item }: { item: StripItem }) {
  if (item.image) {
    // eslint-disable-next-line @next/next/no-img-element -- partner logos are arbitrary uploads
    return <img src={item.image} alt={item.bold || item.text || ""} className={item.dark ? hm("dark") : undefined} />;
  }
  return (
    <span>
      {item.bold && <b>{item.bold}</b>}
      {item.bold && item.text ? " · " : ""}
      {item.text}
    </span>
  );
}

/** The running strip under the hero. The item list is rendered twice so a translateX(-50%) loop is seamless. */
export function Marquee({ items }: { items?: StripItem[] }) {
  const list = items && items.length > 0 ? items : SAMPLE;
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    // Half the track is one full loop; keep the scroll speed constant however many items there are.
    const duration = el.scrollWidth / 2 / SPEED_PX_PER_SEC;
    el.style.animationDuration = `${Math.max(duration, 8)}s`;
  }, [list.length]);

  return (
    <div className={hm("strip")}>
      <div className={hm("strip-inner")} id="marquee" ref={track}>
        {[0, 1].map((copy) =>
          list.map((item, i) => (
            <span key={`${copy}-${i}`} style={{ display: "contents" }}>
              {(copy > 0 || i > 0) && <span className={hm("sep")} />}
              <Item item={item} />
            </span>
          )),
        )}
      </div>
    </div>
  );
}
