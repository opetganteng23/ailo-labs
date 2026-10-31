"use client";

import { useEffect, useRef } from "react";

/** Rewrites .class and #id in a selector to the document's unique prefix (the server prefixed the markup the same way). */
function prefixSelector(selector: string, prefix: string): string {
  return selector.replace(/([.#])([A-Za-z_][\w-]*)/g, (_m, mark: string, name: string) => mark + prefix + name);
}

type Cleanup = () => void;

/** `;if(typeof fn==="function")window.fn=fn;` for every top-level function declaration in the script. */
function publishFunctions(code: string): string {
  const names = new Set<string>();
  for (const m of code.matchAll(/(?:^|\n)\s*(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/g)) names.add(m[1]);
  return Array.from(names)
    .map((n) => `\n;if(typeof ${n}==="function")window.${n}=${n};`)
    .join("");
}

/**
 * The server prefixes every class and id in the markup so a document's CSS cannot clash with the site. Elements the
 * script creates later (innerHTML, classList.add, ...) carry the plain names, so they get the same prefix as they appear.
 */
function prefixLateNodes(holder: HTMLElement, prefix: string): Cleanup {
  if (!prefix) return () => undefined;
  const fixClass = (el: Element) => {
    const raw = el.getAttribute("class");
    if (!raw) return;
    const next = raw
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => (t.startsWith(prefix) || t.startsWith("rte-") || t.startsWith("align-") ? t : prefix + t))
      .join(" ");
    if (next !== raw) el.setAttribute("class", next);
  };
  const fixAttr = (el: Element, name: "id" | "for") => {
    const v = el.getAttribute(name);
    if (v && !v.startsWith(prefix)) el.setAttribute(name, prefix + v);
  };
  const fix = (el: Element) => {
    fixClass(el);
    fixAttr(el, "id");
    if (el.tagName === "LABEL") fixAttr(el, "for");
  };
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "attributes" && r.target instanceof Element) {
        if (r.attributeName === "class") fixClass(r.target);
        else if (r.attributeName === "id") fixAttr(r.target, "id");
        else if (r.attributeName === "for" && r.target.tagName === "LABEL") fixAttr(r.target, "for");
      }
      r.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          fix(node);
          node.querySelectorAll("*").forEach(fix);
        }
      });
    }
  });
  observer.observe(holder, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "id", "for"] });
  return () => observer.disconnect();
}

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
          const prefix = tag.dataset.prefix ?? "";
          cleanups.push(prefixLateNodes(holder, prefix));
          // Elements a script builds with innerHTML may carry onclick="fn()", which the browser runs in the global scope.
          // Publish the script's top-level functions there so those handlers can find them.
          const code = (tag.textContent ?? "") + publishFunctions(tag.textContent ?? "");
          const run = new Function("document", "window", code);
          run(makeDocument(holder, prefix, cleanups), makeWindow(cleanups));
        } catch (error) {
          console.error("Embedded script failed", error);
        }
      }
    }
    return () => cleanups.forEach((fn) => fn());
  }, [html]);

  // Forms inside a page have no destination of their own; their script reads the fields, so a submit must never navigate.
  return <div ref={ref} className={className} style={style} onSubmit={(e) => e.preventDefault()} dangerouslySetInnerHTML={{ __html: html }} />;
}
