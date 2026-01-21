import { render, screen } from '@testing-library/react'
import { EditorPlaceholder } from '../EditorPlaceholder'

describe('EditorPlaceholder', () => {
  it('should render default placeholder text', () => {
    render(<EditorPlaceholder />)
    expect(screen.getByText('Start typing...')).toBeInTheDocument()
  })

  it('should render custom placeholder text', () => {
    render(<EditorPlaceholder placeholder="Type here..." />)
    expect(screen.getByText('Type here...')).toBeInTheDocument()
  })

  it('should apply tiptap-editor class', () => {
    const { container } = render(<EditorPlaceholder />)
    expect(container.querySelector('.tiptap-editor')).toBeInTheDocument()
  })

  it('should have correct styles for size l', () => {
    const { container } = render(<EditorPlaceholder size="l" />)
    const element = container.querySelector('.tiptap-editor') as HTMLElement
    expect(element?.style.minHeight).toBe('600px')
    expect(element?.style.padding).toBe('3rem 4rem')
  })

  it('should have correct styles for size m', () => {
    const { container } = render(<EditorPlaceholder size="m" />)
    const element = container.querySelector('.tiptap-editor') as HTMLElement
    expect(element?.style.minHeight).toBe('300px')
    expect(element?.style.padding).toBe('2rem 3rem')
  })

  it('should have correct styles for size s', () => {
    const { container } = render(<EditorPlaceholder size="s" />)
    const element = container.querySelector('.tiptap-editor') as HTMLElement
    expect(element?.style.minHeight).toBe('150px')
    expect(element?.style.padding).toBe('1rem 1.5rem')
  })
})
