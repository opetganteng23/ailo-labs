"use client";

import { useEffect, useRef } from "react";

/** Rewrites .class and #id in a selector to the document's unique prefix (the server prefixed the markup the same way). */
function prefixSelector(selector: string, prefix: string): string {
  return selector.replace(/([.#])([A-Za-z_][\w-]*)/g, (_m, mark: string, name: string) => mark + prefix + name);
}

type Cleanup = () => void;

function makeDocument(root: HTMLElement, prefix: string, cleanups: Cleanup[]): Document {
  return new Proxy(document, {
    get(target, prop) {
      switch (prop) {
        case "getElementById":
          return (id: string) => target.getElementById(prefix + id);
        case "querySelector":
          return (s: string) => root.querySelector(prefixSelector(s, prefix));
        case "querySelectorAll":
          return (s: string) => root.querySelectorAll(prefixSelector(s, prefix));
        case "getElementsByClassName":
          return (c: string) => root.getElementsByClassName(c.split(/\s+/).map((n) => prefix + n).join(" "));
        case "addEventListener":
          return (type: string, listener: EventListenerOrEventListenerObject, opts?: boolean | AddEventListenerOptions) => {
            target.addEventListener(type, listener, opts);
            cleanups.push(() => target.removeEventListener(type, listener, opts));
          };
      }
      const value = Reflect.get(target, prop);
      return typeof value === "function" ? value.bind(target) : value;
    },
    set(target, prop, value) {
      return Reflect.set(target, prop, value);
    },
  });
}

function makeWindow(cleanups: Cleanup[]): Window {
  return new Proxy(window, {
    get(target, prop) {
      if (prop === "addEventListener") {
        return (type: string, listener: EventListenerOrEventListenerObject, opts?: boolean | AddEventListenerOptions) => {
          target.addEventListener(type, listener, opts);
          cleanups.push(() => target.removeEventListener(type, listener, opts));
        };
      }
      const value = Reflect.get(target, prop);
      return typeof value === "function" ? value.bind(target) : value;
    },
    set(target, prop, value) {
      return Reflect.set(target, prop, value);
    },
  });
}

/**
 * Renders stored rich-text HTML. Admin-authored inline scripts (already verified on the server and delivered as
 * inert text/rte-script blocks) are run here, scoped: getElementById / querySelector see the document's own,
 * prefixed elements, and listeners they add are removed again when the page unmounts.
 */
export function RichContent({ html, className, style }: { html: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const cleanups: Cleanup[] = [];
    for (const holder of Array.from(host.querySelectorAll<HTMLElement>("[data-rte-scripts]"))) {
      for (const tag of Array.from(holder.querySelectorAll<HTMLScriptElement>('script[type="text/rte-script"]'))) {
        try {
          const run = new Function("document", "window", tag.textContent ?? "");
          run(makeDocument(holder, tag.dataset.prefix ?? "", cleanups), makeWindow(cleanups));
        } catch (error) {
          console.error("Embedded script failed", error);
        }
      }
    }
    return () => cleanups.forEach((fn) => fn());
  }, [html]);

  return <div ref={ref} className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}
