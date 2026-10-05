import sanitize from "sanitize-html";

// The browser re-serializes colours as rgb()/rgba() when TipTap reads them back from the DOM, so hex alone would strip every colour on save.
const HEX_OR_INHERIT = /^(#[0-9a-fA-F]{3,8}|inherit|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/;
const FONT_FAMILY = /^[a-zA-Z0-9\s,'-]{1,120}$/;
const FONT_SIZE = /^\d{1,3}(\.\d+)?(px|em|rem|%)$/;
const PERCENT_WIDTH = /^\d{1,3}%$/;

// Extra values for the trusted (admin "HTML source") profile. None of them can load a resource or run code.
const LEN = "-?\\d{1,4}(?:\\.\\d+)?(?:px|em|rem|%|vh|vw)?";
const SIDES = new RegExp(`^(?:auto|${LEN})(?:\\s+(?:auto|${LEN})){0,3}$`);
const SIZE = new RegExp(`^(?:auto|none|fit-content|${LEN})$`);
const COLOR_OR_NAME = new RegExp(`${HEX_OR_INHERIT.source}|^(?:transparent|currentcolor|[a-z]{3,20})$`);
const SAFE_VALUE = /^(?!.*(?:url|expression|javascript|var\())[\w\s.,#()%/+*-]{1,160}$/i;
const BORDER = /^\d{1,2}px\s+(?:solid|dashed|dotted|double|none)\s+(?:#[0-9a-fA-F]{3,8}|rgba?\([\d\s.,]+\)|[a-z]{3,20})$/;

const TRUSTED_STYLES = {
  "text-align": [/^(left|right|center|justify)$/],
  color: [COLOR_OR_NAME],
  "background-color": [COLOR_OR_NAME],
  background: [SAFE_VALUE],
  "font-family": [FONT_FAMILY],
  "font-size": [FONT_SIZE, /^(?:x-small|small|medium|large|x-large|xx-large)$/],
  "font-weight": [/^(?:normal|bold|bolder|lighter|[1-9]00)$/],
  "font-style": [/^(?:normal|italic)$/],
  "line-height": [/^(?:normal|\d(?:\.\d+)?|\d{1,3}(?:\.\d+)?(?:px|em|rem|%))$/],
  "letter-spacing": [new RegExp(`^${LEN}$`)],
  "text-transform": [/^(?:none|uppercase|lowercase|capitalize)$/],
  "text-decoration": [/^(?:none|underline|line-through)$/],
  "white-space": [/^(?:normal|nowrap|pre-wrap)$/],
  "vertical-align": [/^(?:baseline|top|middle|bottom)$/],
  margin: [SIDES],
  "margin-top": [SIDES],
  "margin-right": [SIDES],
  "margin-bottom": [SIDES],
  "margin-left": [SIDES],
  padding: [SIDES],
  "padding-top": [SIDES],
  "padding-right": [SIDES],
  "padding-bottom": [SIDES],
  "padding-left": [SIDES],
  width: [SIZE],
  "max-width": [SIZE],
  "min-width": [SIZE],
  height: [SIZE],
  "max-height": [SIZE],
  "min-height": [SIZE],
  "aspect-ratio": [/^\d{1,3}\s*\/\s*\d{1,3}$/],
  display: [/^(?:block|inline|inline-block|flex|inline-flex|grid|none)$/],
  "flex-direction": [/^(?:row|column|row-reverse|column-reverse)$/],
  "flex-wrap": [/^(?:nowrap|wrap|wrap-reverse)$/],
  "justify-content": [/^(?:flex-start|flex-end|center|space-between|space-around|space-evenly|start|end)$/],
  "align-items": [/^(?:flex-start|flex-end|center|stretch|baseline|start|end)$/],
  gap: [SIDES],
  "row-gap": [SIDES],
  "column-gap": [SIDES],
  flex: [/^(?:\d{1,3}(?:\s+\d{1,3})?(?:\s+(?:auto|[\d.]+(?:px|%)))?|auto|none)$/],
  "grid-template-columns": [SAFE_VALUE],
  border: [BORDER],
  "border-top": [BORDER],
  "border-right": [BORDER],
  "border-bottom": [BORDER],
  "border-left": [BORDER],
  "border-radius": [SIDES],
  "box-shadow": [SAFE_VALUE],
  opacity: [/^(?:0|1|0?\.\d+)$/],
  overflow: [/^(?:visible|hidden|auto)$/],
  "object-fit": [/^(?:contain|cover|fill|none)$/],
  float: [/^(?:left|right|none)$/],
  clear: [/^(?:left|right|both|none)$/],
};

/** Third-party players and maps that may be embedded as an <iframe> in the trusted profile. */
const IFRAME_HOSTS = [
  "www.youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "www.google.com",
  "maps.google.com",
  "docs.google.com",
  "drive.google.com",
  "www.canva.com",
  "open.spotify.com",
  "www.figma.com",
];

const SAFE_ID = /^[A-Za-z][\w-]{0,60}$/;

/**
 * Whitelist for rich-text bodies (news, research, projects, services).
 * Scripts, event handlers and javascript: URLs are always stripped (XSS).
 * Style values are validated, not just whitelisted by property name, so e.g.
 * `color` can't smuggle a url(...).
 *
 * The default profile is what the visual editor can produce. The `trusted`
 * profile is for admins who edit the HTML source directly: it also keeps
 * layout markup (div, section, classes, ids, layout styles), video/audio and
 * iframes from a short list of known embed hosts, but still no script,
 * forms, event handlers, position/z-index or url()-based styles.
 */
export function sanitizeRichText(html: string, options: { trusted?: boolean } = {}): string {
  const trusted = Boolean(options.trusted);
  return sanitize(html ?? "", {
    allowedTags: [
      "p", "br", "h1", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "del", "a", "span", "mark",
      "ul", "ol", "li", "blockquote", "hr", "img", "figure", "figcaption", "pre", "code",
      "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col",
      ...(trusted
        ? ["div", "section", "article", "aside", "header", "footer", "h5", "h6", "small", "sub", "sup", "abbr", "cite", "kbd", "caption", "tfoot", "dl", "dt", "dd", "details", "summary", "video", "audio", "source", "iframe"]
        : []),
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "loading", ...(trusted ? ["width", "height"] : [])],
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
      ...(trusted
        ? {
            "*": ["class", "id", "style", "title", "lang", "dir", "aria-label", "role"],
            video: ["src", "controls", "poster", "preload", "width", "height", "muted", "loop", "playsinline"],
            audio: ["src", "controls", "preload", "loop"],
            source: ["src", "type"],
            iframe: ["src", "width", "height", "title", "allowfullscreen", "loading", "frameborder", "sandbox", "referrerpolicy"],
            details: ["open"],
          }
        : {}),
    },
    allowedStyles: trusted
      ? { "*": TRUSTED_STYLES, figure: { width: [PERCENT_WIDTH] } }
      : {
          "*": {
            "text-align": [/^(left|right|center|justify)$/],
            color: [HEX_OR_INHERIT],
            "background-color": [HEX_OR_INHERIT],
            "font-family": [FONT_FAMILY],
            "font-size": [FONT_SIZE],
          },
          figure: { width: [PERCENT_WIDTH] },
        },
    allowedClasses: trusted ? undefined : { figure: ["rte-figure", "align-left", "align-center", "align-right"] },
    // An iframe whose src was rejected (unknown host) is dropped entirely instead of leaving an empty frame.
    exclusiveFilter: (frame) => frame.tag === "iframe" && !frame.attribs.src,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https"], video: ["http", "https"], audio: ["http", "https"], source: ["http", "https"], iframe: ["https"] },
    allowedIframeHostnames: IFRAME_HOSTS,
    allowProtocolRelative: false,
    transformTags: {
      ...(trusted
        ? {
            "*": (tagName: string, attribs: Record<string, string>) => {
              const next = { ...attribs };
              if (next.id !== undefined && !SAFE_ID.test(next.id)) delete next.id;
              return { tagName, attribs: next };
            },
            iframe: (tagName: string, attribs: Record<string, string>) => ({
              tagName,
              attribs: {
                ...attribs,
                loading: "lazy",
                referrerpolicy: "no-referrer",
                sandbox: "allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox",
              },
            }),
          }
        : {}),
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: "noopener noreferrer", ...(attribs.target ? { target: "_blank" } : {}) },
      }),
    },
  });
}

/** What visitors see: stored bodies are re-sanitized with the trusted profile, so admin-authored layout markup survives. */
export function renderRichText(html: string): string {
  return sanitizeRichText(html, { trusted: true });
}
