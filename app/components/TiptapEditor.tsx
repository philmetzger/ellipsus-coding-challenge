'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useState } from 'react'

export default function TiptapEditor() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing...',
      }),
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  })

  if (!isMounted || !editor) {
    return (
      <div className="tiptap-editor" style={{ minHeight: '600px', padding: '3rem 4rem' }}>
        <p style={{ color: 'rgba(140, 140, 140, 0.4)' }}>Start typing...</p>
      </div>
    )
  }

  return (
    <EditorContent editor={editor} />
  )
}
