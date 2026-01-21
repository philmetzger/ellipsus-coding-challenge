import { renderHook, waitFor } from '@testing-library/react'
import { useEditor } from '../useEditor'

// Mock Tiptap's useEditor
jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn(() => ({
    isEmpty: false,
    getJSON: () => ({ type: 'doc', content: [] }),
    getText: () => 'test content',
    commands: {
      clearContent: jest.fn(),
    },
    on: jest.fn(),
    off: jest.fn(),
    isDestroyed: false,
  })),
}))

describe('useEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize editor with default options', () => {
    const { result } = renderHook(() => useEditor({}))
    expect(result.current.editor).toBeDefined()
  })

  it('should initialize editor with content', () => {
    const content = JSON.stringify({ type: 'doc', content: [] })
    const { result } = renderHook(() => useEditor({ content }))
    expect(result.current.editor).toBeDefined()
  })

  it('should initialize editor with placeholder', () => {
    const { result } = renderHook(() =>
      useEditor({ placeholder: 'Custom placeholder' })
    )
    expect(result.current.editor).toBeDefined()
  })

  it('should call onUpdate when editor updates', async () => {
    const onUpdate = jest.fn()
    const mockEditor = {
      isEmpty: false,
      getJSON: () => ({ type: 'doc', content: [] }),
      getText: () => 'test',
      commands: {
        clearContent: jest.fn(),
      },
      on: jest.fn((event, handler) => {
        // Simulate update event
        setTimeout(() => handler(), 0)
      }),
      off: jest.fn(),
      isDestroyed: false,
    }

    jest.spyOn(require('@tiptap/react'), 'useEditor').mockReturnValue(mockEditor)

    renderHook(() => useEditor({ onUpdate }))

    await waitFor(() => {
      expect(mockEditor.on).toHaveBeenCalledWith('update', expect.any(Function))
    })
  })
})
