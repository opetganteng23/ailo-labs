import sanitize from "sanitize-html";

/**
 * Whitelist for rich-text bodies (news, research, projects). Everything the
 * editor can produce is allowed; scripts, event handlers, iframes, inline
 * styles other than text-align, and javascript: URLs are stripped (XSS).
 */
export function sanitizeRichText(html: string): string {
  return sanitize(html ?? "", {
    allowedTags: [
      "p", "br", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "del", "a",
      "ul", "ol", "li", "blockquote", "hr", "img",
      "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "loading"],
      th: ["colspan", "rowspan", "style"],
      td: ["colspan", "rowspan", "style"],
      p: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
    },
    allowedStyles: {
      "*": { "text-align": [/^(left|right|center|justify)$/] },
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
