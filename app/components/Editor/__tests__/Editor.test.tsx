import { render, screen } from '@testing-library/react'
import { Editor } from '../Editor'

// Mock the hooks
jest.mock('../hooks/useEditorMount', () => ({
  useEditorMount: jest.fn(() => true),
}))

jest.mock('../hooks/useEditor', () => ({
  useEditor: jest.fn(() => ({
    editor: {
      isEmpty: false,
      getJSON: () => ({ type: 'doc', content: [] }),
    },
  })),
}))

// Mock EditorContent
jest.mock('@tiptap/react', () => ({
  EditorContent: ({ editor }: { editor: any }) => <div data-testid="editor-content">Editor Content</div>,
}))

describe('Editor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render editor content when mounted', () => {
    render(<Editor />)
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })

  it('should render placeholder when not mounted', () => {
    const { useEditorMount } = require('../hooks/useEditorMount')
    useEditorMount.mockReturnValue(false)

    render(<Editor />)
    expect(screen.getByText('Start typing...')).toBeInTheDocument()
  })

  it('should render placeholder when editor is null', () => {
    const { useEditor } = require('../hooks/useEditor')
    useEditor.mockReturnValue({ editor: null })

    render(<Editor />)
    expect(screen.getByText('Start typing...')).toBeInTheDocument()
  })

  it('should use custom placeholder', () => {
    const { useEditorMount } = require('../hooks/useEditorMount')
    useEditorMount.mockReturnValue(false)

    render(<Editor placeholder="Custom placeholder" />)
    expect(screen.getByText('Custom placeholder')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<Editor className="custom-class" />)
    const container = screen.getByTestId('editor-content').parentElement
    expect(container).toHaveClass('custom-class')
  })
})
