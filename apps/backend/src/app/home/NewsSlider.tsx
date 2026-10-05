"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

/**
 * News slider that shows a page of cards at a time (3 on desktop, 2 on tablets, 1 on phones - set in CSS).
 * Native scroll-snap underneath; the arrows and dots move one page, i.e. as many cards as are visible.
 */
export function NewsSlider({ items }: { items: NewsCard[] }) {
  const list = items.length > 0 ? items : SAMPLE;
  const track = useRef<HTMLDivElement>(null);
  const [perView, setPerView] = useState(3);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(list.length / perView));

  const measure = useCallback(() => {
    const el = track.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return { per: 1, step: 0 };
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = first.offsetWidth + gap;
    return { per: Math.max(1, Math.round((el.clientWidth + gap) / step)), step };
  }, []);

  const currentPage = useCallback(() => {
    const el = track.current;
    if (!el) return 0;
    const { per, step } = measure();
    return Math.min(Math.max(0, Math.ceil(list.length / per) - 1), Math.round(el.scrollLeft / (step * per)));
  }, [list.length, measure]);

  function go(target: number) {
    const el = track.current;
    const { per } = measure();
    const card = el?.children[Math.min(list.length - 1, target * per)] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
  }

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    setPerView(measure().per);
    let timer = 0;
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setPage(currentPage()), 80);
    };
    const onResize = () => setPerView(measure().per);
    el.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
    };
  }, [measure, currentPage]);

  return (
    <>
      <div className={hm("news-carousel")}>
        <button type="button" className={hm("news-nav prev")} aria-label="Previous articles" onClick={() => go(Math.max(0, currentPage() - 1))}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <div className={hm(list.length <= perView ? "news-grid few" : "news-grid")} id="news-grid" ref={track}>
          {list.map((item, i) => (
            <a key={`${item.slug}-${i}`} className={hm("ncard")} href={item.slug ? `/news/${item.slug}` : "/news"}>
              <div className={hm("nthumb")} style={item.image ? { backgroundImage: `url('${item.image}')`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                <span className={hm("tag")}>{(item.categories?.length ? item.categories : [item.category]).join(" · ")}</span>
              </div>
              <div className={hm("nbody")}>
                <div className={hm("date")}>{formatDate(item.publishedAt)}</div>
                <h3>{item.title}</h3>
                <p>{truncate(item.summary, 140)}</p>
                <span className={hm("read")}>Read article</span>
              </div>
            </a>
          ))}
        </div>
        <button type="button" className={hm("news-nav next")} aria-label="Next articles" onClick={() => go(Math.min(pages - 1, currentPage() + 1))}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
      {pages > 1 && (
        <div className={hm("news-dots")} id="news-dots">
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} type="button" className={i === page ? hm("active") : undefined} aria-label={`Go to page ${i + 1}`} onClick={() => go(i)} />
          ))}
        </div>
      )}
    </>
  );
}
