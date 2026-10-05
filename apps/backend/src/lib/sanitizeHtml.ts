import sanitize from "sanitize-html";

import { buildEmbedDoc, clampEmbedHeight, EMBED_MAX_HTML, EMBED_SANDBOX } from "./htmlEmbed";

// The browser re-serializes colours as rgb()/rgba() when TipTap reads them back from the DOM, so hex alone would strip every colour on save.
const HEX_OR_INHERIT = /^(#[0-9a-fA-F]{3,8}|inherit|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/;
const FONT_FAMILY = /^[a-zA-Z0-9\s,'-]{1,120}$/;
const FONT_SIZE = /^\d{1,3}(\.\d+)?(px|em|rem|%)$/;
const PERCENT_WIDTH = /^\d{1,3}%$/;

/**
 * Whitelist for rich-text bodies (news, research, projects). Everything the
 * editor can produce is allowed; scripts, event handlers, iframes, and
 * javascript: URLs are stripped (XSS). Style values are validated, not just
 * whitelisted by property name, so e.g. `color` can't smuggle a url(...).
 *
 * `allowEmbed` (admin only) additionally keeps the editor's "HTML embed" block:
 * a div carrying the raw HTML as an attribute value. It is never rendered as
 * markup here; renderRichText() turns it into a sandboxed iframe.
 */
export function sanitizeRichText(html: string, options: { allowEmbed?: boolean } = {}): string {
  const embed = Boolean(options.allowEmbed);
  return sanitize(html ?? "", {
    allowedTags: [
      ...(embed ? ["div"] : []),
      "p", "br", "h1", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "del", "a", "span", "mark",
      "ul", "ol", "li", "blockquote", "hr", "img", "figure", "figcaption", "pre", "code",
      "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "loading"],
      figure: ["class", "style", "data-type"],
      mark: ["data-color", "style"],
      th: ["colspan", "rowspan", "style"],
      td: ["colspan", "rowspan", "style"],
      p: ["style"],
      span: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      ...(embed ? { div: ["data-type", "data-html", "data-height"] } : {}),
    },
    exclusiveFilter: embed
      ? (frame) => frame.tag === "div" && (frame.attribs["data-type"] !== "html-embed" || !frame.attribs["data-html"] || frame.attribs["data-html"].length > EMBED_MAX_HTML)
      : undefined,
    allowedStyles: {
      "*": {
        "text-align": [/^(left|right|center|justify)$/],
        color: [HEX_OR_INHERIT],
        "background-color": [HEX_OR_INHERIT],
        "font-family": [FONT_FAMILY],
        "font-size": [FONT_SIZE],
      },
      figure: { width: [PERCENT_WIDTH] },
    },
    allowedClasses: {
      figure: ["rte-figure", "align-left", "align-center", "align-right"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
    transformTags: {
      div: (tagName, attribs) => ({ tagName, attribs: { ...attribs, "data-height": String(clampEmbedHeight(attribs["data-height"])) } }),
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: "noopener noreferrer", ...(attribs.target ? { target: "_blank" } : {}) },
      }),
    },
  });
}

const decodeAttr = (value: string) => value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
const encodeAttr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/**
 * Sanitizes a stored rich-text body for public display and turns each HTML-embed
 * block into a sandboxed iframe (scripts allowed, but isolated from the site).
 */
export function renderRichText(html: string): string {
  return sanitizeRichText(html, { allowEmbed: true }).replace(/<div([^>]*)><\/div>/g, (whole, attrs: string) => {
    const raw = /data-html="([^"]*)"/.exec(attrs)?.[1];
    if (raw === undefined) return whole;
    const height = clampEmbedHeight(/data-height="(\d+)"/.exec(attrs)?.[1]);
    const doc = buildEmbedDoc(decodeAttr(raw));
    return `<iframe class="rte-embed" sandbox="${EMBED_SANDBOX}" referrerpolicy="no-referrer" loading="lazy" allow="fullscreen; autoplay; encrypted-media; picture-in-picture" allowfullscreen style="height:${height}px" srcdoc="${encodeAttr(doc)}"></iframe>`;
  });
}
