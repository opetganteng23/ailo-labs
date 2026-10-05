import { mergeAttributes, Node } from "@tiptap/core";

import { buildEmbedDoc, clampEmbedHeight, EMBED_DEFAULT_HEIGHT, EMBED_SANDBOX } from "@/lib/htmlEmbed";

/** Fired (bubbling) from a block's "Edit HTML" button; `detail.pos` is the node position. The editor component listens for it. */
export const EMBED_EDIT_EVENT = "rte-embed-edit";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    htmlEmbed: {
      /** Inserts a raw-HTML block, shown to visitors inside a sandboxed iframe. */
      setHtmlEmbed: (options: { html: string; height?: number }) => ReturnType;
    };
  }
}

/** A block holding author-supplied HTML (video embeds, maps, widgets, custom layouts). Stored as `<div data-type="html-embed" data-html="...">`. */
export const HtmlEmbed = Node.create({
  name: "htmlEmbed",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      html: { default: "" },
      height: { default: EMBED_DEFAULT_HEIGHT },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="html-embed"]',
        getAttrs: (el) => ({
          html: (el as HTMLElement).getAttribute("data-html") ?? "",
          height: clampEmbedHeight((el as HTMLElement).getAttribute("data-height")),
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "html-embed", "data-html": node.attrs.html, "data-height": String(node.attrs.height) })];
  },

  addCommands() {
    return {
      setHtmlEmbed:
        ({ html, height }) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { html, height: clampEmbedHeight(height) } }),
    };
  },

  addNodeView() {
    return ({ node, getPos }) => {
      const dom = document.createElement("div");
      dom.className = "rte-embed-node";
      dom.contentEditable = "false";

      const bar = document.createElement("div");
      bar.className = "rte-embed-bar";
      const label = document.createElement("span");
      label.textContent = "HTML embed";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Edit HTML";
      edit.addEventListener("click", () => {
        const pos = getPos();
        if (typeof pos === "number") dom.dispatchEvent(new CustomEvent(EMBED_EDIT_EVENT, { bubbles: true, detail: { pos } }));
      });
      bar.append(label, edit);

      const frame = document.createElement("iframe");
      frame.setAttribute("sandbox", EMBED_SANDBOX);
      frame.setAttribute("referrerpolicy", "no-referrer");
      frame.title = "HTML embed preview";
      frame.style.height = `${clampEmbedHeight(node.attrs.height)}px`;
      frame.srcdoc = buildEmbedDoc(String(node.attrs.html));

      dom.append(bar, frame);
      return {
        dom,
        update: (updated) => {
          if (updated.type.name !== "htmlEmbed") return false;
          frame.style.height = `${clampEmbedHeight(updated.attrs.height)}px`;
          const doc = buildEmbedDoc(String(updated.attrs.html));
          if (frame.srcdoc !== doc) frame.srcdoc = doc;
          return true;
        },
        stopEvent: () => true,
        ignoreMutation: () => true,
      };
    };
  },
});
