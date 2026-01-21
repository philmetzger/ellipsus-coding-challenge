import { EditorConfig, EditorSize } from '../types/editor.types'

/**
 * Default editor configuration
 */
export const defaultEditorConfig: EditorConfig = {
  defaultPlaceholder: 'Start typing...',
  defaultSize: 'l',
  editorClassName: 'tiptap-editor',
}

/**
 * Size configurations for the editor
 */
export const sizeConfig: Record<EditorSize, { minHeight: string; padding: string }> = {
  s: {
    minHeight: '150px',
    padding: '1rem 1.5rem',
  },
  m: {
    minHeight: '300px',
    padding: '2rem 3rem',
  },
  l: {
    minHeight: '600px',
    padding: '3rem 4rem',
  },
}

/**
 * Default editor props for Tiptap
 */
export const defaultEditorProps = {
  immediatelyRender: false,
  editorProps: {
    attributes: {
      class: defaultEditorConfig.editorClassName,
    },
  },
}
