"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Editor } from "@tiptap/react";
import type { ContextMenuState, SpellCheckerStorage } from "../types";

/**
 * Context value interface for SpellChecker
 * Provides context menu state and actions scoped to a single editor instance
 */
export interface SpellCheckerContextValue {
  /** Current context menu state, or null if menu is closed */
  contextMenu: ContextMenuState | null;
  /** Dismiss the context menu */
  dismissContextMenu: () => void;
  /** Fix a single word at the given position */
  fixWord: (from: number, to: number, replacement: string) => void;
  /** Fix all instances of a word in the document */
  fixAllInstances: (word: string, replacement: string) => void;
}

/**
 * SpellChecker context - scoped to each editor instance
 */
const SpellCheckerContext = createContext<SpellCheckerContextValue | null>(
  null
);

interface SpellCheckerProviderProps {
  editor: Editor | null;
  children: ReactNode;
}

/**
 * SpellCheckerProvider - provides context menu state and actions for a single editor instance
 *
 * This replaces window events with React Context for proper scoping when multiple
 * editors exist on the same page.
 */
export function SpellCheckerProvider({
  editor,
  children,
}: SpellCheckerProviderProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Listen for DOM events as fallback (in case callback registration fails)
  useEffect(() => {
    const handleContextMenuEvent = (event: Event) => {
      const customEvent = event as CustomEvent<ContextMenuState>;
      setContextMenu(customEvent.detail);
    };

    document.addEventListener('spellchecker-context-menu', handleContextMenuEvent);

    return () => {
      document.removeEventListener('spellchecker-context-menu', handleContextMenuEvent);
    };
  }, []);

  // Also try to register callback with extension storage
  useEffect(() => {
    if (!editor) return;

    const extension = editor.extensionManager?.extensions?.find(
      (ext) => ext.name === "spellChecker"
    );

    if (!extension) return;

    const storage = extension.storage as SpellCheckerStorage | undefined;
    if (storage) {
      // Register our state setter as the callback
      storage.onContextMenuChange = setContextMenu;
    }

    return () => {
      if (storage) {
        storage.onContextMenuChange = undefined;
      }
    };
  }, [editor]);

  // Dismiss context menu
  const dismissContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Fix a single word
  const fixWord = useCallback(
    (from: number, to: number, replacement: string) => {
      if (!editor) return;

      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .deleteSelection()
        .insertContent(replacement)
        .run();

      setContextMenu(null);
    },
    [editor]
  );

  // Fix all instances of a word
  const fixAllInstances = useCallback(
    (word: string, replacement: string) => {
      if (!editor) return;

      if ("replaceAllInstances" in editor.commands) {
        (
          editor.commands as {
            replaceAllInstances: (word: string, replacement: string) => void;
          }
        ).replaceAllInstances(word, replacement);
      }

      setContextMenu(null);
    },
    [editor]
  );

  const value: SpellCheckerContextValue = {
    contextMenu,
    dismissContextMenu,
    fixWord,
    fixAllInstances,
  };

  return (
    <SpellCheckerContext.Provider value={value}>
      {children}
    </SpellCheckerContext.Provider>
  );
}

/**
 * Hook to access SpellChecker context
 * Must be used within a SpellCheckerProvider
 */
export function useSpellCheckerContext(): SpellCheckerContextValue | null {
  return useContext(SpellCheckerContext);
}
