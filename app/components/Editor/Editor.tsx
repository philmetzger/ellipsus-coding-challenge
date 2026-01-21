"use client";

import React, { useEffect } from "react";
import { EditorContent } from "@tiptap/react";
import { EditorProps } from "./types/editor.types";
import { useEditorMount } from "./hooks/useEditorMount";
import { useEditor } from "./hooks/useEditor";
import { EditorPlaceholder } from "./EditorPlaceholder";
import { defaultEditorConfig } from "./utils/editorConfig";
import { SpellCheckerWrapper } from "./extensions/SpellChecker/SpellCheckerWrapper";

/**
 * Main Editor component
 * A clean, extensible Tiptap editor with SSR support
 */
export const Editor = ({
  content,
  onUpdate,
  extensions = [],
  placeholder = defaultEditorConfig.defaultPlaceholder,
  size = defaultEditorConfig.defaultSize,
  className,
  onEditorReady,
}: EditorProps) => {
  const isMounted = useEditorMount();
  const { editor } = useEditor({
    content,
    extensions,
    placeholder,
    onUpdate,
  });

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  if (!isMounted || !editor) {
    return <EditorPlaceholder placeholder={placeholder} size={size} />;
  }

  return (
    <div className={className}>
      <SpellCheckerWrapper editor={editor}>
        <EditorContent editor={editor} />
      </SpellCheckerWrapper>
    </div>
  );
};

export default Editor;
