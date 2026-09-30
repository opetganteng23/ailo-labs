import sanitize from "sanitize-html";

const HEX_OR_INHERIT = /^(#[0-9a-fA-F]{3,8}|inherit)$/;
const FONT_FAMILY = /^[a-zA-Z0-9\s,'-]{1,120}$/;
const FONT_SIZE = /^\d{1,3}(\.\d+)?(px|em|rem|%)$/;
const PERCENT_WIDTH = /^\d{1,3}%$/;

/**
 * Whitelist for rich-text bodies (news, research, projects). Everything the
 * editor can produce is allowed; scripts, event handlers, iframes, and
 * javascript: URLs are stripped (XSS). Style values are validated, not just
 * whitelisted by property name, so e.g. `color` can't smuggle a url(...).
 */
export function sanitizeRichText(html: string): string {
  return sanitize(html ?? "", {
    allowedTags: [
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
    },
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
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: "noopener noreferrer", ...(attribs.target ? { target: "_blank" } : {}) },
      }),
    },
  });
}
