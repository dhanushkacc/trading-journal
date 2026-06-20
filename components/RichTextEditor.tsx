"use client";

import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  Baseline,
  Eraser,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/**
 * Lightweight, dependency-free rich-text editor.
 * A contentEditable surface + a compact toolbar driven by document.execCommand.
 * execCommand is deprecated but universally supported — chosen to avoid new deps.
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Add a point... (use the toolbar to format)",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync external value into the DOM only when it differs (avoids caret jumps).
  useEffect(() => {
    const el = editorRef.current;
    if (el && el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const emit = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  // Run a command while preserving the current selection. Buttons use
  // onMouseDown + preventDefault so the editor never loses focus.
  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <button
          type="button"
          title="Bold"
          className="rte-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("bold");
          }}
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          title="Italic"
          className="rte-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("italic");
          }}
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          title="Underline"
          className="rte-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("underline");
          }}
        >
          <Underline size={15} />
        </button>

        {/* Text color */}
        <label className="rte-btn rte-color" title="Text color">
          <Baseline size={15} />
          <input
            type="color"
            defaultValue="#3b82f6"
            onChange={(e) => exec("foreColor", e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </label>

        {/* Highlight */}
        <label className="rte-btn rte-color" title="Highlight color">
          <Highlighter size={15} />
          <input
            type="color"
            defaultValue="#fde047"
            onChange={(e) => exec("hiliteColor", e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </label>

        <span className="rte-divider" />
        <button
          type="button"
          title="Clear formatting"
          className="rte-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("removeFormat");
          }}
        >
          <Eraser size={15} />
        </button>
      </div>

      <div
        ref={editorRef}
        className="rte-editor"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
      />
    </div>
  );
}
