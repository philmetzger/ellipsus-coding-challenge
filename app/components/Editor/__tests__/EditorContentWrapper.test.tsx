import { render, screen } from '@testing-library/react'
import { EditorContentWrapper } from '../EditorContentWrapper'

describe('EditorContentWrapper', () => {
  it('should render children', () => {
    render(
      <EditorContentWrapper>
        <div data-testid="child">Child content</div>
      </EditorContentWrapper>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should apply editor-content-wrapper class', () => {
    const { container } = render(
      <EditorContentWrapper>
        <div>Content</div>
      </EditorContentWrapper>
    )
    expect(container.querySelector('.editor-content-wrapper')).toBeInTheDocument()
  })
})
