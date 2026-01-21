"use client";

import { useState, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { SpellCheckerControls } from "./SpellCheckerControls";
import { ContextMenu } from "./ContextMenu";
import type { SpellCheckerStorage } from "../types";
import { useSpellCheckerExtension } from "../hooks/useSpellCheckerExtension";

interface SpellCheckerUIProps {
  editor: Editor | null;
}

/**
 * SpellCheckerUI component that automatically detects and renders spellchecker UI
 * when SpellCheckerExtension is present in the editor's extensions
 */
export function SpellCheckerUI({ editor }: SpellCheckerUIProps) {
  // Find the spellchecker extension using custom hook
  const extension = useSpellCheckerExtension(editor);

  // Get storage from extension
  const storage = extension?.storage as SpellCheckerStorage | undefined;

  // Compute initial value safely - default to English
  const getInitialValue = useCallback((): "off" | "en" | "de" => {
    if (!extension) return "en";
    const enabled = extension.options?.enabled ?? storage?.enabled ?? true;
    const language = extension.options?.language ?? storage?.language ?? "en";
    return enabled ? language : "off";
  }, [extension, storage]);

  // Optimistic state management - use local state as source of truth
  // This ensures the UI updates immediately when user selects an option
  const [localValue, setLocalValue] = useState<"off" | "en" | "de">(getInitialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Sync with extension state only on mount
  useEffect(() => {
    if (!extension) return;
    setLocalValue(getInitialValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Unified handler for spellchecker state changes
  const handleSpellcheckerChange = useCallback(
    async (value: "off" | "en" | "de") => {
      // Prevent rapid switching - if already switching, ignore new request
      if (isSwitching || !extension) {
        return;
      }

      // Optimistic update - update UI immediately
      setLocalValue(value);
      setIsLoading(true);
      setIsSwitching(true);

      try {
        if (value === "off") {
          // Disable spellchecker
          if (editor && "toggleSpellChecker" in editor.commands) {
            (
              editor.commands as unknown as {
                toggleSpellChecker: (enabled: boolean) => void;
              }
            ).toggleSpellChecker(false);
          }
        } else {
          // Select a language - setSpellCheckerLanguage handles enabling automatically
          // No need to call toggleSpellChecker(true) first - that would double-increment generation
          if (editor && "setSpellCheckerLanguage" in editor.commands) {
            await (
              editor.commands as unknown as {
                setSpellCheckerLanguage: (lang: string) => Promise<void>;
              }
            ).setSpellCheckerLanguage(value);
          }
        }
      } catch (error) {
        console.error("Failed to change spellchecker state:", error);
        // Revert optimistic update on error
        const currentEnabled =
          extension.options?.enabled ?? storage?.enabled ?? true;
        const currentLanguage =
          extension.options?.language ?? storage?.language ?? "en";
        const revertValue: "off" | "en" | "de" = currentEnabled
          ? currentLanguage
          : "off";
        setLocalValue(revertValue);
      } finally {
        setIsLoading(false);
        // Small delay before allowing next switch to prevent rapid toggling
        setTimeout(() => {
          setIsSwitching(false);
        }, 200);
      }
    },
    [editor, extension, storage, isSwitching],
  );

  // If extension not found, don't render anything
  if (!extension) {
    return null;
  }

  return (
    <>
      <SpellCheckerControls
        value={localValue}
        onChange={handleSpellcheckerChange}
        isLoading={isLoading}
      />
      <ContextMenu editor={editor} />
    </>
  );
}
