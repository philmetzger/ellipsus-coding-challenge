/**
 * SpellCheckerUI Tests
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { SpellCheckerUI } from '../SpellCheckerUI'

// Mock child components
jest.mock('../SpellCheckerControls', () => ({
  SpellCheckerControls: ({ value, isLoading }: { value: string; isLoading: boolean }) => (
    <div data-testid="spellchecker-controls" data-value={value} data-loading={String(isLoading)}>
      SpellCheckerControls Mock
    </div>
  ),
}))

jest.mock('../ContextMenu', () => ({
  ContextMenu: () => (
    <div data-testid="context-menu">ContextMenu Mock</div>
  ),
}))

// Create mock extension
const mockExtension = {
  name: 'spellChecker',
  options: { enabled: true, language: 'en' },
  storage: { enabled: true, language: 'en' },
}

// Mock the hook module
let mockReturnValue: typeof mockExtension | null = mockExtension

jest.mock('../../hooks/useSpellCheckerExtension', () => ({
  useSpellCheckerExtension: () => mockReturnValue,
}))

// Create mock editor
const createMockEditor = () => ({
  commands: {
    toggleSpellChecker: jest.fn(),
    setSpellCheckerLanguage: jest.fn().mockResolvedValue(undefined),
  },
})

describe('SpellCheckerUI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReturnValue = mockExtension
  })

  describe('rendering', () => {
    it('should render SpellCheckerControls when extension is present', () => {
      const editor = createMockEditor()
      render(<SpellCheckerUI editor={editor as any} />)
      
      expect(screen.getByTestId('spellchecker-controls')).toBeInTheDocument()
    })

    it('should render ContextMenu when extension is present', () => {
      const editor = createMockEditor()
      render(<SpellCheckerUI editor={editor as any} />)
      
      expect(screen.getByTestId('context-menu')).toBeInTheDocument()
    })

    it('should not render when extension is not found', () => {
      mockReturnValue = null
      
      const editor = createMockEditor()
      const { container } = render(<SpellCheckerUI editor={editor as any} />)
      
      expect(container.firstChild).toBeNull()
    })

    it('should pass correct initial value to controls', () => {
      const editor = createMockEditor()
      render(<SpellCheckerUI editor={editor as any} />)
      
      const controls = screen.getByTestId('spellchecker-controls')
      expect(controls).toHaveAttribute('data-value', 'en')
    })
  })

  describe('with disabled extension', () => {
    it('should show "off" value when extension is disabled', () => {
      mockReturnValue = {
        ...mockExtension,
        options: { enabled: false, language: 'en' },
        storage: { enabled: false, language: 'en' },
      }
      
      const editor = createMockEditor()
      render(<SpellCheckerUI editor={editor as any} />)
      
      const controls = screen.getByTestId('spellchecker-controls')
      expect(controls).toHaveAttribute('data-value', 'off')
    })
  })

  describe('null editor', () => {
    it('should render nothing when editor is null and extension not found', () => {
      mockReturnValue = null
      const { container } = render(<SpellCheckerUI editor={null} />)
      expect(container.firstChild).toBeNull()
    })
  })
})
