"use client";

import { EditorContent } from "@tiptap/react";
import { EditorProps } from "./types/editor.types";
import { useEditorMount } from "./hooks/useEditorMount";
import { useEditor } from "./hooks/useEditor";
import { EditorPlaceholder } from "./EditorPlaceholder";
import { defaultEditorConfig } from "./utils/editorConfig";

/**
 * Main Editor component
 * A clean, extensible Tiptap editor with SSR support
 */
export const Editor = ({
  content,
  onUpdate,
  extensions,
  placeholder = defaultEditorConfig.defaultPlaceholder,
  size = defaultEditorConfig.defaultSize,
  className,
}: EditorProps) => {
  const isMounted = useEditorMount();
  const { editor } = useEditor({
    content,
    extensions,
    placeholder,
    onUpdate,
  });

  if (!isMounted || !editor) {
    return <EditorPlaceholder placeholder={placeholder} size={size} />;
  }

  return (
    <div className={className}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default Editor;
