'use client'

import { ReactNode } from 'react'
import type { Editor } from '@tiptap/react'
import { SpellCheckerUI } from './SpellCheckerUI'

interface SpellCheckerWrapperProps {
  editor: Editor | null
  children: ReactNode
}

/**
 * SpellCheckerWrapper component that wraps EditorContent and automatically
 * renders spellchecker UI if the extension is present
 */
export function SpellCheckerWrapper({ editor, children }: SpellCheckerWrapperProps) {
  return (
    <>
      <SpellCheckerUI editor={editor} />
      {children}
    </>
  )
}
