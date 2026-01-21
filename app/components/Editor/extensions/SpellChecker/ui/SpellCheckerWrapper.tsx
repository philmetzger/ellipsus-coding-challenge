"use client";

import { ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { SpellCheckerProvider } from "./SpellCheckerContext";
import { SpellCheckerUI } from "./SpellCheckerUI";

interface SpellCheckerWrapperProps {
  editor: Editor | null;
  children: ReactNode;
}

/**
 * SpellCheckerWrapper component that wraps EditorContent and automatically
 * renders spellchecker UI if the extension is present.
 *
 * Uses SpellCheckerProvider for scoped context menu state per-editor instance.
 */
export function SpellCheckerWrapper({
  editor,
  children,
}: SpellCheckerWrapperProps) {
  return (
    <SpellCheckerProvider editor={editor}>
      <SpellCheckerUI editor={editor} />
      {children}
    </SpellCheckerProvider>
  );
}
