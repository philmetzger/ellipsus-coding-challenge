import { EditorPlaceholderProps } from './types/editor.types'
import { sizeConfig } from './utils/editorConfig'
import { defaultEditorConfig } from './utils/editorConfig'

/**
 * Placeholder component shown during SSR or while editor is loading
 * Matches editor dimensions and styling to prevent layout shift
 */
export const EditorPlaceholder = ({
  placeholder = defaultEditorConfig.defaultPlaceholder,
  size = defaultEditorConfig.defaultSize,
}: EditorPlaceholderProps) => {
  const { minHeight, padding } = sizeConfig[size]

  return (
    <div
      className="tiptap-editor"
      style={{
        minHeight,
        padding,
        fontSize: '1.0625rem',
        lineHeight: 1.75,
        color: 'rgba(26, 26, 26, 0.9)',
        maxWidth: '100%',
      }}
    >
      <p
        style={{
          color: 'rgba(140, 140, 140, 0.4)',
          margin: 0,
        }}
      >
        {placeholder}
      </p>
    </div>
  )
}
