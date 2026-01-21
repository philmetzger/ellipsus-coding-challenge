"use client";

import { useEffect, useRef } from "react";
import { CONTEXT_MENU_DELAY_MS } from "../utils/constants";
import { contextMenuStyles, hoverHandlers } from "./styles";
import {
  useSpellCheckerExtension,
  isSpellCheckerEnabled,
} from "../hooks/useSpellCheckerExtension";
import { useSpellCheckerContext } from "./SpellCheckerContext";
import type { Editor } from "@tiptap/react";

interface ContextMenuProps {
  editor: Editor | null;
}

/**
 * ContextMenu component for displaying spelling suggestions
 * Uses React Context for state management (scoped per-editor instance)
 */
export function ContextMenu({ editor }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const justOpenedRef = useRef<boolean>(false);

  // Get context menu state and actions from context
  const spellCheckerContext = useSpellCheckerContext();

  // Find spellchecker extension to check enabled state
  const extension = useSpellCheckerExtension(editor);

  const menuState = spellCheckerContext?.contextMenu ?? null;
  const dismissContextMenu = spellCheckerContext?.dismissContextMenu;
  const fixWord = spellCheckerContext?.fixWord;
  const fixAllInstances = spellCheckerContext?.fixAllInstances;

  // Track when menu is opened to prevent immediate dismissal
  useEffect(() => {
    if (menuState?.visible) {
      justOpenedRef.current = true;
      const timeout = setTimeout(() => {
        justOpenedRef.current = false;
      }, CONTEXT_MENU_DELAY_MS);
      return () => clearTimeout(timeout);
    }
  }, [menuState?.visible]);

  // Handle click outside and scroll to dismiss menu
  useEffect(() => {
    if (!menuState?.visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Ignore right mouse button clicks (button === 2)
      if (event.button === 2) {
        return;
      }

      // Don't dismiss if menu was just opened
      if (justOpenedRef.current) {
        return;
      }

      // Only dismiss if clicking outside the menu
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        dismissContextMenu?.();
      }
    };

    const handleScroll = () => {
      dismissContextMenu?.();
    };

    // Use mouseup instead of mousedown - it fires after contextmenu
    document.addEventListener("mouseup", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mouseup", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [menuState?.visible, dismissContextMenu]);

  // Dismiss menu when spellchecker is disabled
  useEffect(() => {
    const isEnabled = isSpellCheckerEnabled(extension);
    if (!isEnabled && menuState?.visible) {
      dismissContextMenu?.();
    }
  }, [extension, menuState?.visible, dismissContextMenu]);

  const handleFix = (suggestion: string) => {
    if (!menuState?.wordRange) return;
    const { from, to } = menuState.wordRange;
    fixWord?.(from, to, suggestion);
  };

  const handleFixAll = (suggestion: string) => {
    if (!menuState?.word) return;
    fixAllInstances?.(menuState.word, suggestion);
  };

  // Check enabled state before showing menu
  const isEnabled = isSpellCheckerEnabled(extension);

  // Show menu if visible and enabled, even if suggestions are empty (will show "No suggestions available")
  if (!menuState?.visible || !isEnabled) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="spellcheck-context-menu"
      style={{
        ...contextMenuStyles.container,
        top: `${menuState.position.y}px`,
        left: `${menuState.position.x}px`,
      }}
    >
      {/* Header */}
      <div style={contextMenuStyles.header}>Did you mean:</div>

      {/* Suggestions */}
      {menuState.suggestions.length > 0 ? (
        <div style={contextMenuStyles.suggestionsContainer}>
          {menuState.suggestions.map((suggestion, index) => (
            <div key={index} style={contextMenuStyles.suggestionRow}>
              <span style={contextMenuStyles.suggestionText}>{suggestion}</span>
              <div style={contextMenuStyles.buttonGroup}>
                <button
                  onClick={() => handleFix(suggestion)}
                  style={contextMenuStyles.actionButton}
                  onMouseEnter={hoverHandlers.actionButton.onMouseEnter}
                  onMouseLeave={hoverHandlers.actionButton.onMouseLeave}
                >
                  Fix
                </button>
                <button
                  onClick={() => handleFixAll(suggestion)}
                  style={contextMenuStyles.actionButton}
                  onMouseEnter={hoverHandlers.actionButton.onMouseEnter}
                  onMouseLeave={hoverHandlers.actionButton.onMouseLeave}
                >
                  Fix all
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={contextMenuStyles.noSuggestions}>
          No suggestions available
        </div>
      )}
    </div>
  );
}
