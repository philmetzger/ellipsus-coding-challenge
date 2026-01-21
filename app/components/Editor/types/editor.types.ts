import { Extension } from '@tiptap/react'

/**
 * Editor size options
 */
export type EditorSize = 's' | 'm' | 'l'

/**
 * Props for the main Editor component
 */
export interface EditorProps {
  /** Initial content for the editor */
  content?: string
  /** Callback function called when editor content updates */
  onUpdate?: (content: string) => void
  /** Additional Tiptap extensions to include */
  extensions?: Extension[]
  /** Placeholder text shown when editor is empty */
  placeholder?: string
  /** Size of the editor */
  size?: EditorSize
  /** Additional CSS classes */
  className?: string
}

/**
 * Configuration options for editor initialization
 */
export interface EditorConfig {
  /** Default placeholder text */
  defaultPlaceholder: string
  /** Default editor size */
  defaultSize: EditorSize
  /** Editor class name */
  editorClassName: string
}

/**
 * Options for useEditor hook
 */
export interface UseEditorOptions {
  /** Initial content for the editor */
  content?: string
  /** Additional Tiptap extensions */
  extensions?: Extension[]
  /** Placeholder text */
  placeholder?: string
  /** Callback function for content updates */
  onUpdate?: (content: string) => void
}

/**
 * Return type from useEditor hook
 */
export interface UseEditorReturn {
  /** Tiptap editor instance */
  editor: ReturnType<typeof import('@tiptap/react').useEditor> | null
}

/**
 * Props for EditorPlaceholder component
 */
export interface EditorPlaceholderProps {
  /** Placeholder text to display */
  placeholder?: string
  /** Size of the placeholder */
  size?: EditorSize
}

/**
 * Props for EditorContentWrapper component
 */
export interface EditorContentWrapperProps {
  /** Child elements to wrap */
  children: React.ReactNode
  /** Paragraph spacing option */
  paragraphSpacing?: 'none' | 's' | 'm' | 'l'
  /** Size of the content */
  size?: 's' | 'm'
}
