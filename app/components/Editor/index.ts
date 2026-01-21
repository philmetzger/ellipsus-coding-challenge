export { Editor, default } from './Editor'
export { EditorPlaceholder } from './EditorPlaceholder'
export { EditorContentWrapper } from './EditorContentWrapper'
export { useEditor } from './hooks/useEditor'
export { useEditorMount } from './hooks/useEditorMount'
export { getExtensions, getBaseExtensions, configurePlaceholder } from './utils/getExtensions'
export { defaultEditorConfig, sizeConfig, defaultEditorProps } from './utils/editorConfig'
export type {
  EditorProps,
  EditorConfig,
  EditorSize,
  UseEditorOptions,
  UseEditorReturn,
  EditorPlaceholderProps,
  EditorContentWrapperProps,
} from './types/editor.types'
