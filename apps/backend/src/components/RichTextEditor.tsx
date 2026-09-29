"use client";

import { useEffect, useRef, useState } from "react";

type RichTextEditorProps = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  minHeight?: number;
};

const TOOLS: { command: string; label: string; arg?: string }[] = [
  { command: "bold", label: "B" },
  { command: "italic", label: "I" },
  { command: "formatBlock", label: "H2", arg: "H2" },
  { command: "formatBlock", label: "P", arg: "P" },
  { command: "insertUnorderedList", label: "• List" },
  { command: "insertOrderedList", label: "1. List" },
  { command: "formatBlock", label: "Quote", arg: "BLOCKQUOTE" },
];

/**
 * Minimal contentEditable rich-text field. Stores HTML in a hidden input under
 * `name` so it drops into existing server-action forms unchanged. Uses
 * document.execCommand - deprecated but still broadly supported and the
 * simplest way to get real formatting without pulling in an editor library.
 */
export function RichTextEditor({ name, defaultValue = "", placeholder, minHeight = 220 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue);
  const [empty, setEmpty] = useState(!defaultValue.trim());

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== defaultValue) {
      editorRef.current.innerHTML = defaultValue;
    }
    // Only sync in from defaultValue on mount / explicit prop change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(command: string, arg?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleInput();
  }

  function handleInput() {
    const content = editorRef.current?.innerHTML ?? "";
    setHtml(content);
    setEmpty(!editorRef.current?.textContent?.trim());
  }

  function handleLink() {
    const url = window.prompt("Link URL");
    if (url) exec("createLink", url);
  }

  return (
    <div className="rte">
      <input type="hidden" name={name} value={html} />
      <div className="rte-toolbar" role="toolbar" aria-label="Formatting">
        {TOOLS.map((t) => (
          <button key={t.label} type="button" onClick={() => exec(t.command, t.arg)}>
            {t.label}
          </button>
        ))}
        <button type="button" onClick={handleLink}>
          Link
        </button>
      </div>
      <div className="rte-body-wrap">
        {empty && placeholder && <span className="rte-placeholder">{placeholder}</span>}
        <div
          ref={editorRef}
          className="rte-body"
          contentEditable
          suppressContentEditableWarning
          style={{ minHeight }}
          onInput={handleInput}
          onBlur={handleInput}
        />
      </div>
    </div>
  );
}
