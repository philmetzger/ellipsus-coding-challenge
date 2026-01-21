import { EditorContentWrapperProps } from './types/editor.types'

/**
 * Wrapper component for editor content
 * Applies consistent styling and spacing
 */
export const EditorContentWrapper = ({
  children,
  paragraphSpacing = 'm',
}: EditorContentWrapperProps) => {
  return <div className="editor-content-wrapper">{children}</div>
}
