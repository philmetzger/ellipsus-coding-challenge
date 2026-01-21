'use client'

import { useEffect } from 'react'
import { useEditor as useTiptapEditor } from '@tiptap/react'
import { UseEditorOptions, UseEditorReturn } from '../types/editor.types'
import { getExtensions } from '../utils/getExtensions'
import { defaultEditorProps } from '../utils/editorConfig'

/**
 * Custom hook for managing Tiptap editor instance
 * @param options - Configuration options for the editor
 * @returns Editor instance and utilities
 */
export const useEditor = ({
  content,
  extensions = [],
  placeholder,
  onUpdate,
}: UseEditorOptions): UseEditorReturn => {
  const editor = useTiptapEditor({
    extensions: getExtensions(extensions, placeholder),
    content: content || '',
    ...defaultEditorProps,
  })

  // Handle content updates
  useEffect(() => {
    if (!editor || !onUpdate) return

    const handleUpdate = () => {
      if (editor.isEmpty) {
        onUpdate('')
      } else {
        onUpdate(JSON.stringify(editor.getJSON()))
      }
    }

    editor.on('update', handleUpdate)

    return () => {
      editor.off('update', handleUpdate)
    }
  }, [editor, onUpdate])

  // Clear content if content prop is empty
  useEffect(() => {
    if (!content && editor && !editor.isDestroyed) {
      editor.commands?.clearContent()
    }
  }, [content, editor])

  return { editor }
}
