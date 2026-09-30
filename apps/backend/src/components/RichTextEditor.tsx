"use client";

import { Highlight } from "@tiptap/extension-highlight";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { TextAlign } from "@tiptap/extension-text-align";
import { Color, FontFamily, FontSize, TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { toast } from "@/lib/toast";

import { Figure } from "./richtext/Figure";

type RichTextEditorProps = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  minHeight?: number;
  /** Blocks form submission while the body is empty, with the same red marking as other required fields. */
  required?: boolean;
};

const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Monospace", value: "'Courier New', ui-monospace, monospace" },
] as const;

const FONT_SIZES = [
  { label: "Default", value: "" },
  { label: "Small", value: "13px" },
  { label: "Normal", value: "16px" },
  { label: "Large", value: "20px" },
  { label: "X-Large", value: "28px" },
] as const;

const BLOCKS = [
  { label: "Paragraph", value: "p" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Heading 4", value: "h4" },
] as const;

const I = {
  undo: <path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />,
  redo: <path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" />,
  bold: <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" />,
  italic: <path d="M14 5h-4M14 19h-4M14 5l-4 14" transform="translate(1 0)" />,
  underline: <path d="M7 4v7a5 5 0 0 0 10 0V4M5 20h14" />,
  strike: <path d="M5 12h14M16 6.5A4 3 0 0 0 12 5c-2.5 0-4 1.3-4 3 0 3.5 8 2.5 8 7 0 1.8-1.7 3-4 3a5 5 0 0 1-4.5-2" />,
  bullet: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  ordered: <path d="M10 6h10M10 12h10M10 18h10M4 5l1.5-1V9M4 14.5a1.5 1.5 0 0 1 3 0c0 1.5-3 2-3 3.5h3" />,
  quote: <path d="M7 7h4v5c0 3-2 5-4 5M14 7h4v5c0 3-2 5-4 5" />,
  rule: <path d="M4 12h16" />,
  code: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" />,
  indent: (
    <>
      <path d="M4 6h16M10 12h10M10 18h10" />
      <rect x="4" y="10" width="4" height="4" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  outdent: (
    <>
      <path d="M4 6h16M4 12h10M4 18h10" />
      <rect x="16" y="10" width="4" height="4" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  alignLeft: <path d="M4 6h16M4 12h10M4 18h14" />,
  alignCenter: <path d="M4 6h16M7 12h10M5 18h14" />,
  alignRight: <path d="M4 6h16M10 12h10M6 18h14" />,
  alignJustify: <path d="M4 6h16M4 12h16M4 18h16" />,
  link: <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />,
  unlink: <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66M4 4l16 16" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M3 15h18M9 4v16M15 4v16" />
    </>
  ),
  clear: <path d="M6 5h12M12 5l-3 14M4 20l16-16" />,
  reset: <path d="M6 6l12 12M18 6L6 18" />,
};

function ToolButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={active ? "active" : undefined}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

function Toolbar({ editor, onPickImage, uploading }: { editor: Editor; onPickImage: () => void; uploading: boolean }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: e.isActive("heading", { level: 1 })
        ? "h1"
        : e.isActive("heading", { level: 2 })
          ? "h2"
          : e.isActive("heading", { level: 3 })
            ? "h3"
            : e.isActive("heading", { level: 4 })
              ? "h4"
              : "p",
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      canIndent: e.can().sinkListItem("listItem"),
      canOutdent: e.can().liftListItem("listItem"),
      link: e.isActive("link"),
      left: e.isActive({ textAlign: "left" }),
      center: e.isActive({ textAlign: "center" }),
      right: e.isActive({ textAlign: "right" }),
      justify: e.isActive({ textAlign: "justify" }),
      inTable: e.isActive("table"),
      color: (e.getAttributes("textStyle").color as string | undefined) ?? "",
      highlight: (e.getAttributes("highlight").color as string | undefined) ?? "",
      fontFamily: (e.getAttributes("textStyle").fontFamily as string | undefined) ?? "",
      fontSize: (e.getAttributes("textStyle").fontSize as string | undefined) ?? "",
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  function setLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL (leave empty to remove)", previous ?? "https://");
    if (url === null) return;
    if (!url.trim() || url.trim() === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  return (
    <div className="rte-toolbar" role="toolbar" aria-label="Formatting">
      <ToolButton label="Undo" disabled={!s.canUndo} onClick={() => editor.chain().focus().undo().run()}>{I.undo}</ToolButton>
      <ToolButton label="Redo" disabled={!s.canRedo} onClick={() => editor.chain().focus().redo().run()}>{I.redo}</ToolButton>
      <span className="rte-sep" />
      <select
        aria-label="Text style"
        className="rte-block"
        value={s.block}
        onChange={(e) => {
          const v = e.target.value;
          const chain = editor.chain().focus();
          if (v === "p") chain.setParagraph().run();
          else chain.toggleHeading({ level: Number(v.slice(1)) as 1 | 2 | 3 | 4 }).run();
        }}
      >
        {BLOCKS.map((b) => (
          <option key={b.value} value={b.value}>
            {b.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Font family"
        className="rte-block"
        value={s.fontFamily}
        onChange={(e) => {
          const v = e.target.value;
          if (v) editor.chain().focus().setFontFamily(v).run();
          else editor.chain().focus().unsetFontFamily().run();
        }}
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.label} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Font size"
        className="rte-block"
        value={s.fontSize}
        onChange={(e) => {
          const v = e.target.value;
          if (v) editor.chain().focus().setFontSize(v).run();
          else editor.chain().focus().unsetFontSize().run();
        }}
      >
        {FONT_SIZES.map((f) => (
          <option key={f.label} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <span className="rte-sep" />
      <ToolButton label="Bold" active={s.bold} onClick={() => editor.chain().focus().toggleBold().run()}>{I.bold}</ToolButton>
      <ToolButton label="Italic" active={s.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>{I.italic}</ToolButton>
      <ToolButton label="Underline" active={s.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>{I.underline}</ToolButton>
      <ToolButton label="Strikethrough" active={s.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>{I.strike}</ToolButton>
      <span className="rte-color" title="Text colour">
        <input
          type="color"
          aria-label="Text colour"
          value={s.color || "#12181b"}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        />
      </span>
      <button type="button" title="Remove text colour" aria-label="Remove text colour" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().unsetColor().run()}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          {I.reset}
        </svg>
      </button>
      <span className="rte-color highlight" title="Highlight colour">
        <input
          type="color"
          aria-label="Highlight colour"
          value={s.highlight || "#fff3b0"}
          onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
        />
      </span>
      <button type="button" title="Remove highlight" aria-label="Remove highlight" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().unsetHighlight().run()}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          {I.reset}
        </svg>
      </button>
      <span className="rte-sep" />
      <ToolButton label="Bulleted list" active={s.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}>{I.bullet}</ToolButton>
      <ToolButton label="Numbered list" active={s.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}>{I.ordered}</ToolButton>
      <ToolButton label="Decrease indent" disabled={!s.canOutdent} onClick={() => editor.chain().focus().liftListItem("listItem").run()}>{I.outdent}</ToolButton>
      <ToolButton label="Increase indent (nest this list item)" disabled={!s.canIndent} onClick={() => editor.chain().focus().sinkListItem("listItem").run()}>{I.indent}</ToolButton>
      <ToolButton label="Quote" active={s.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>{I.quote}</ToolButton>
      <ToolButton label="Code block" active={s.codeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>{I.code}</ToolButton>
      <ToolButton label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>{I.rule}</ToolButton>
      <span className="rte-sep" />
      <ToolButton label="Align left" active={s.left} onClick={() => editor.chain().focus().setTextAlign("left").run()}>{I.alignLeft}</ToolButton>
      <ToolButton label="Align center" active={s.center} onClick={() => editor.chain().focus().setTextAlign("center").run()}>{I.alignCenter}</ToolButton>
      <ToolButton label="Align right" active={s.right} onClick={() => editor.chain().focus().setTextAlign("right").run()}>{I.alignRight}</ToolButton>
      <ToolButton label="Justify" active={s.justify} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>{I.alignJustify}</ToolButton>
      <span className="rte-sep" />
      <ToolButton label="Insert link" active={s.link} onClick={setLink}>{I.link}</ToolButton>
      <ToolButton label="Remove link" disabled={!s.link} onClick={() => editor.chain().focus().unsetLink().run()}>{I.unlink}</ToolButton>
      <ToolButton label={uploading ? "Uploading image…" : "Insert image"} disabled={uploading} onClick={onPickImage}>{I.image}</ToolButton>
      <ToolButton label="Insert table" active={s.inTable} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>{I.table}</ToolButton>
      <ToolButton label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>{I.clear}</ToolButton>
      {s.inTable && (
        <div className="rte-table-tools">
          <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()}>+ Row</button>
          <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Column</button>
          <button type="button" onClick={() => editor.chain().focus().deleteRow().run()}>Delete row</button>
          <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()}>Delete column</button>
          <button type="button" className="danger" onClick={() => editor.chain().focus().deleteTable().run()}>Delete table</button>
        </div>
      )}
    </div>
  );
}

/**
 * Full rich-text editor (TipTap): headings, lists (with indent/outdent),
 * quotes, code blocks, text/highlight colour, font family & size, links,
 * captioned images, tables and alignment (including justify). Stores HTML in
 * a hidden input under `name`, so it drops into server-action forms
 * unchanged. The server sanitizes the HTML on save.
 */
export function RichTextEditor({ name, defaultValue = "", placeholder, minHeight = 260, required }: RichTextEditorProps) {
  const [html, setHtml] = useState(defaultValue);
  const [text, setText] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const validatorRef = useRef<HTMLTextAreaElement>(null);

  // The shared Toaster marks the hidden validator and adds a message after it;
  // clear both as soon as the body has content again.
  useEffect(() => {
    const v = validatorRef.current;
    if (!text || !v) return;
    v.classList.remove("field-invalid");
    const next = v.nextElementSibling;
    if (next instanceof HTMLElement && next.dataset.fieldError) next.remove();
  }, [text]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } },
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      Figure,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: defaultValue,
    editorProps: { attributes: { class: "rte-body", style: `min-height:${minHeight}px` } },
    onCreate: ({ editor: e }) => setText(e.getText().trim()),
    onUpdate: ({ editor: e }) => {
      setHtml(e.isEmpty ? "" : e.getHTML());
      const t = e.getText().trim() || (e.getHTML().includes("<img") ? "image" : "");
      setText(t);
      if (t) setInvalid(false);
    },
  });

  async function uploadImage(file: File | undefined) {
    if (!file || !editor) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      editor.chain().focus().setFigure({ src: json.data.url, alt: file.name.replace(/\.[^.]+$/, "") }).run();
    } catch {
      toast("error", "Image upload failed. Please try again.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className={`rte${invalid ? " field-invalid" : ""}`}>
      <input type="hidden" name={name} value={html} />
      {editor && <Toolbar editor={editor} uploading={uploading} onPickImage={() => fileRef.current?.click()} />}
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => uploadImage(e.target.files?.[0])} />
      <EditorContent editor={editor} />
      {required && (
        <textarea
          ref={validatorRef}
          className="rte-validator"
          required
          value={text}
          onChange={() => undefined}
          tabIndex={-1}
          aria-hidden="true"
          onInvalid={() => {
            setInvalid(true);
            editor?.commands.focus();
          }}
        />
      )}
    </div>
  );
}
