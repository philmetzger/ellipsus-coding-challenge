import { useMemo } from 'react'
import type { Editor } from '@tiptap/react'
import type { Extension } from '@tiptap/core'
import type { SpellCheckerOptions, SpellCheckerStorage } from '../types'

/**
 * Custom hook to find and access the SpellChecker extension from an editor instance
 * Centralizes the extension lookup logic that was duplicated across components
 * 
 * @param editor - The Tiptap editor instance
 * @returns The SpellChecker extension if found, null otherwise
 */
export function useSpellCheckerExtension(
  editor: Editor | null
): Extension<SpellCheckerOptions, SpellCheckerStorage> | null {
  return useMemo(() => {
    if (!editor) return null
    
    const extension = editor.extensionManager?.extensions?.find(
      (ext) => ext.name === 'spellChecker'
    )
    
    return (extension as Extension<SpellCheckerOptions, SpellCheckerStorage>) ?? null
  }, [editor])
}

/**
 * Check if spellchecker is enabled in the given extension
 * 
 * @param extension - The SpellChecker extension
 * @returns Whether the spellchecker is enabled
 */
export function isSpellCheckerEnabled(
  extension: Extension<SpellCheckerOptions, SpellCheckerStorage> | null
): boolean {
  return extension?.options?.enabled ?? false
}
