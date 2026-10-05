"use client";

import { useEffect, useRef, useState } from "react";

import type { NewsCard } from "./data";
import { hm, truncate } from "./util";

const SAMPLE: NewsCard[] = [
  { title: "AILO team publishes new scheduling algorithm for campus lab allocation", summary: "A reinforcement-learning approach that cuts booking conflicts across shared research facilities.", slug: "", category: "Research", publishedAt: "2026-09-02T00:00:00Z" },
  { title: "New partnership expands AILO's applied NLP work in Bahasa Indonesia", summary: "A joint project focused on retrieval-augmented systems for public information access.", slug: "", category: "Collaboration", publishedAt: "2026-08-27T00:00:00Z" },
  { title: "Deep Learning Lab adds new GPU cluster for student research", summary: "Four new GPU nodes are now open for booking through the lab's device inventory.", slug: "", category: "Lab update", publishedAt: "2026-08-14T00:00:00Z" },
];

function formatDate(iso?: string) {
  return iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "";
}

/** One-at-a-time news slider: native scroll-snap underneath, with prev/next buttons and dots on top. */
export function NewsSlider({ items }: { items: NewsCard[] }) {
  const list = items.length > 0 ? items : SAMPLE;
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function slideLeft(i: number) {
    const el = track.current;
    const slide = el?.children[i] as HTMLElement | undefined;
    return el && slide ? slide.offsetLeft - el.offsetLeft : 0;
  }

  function currentIndex() {
    const el = track.current;
    if (!el) return 0;
    const pos = el.scrollLeft + el.clientWidth / 2;
    let closest = 0;
    let best = Infinity;
    Array.from(el.children).forEach((child, i) => {
      const slide = child as HTMLElement;
      const dist = Math.abs(pos - (slide.offsetLeft - el.offsetLeft + slide.clientWidth / 2));
      if (dist < best) {
        best = dist;
        closest = i;
      }
    });
    return closest;
  }

  function go(i: number) {
    track.current?.scrollTo({ left: slideLeft(i), behavior: "smooth" });
  }

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let timer = 0;
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setActive(currentIndex()), 80);
    };
    el.addEventListener("scroll", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <div className={hm("news-carousel")}>
        <button type="button" className={hm("news-nav prev")} aria-label="Previous article" onClick={() => go(Math.max(0, currentIndex() - 1))}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <div className={hm("news-grid")} id="news-grid" ref={track}>
          {list.map((item, i) => (
            <div key={`${item.slug}-${i}`} className={hm("news-slide")}>
            <a className={hm("ncard")} href={item.slug ? `/news/${item.slug}` : "/news"}>
              <div className={hm("nthumb")} style={item.image ? { backgroundImage: `url('${item.image}')`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                <span className={hm("tag")}>{item.category}</span>
              </div>
              <div className={hm("nbody")}>
                <div className={hm("date")}>{formatDate(item.publishedAt)}</div>
                <h3>{item.title}</h3>
                <p>{truncate(item.summary, 140)}</p>
                <span className={hm("read")}>Read article</span>
              </div>
            </a>
            </div>
          ))}
        </div>
        <button type="button" className={hm("news-nav next")} aria-label="Next article" onClick={() => go(Math.min(list.length - 1, currentIndex() + 1))}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
      <div className={hm("news-dots")} id="news-dots">
        {list.map((_, i) => (
          <button key={i} type="button" className={i === active ? hm("active") : undefined} aria-label={`Go to article ${i + 1}`} onClick={() => go(i)} />
        ))}
      </div>
    </>
  );
}
