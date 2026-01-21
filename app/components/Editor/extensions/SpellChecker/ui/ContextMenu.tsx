'use client'

import { useEffect, useState, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import type { ContextMenuState } from '../types'
import {
  CONTEXT_MENU_DELAY_MS,
  SPELLCHECK_CONTEXT_MENU_EVENT,
  SPELLCHECK_CONTEXT_MENU_DISMISS_EVENT,
} from '../utils/constants'
import { contextMenuStyles, hoverHandlers } from './styles'
import { useSpellCheckerExtension, isSpellCheckerEnabled } from '../hooks/useSpellCheckerExtension'

interface ContextMenuProps {
  editor: Editor | null
}

/**
 * ContextMenu component for displaying spelling suggestions
 * Listens to custom events from the SpellCheckerPlugin
 */
export function ContextMenu({ editor }: ContextMenuProps) {
  const [menuState, setMenuState] = useState<ContextMenuState | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const justOpenedRef = useRef<boolean>(false)

  // Find spellchecker extension to check enabled state
  const extension = useSpellCheckerExtension(editor)

  useEffect(() => {
    if (!editor) return

    const handleContextMenu = (event: CustomEvent<ContextMenuState>) => {
      // Verify extension is still enabled before showing menu
      const currentExtension = editor?.extensionManager?.extensions?.find(
        (ext) => ext.name === 'spellChecker'
      )
      if (!currentExtension?.options?.enabled) {
        return // Don't show menu if disabled
      }
      
      setMenuState(event.detail)
      // Mark that menu was just opened to prevent immediate dismissal
      justOpenedRef.current = true
      // Delay to allow React to render before enabling dismissal
      setTimeout(() => {
        justOpenedRef.current = false
      }, CONTEXT_MENU_DELAY_MS)
    }

    const handleDismiss = () => {
      setMenuState(null)
    }

    // Listen for context menu events
    window.addEventListener(SPELLCHECK_CONTEXT_MENU_EVENT, handleContextMenu as EventListener)
    window.addEventListener(SPELLCHECK_CONTEXT_MENU_DISMISS_EVENT, handleDismiss)

    // Dismiss on outside click
    // Use mouseup instead of mousedown to avoid conflicts with right-click
    // mouseup fires after contextmenu, giving us time to set the flag
    const handleClickOutside = (event: MouseEvent) => {
      // Ignore right mouse button clicks (button === 2)
      if (event.button === 2) {
        return
      }

      // Don't dismiss if menu was just opened
      if (justOpenedRef.current) {
        return
      }

      // Only dismiss if clicking outside the menu
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuState(null)
      }
    }

    // Dismiss on scroll
    const handleScroll = () => {
      setMenuState(null)
    }

    // Use mouseup instead of mousedown - it fires after contextmenu
    document.addEventListener('mouseup', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      window.removeEventListener(SPELLCHECK_CONTEXT_MENU_EVENT, handleContextMenu as EventListener)
      window.removeEventListener(SPELLCHECK_CONTEXT_MENU_DISMISS_EVENT, handleDismiss)
      document.removeEventListener('mouseup', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [editor])

  // Monitor enabled state and dismiss menu when disabled
  useEffect(() => {
    if (!editor) return

    const currentExtension = editor?.extensionManager?.extensions?.find(
      (ext) => ext.name === 'spellChecker'
    )
    
    // Dismiss menu if spellchecker is disabled
    if (!currentExtension?.options?.enabled && menuState) {
      setMenuState(null)
    }
  }, [editor, menuState])

  const handleFix = (suggestion: string) => {
    if (!menuState?.wordRange || !editor) return

    const { from, to } = menuState.wordRange

    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .deleteSelection()
      .insertContent(suggestion)
      .run()

    setMenuState(null)
  }

  const handleFixAll = (suggestion: string) => {
    if (!menuState?.word || !editor) return

    if ('replaceAllInstances' in editor.commands) {
      ;(editor.commands as { replaceAllInstances: (word: string, replacement: string) => void }).replaceAllInstances(menuState.word, suggestion)
    }

    setMenuState(null)
  }

  // Check enabled state before showing menu
  const isEnabled = isSpellCheckerEnabled(extension)
  
  // Show menu if visible and enabled, even if suggestions are empty (will show "No suggestions available")
  if (!menuState?.visible || !isEnabled) {
    return null
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
      <div style={contextMenuStyles.header}>
        Did you mean:
      </div>

      {/* Suggestions */}
      {menuState.suggestions.length > 0 ? (
        <div style={contextMenuStyles.suggestionsContainer}>
          {menuState.suggestions.map((suggestion, index) => (
            <div key={index} style={contextMenuStyles.suggestionRow}>
              <span style={contextMenuStyles.suggestionText}>
                {suggestion}
              </span>
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
  )
}
