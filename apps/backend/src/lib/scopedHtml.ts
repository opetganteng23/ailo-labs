import { createHash } from "node:crypto";

import postcss, { type AtRule, type Rule } from "postcss";

import { signScript, verifyScript } from "./scriptSign";

/**
 * Support for complete HTML documents (their own <style>) pasted in the editor's HTML mode.
 *
 * Stored content keeps a cleaned <style> block. When it is shown to visitors, the CSS is scoped
 * to the body it came with: every selector is prefixed with a wrapper class and every class/id the
 * document defines gets a unique prefix, so it can neither restyle the site nor be restyled by it
 * (the site already has .wrap, .btn, .card, ... with other meanings).
 */

const STYLE_BLOCK = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;

/** Pulls every <style> block out of the HTML and drops the document shell (doctype, head, title, meta, link). */
export function splitDocument(html: string): { body: string; css: string } {
  const styles: string[] = [];
  let body = html.replace(STYLE_BLOCK, (_m, css: string) => {
    styles.push(css);
    return "";
  });
  body = body
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<head\b[\s\S]*?<\/head>/gi, "")
    .replace(/<\/?(?:html|body)\b[^>]*>/gi, "")
    .replace(/<(?:title|meta|link|base)\b[^>]*>(?:[\s\S]*?<\/title>)?/gi, "");
  return { body: body.trim(), css: styles.join("\n") };
}

const DROPPED_AT_RULES = new Set(["import", "charset", "namespace", "font-face", "property", "layer", "font-feature-values"]);

/** Removes everything in the CSS that could load a resource, run code, or cover the rest of the page. */
export function cleanCss(css: string): string {
  if (!css.trim()) return "";
  let root;
  try {
    root = postcss.parse(css);
  } catch {
    return "";
  }
  root.walkComments((c) => {
    c.remove();
  });
  root.walkAtRules((at) => {
    const name = at.name.toLowerCase();
    // The site has no dark theme, so the document's dark-mode variant would only clash with it.
    if (DROPPED_AT_RULES.has(name) || (name === "media" && /prefers-color-scheme/i.test(at.params))) at.remove();
  });
  root.walkRules((rule) => {
    if (/data-theme/i.test(rule.selector)) rule.remove();
  });
  root.walkDecls((decl) => {
    const prop = decl.prop.toLowerCase();
    if (/url\s*\(|expression\s*\(|javascript:|-moz-binding|behavior/i.test(decl.value) || prop === "behavior" || prop === "-moz-binding") decl.remove();
    else if (prop === "position" && /fixed|sticky/i.test(decl.value)) decl.remove();
    else if (prop === "z-index") decl.remove();
  });
  root.walk((node) => {
    if ((node.type === "rule" || node.type === "atrule") && node.nodes && node.nodes.length === 0) node.remove();
  });
  return root.toString().replace(/<\/?style/gi, "").replace(/<!--|-->/g, "").trim();
}

function splitTopLevel(selector: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote = "";
  let start = 0;
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i];
    if (quote) {
      if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(selector.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(selector.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

const IDENT_START = /[_a-zA-Z]/;

/** Prefixes every .class and #id in a selector (not inside [attr="..."] or strings). */
function prefixSelector(selector: string, prefix: string): string {
  let out = "";
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i];
    if (ch === "[") {
      const end = selector.indexOf("]", i);
      const stop = end === -1 ? selector.length : end + 1;
      out += selector.slice(i, stop);
      i = stop - 1;
    } else if ((ch === "." || ch === "#") && IDENT_START.test(selector[i + 1] ?? "")) {
      out += ch + prefix;
    } else if (ch === "\\") {
      out += selector.slice(i, i + 2);
      i++;
    } else out += ch;
  }
  return out;
}

function scopeOne(selector: string, root: string, prefix: string): string {
  let rest = selector.trim();
  let rooted = false;
  for (;;) {
    const m = /^(?::root|html|body)(?![\w-])/i.exec(rest);
    if (!m) break;
    rooted = true;
    rest = rest.slice(m[0].length);
    if (/^\s/.test(rest)) rest = rest.trimStart();
    else break;
  }
  if (rooted) {
    if (!rest) return root;
    return /^[.:[#]/.test(rest) ? `${root}${prefixSelector(rest, prefix)}` : `${root} ${prefixSelector(rest, prefix)}`;
  }
  return `${root} ${prefixSelector(rest, prefix)}`;
}

export function scopeCss(css: string, scopeClass: string, prefix: string): string {
  let root;
  try {
    root = postcss.parse(css);
  } catch {
    return "";
  }
  const wrapper = `.rte-body .${scopeClass}`;
  root.walkRules((rule: Rule) => {
    const parent = rule.parent;
    if (parent && parent.type === "atrule" && /keyframes$/i.test((parent as AtRule).name)) return;
    rule.selector = splitTopLevel(rule.selector)
      .map((s) => scopeOne(s, wrapper, prefix))
      .join(", ");
  });
  // Absolutely positioned decoration inside the document must not escape onto the surrounding page.
  return `${wrapper}{position:relative;isolation:isolate;overflow:clip}\n${wrapper} [hidden]{display:none !important}\n${root.toString()}`;
}

function rewriteTagAttributes(body: string, prefix: string): string {
  return body.replace(/<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (whole, tag: string, attrs: string) => {
    if (!attrs) return whole;
    const next = attrs
      .replace(/(\sclass=")([^"]*)"/, (_m, head: string, value: string) => {
        const tokens = value
          .split(/\s+/)
          .filter(Boolean)
          .map((t) => (t.startsWith("rte-") || t.startsWith("align-") ? t : prefix + t));
        return `${head}${tokens.join(" ")}"`;
      })
      .replace(/(\sid=")([^"]*)"/, (_m, head: string, value: string) => `${head}${prefix}${value}"`)
      .replace(/(\shref="#)([^"]*)"/, (_m, head: string, value: string) => `${head}${prefix}${value}"`);
    return `<${tag}${next}>`;
  });
}

/** Cleaned (not yet scoped) form that is stored: the <style> block first, then the markup. */
export function joinDocument(css: string, body: string): string {
  const clean = cleanCss(css);
  return clean ? `<style>${clean}</style>${body}` : body;
}

/** Display form: scoped CSS plus the markup wrapped in its scope element. Content without its own CSS is returned unchanged. */
export function scopeDocument(css: string, body: string): string {
  const clean = cleanCss(css);
  if (!clean) return body;
  const hash = createHash("sha1").update(clean).digest("hex").slice(0, 8);
  const scopeClass = `rte-scope-${hash}`;
  const prefix = `s${hash}-`;
  const scoped = scopeCss(clean, scopeClass, prefix);
  return `<style>${scoped.replace(/<\/?style/gi, "")}</style><div class="${scopeClass}">${rewriteTagAttributes(body, prefix)}</div>`;
}

const RAW_SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const SIGNED_SCRIPT = /<script data-sig="([0-9a-f]{64})">([\s\S]*?)<\/script>/g;

/** Takes inline <script> blocks out of the HTML (those with a src are dropped). */
export function extractScripts(html: string): { html: string; scripts: string[] } {
  const scripts: string[] = [];
  const rest = html.replace(RAW_SCRIPT, (_m, attrs: string, code: string) => {
    if (!/\bsrc\s*=/i.test(attrs) && code.trim()) scripts.push(code.trim());
    return "";
  });
  return { html: rest, scripts };
}

/** Save time (admin only): appends each script with its signature. */
export function attachSignedScripts(stored: string, scripts: string[]): string {
  return stored + scripts.map((code) => `<script data-sig="${signScript(code)}">${code}</script>`).join("");
}

/** Display time: pulls out the scripts whose signature is valid and leaves everything else. */
export function takeVerifiedScripts(stored: string): { html: string; scripts: string[] } {
  const scripts: string[] = [];
  const html = stored.replace(SIGNED_SCRIPT, (_m, sig: string, code: string) => {
    if (verifyScript(code, sig)) scripts.push(code);
    return "";
  });
  return { html, scripts };
}

/** Wraps display markup in its scope element, with the verified scripts as inert data for the client runner. */
export function scopeDocumentWithScripts(css: string, body: string, scripts: string[]): string {
  const clean = cleanCss(css);
  if (!clean && scripts.length === 0) return body;
  const hash = createHash("sha1").update(clean + scripts.join("\n")).digest("hex").slice(0, 8);
  const scopeClass = `rte-scope-${hash}`;
  const prefix = `s${hash}-`;
  const style = clean ? `<style>${scopeCss(clean, scopeClass, prefix).replace(/<\/?style/gi, "")}</style>` : "";
  const data = scripts.map((code) => `<script type="text/rte-script" data-prefix="${prefix}">${code.replace(/<\/script/gi, "<\\/script")}</script>`).join("");
  return `${style}<div class="${scopeClass}" data-rte-scripts="${scripts.length}">${rewriteTagAttributes(body, prefix)}${data}</div>`;
}
