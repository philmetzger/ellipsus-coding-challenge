import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Extension } from '@tiptap/react'
import { defaultEditorConfig } from './editorConfig'

/**
 * Get base extensions (StarterKit)
 * @returns Array of base Tiptap extensions
 */
export const getBaseExtensions = (): Extension[] => {
  return [StarterKit]
}

/**
 * Configure placeholder extension
 * @param placeholder - Placeholder text
 * @returns Configured Placeholder extension
 */
export const configurePlaceholder = (placeholder?: string): Extension => {
  return Placeholder.configure({
    placeholder: placeholder || defaultEditorConfig.defaultPlaceholder,
  })
}

/**
 * Get all extensions including placeholder
 * @param additionalExtensions - Additional extensions to include
 * @param placeholder - Placeholder text
 * @returns Array of all Tiptap extensions
 */
export const getExtensions = (
  additionalExtensions: Extension[] = [],
  placeholder?: string
): Extension[] => {
  const baseExtensions = getBaseExtensions()
  const placeholderExtension = configurePlaceholder(placeholder)
  
  return [...baseExtensions, placeholderExtension, ...additionalExtensions]
}
