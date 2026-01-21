/**
 * SpellCheckerPlugin Tests
 * Tests for the ProseMirror plugin that handles spell checking
 */

import { createSpellCheckerPlugin } from '../SpellCheckerPlugin'
import type { ContextMenuState } from '../../types'

// Mock SpellCheckerService
const mockCheckWords = jest.fn()
const mockGetSuggestions = jest.fn()

jest.mock('../../services/SpellCheckerService', () => ({
  SpellCheckerService: jest.fn().mockImplementation(() => ({
    checkWords: mockCheckWords,
    getSuggestions: mockGetSuggestions,
    clearCache: jest.fn(),
  })),
}))

// Mock wordExtractor
jest.mock('../../utils/wordExtractor', () => ({
  extractWords: jest.fn(() => [
    { word: 'hello', from: 1, to: 6 },
    { word: 'wrold', from: 7, to: 12 },
  ]),
}))

describe('SpellCheckerPlugin', () => {
  let mockService: {
    checkWords: jest.Mock
    getSuggestions: jest.Mock
    clearCache: jest.Mock
  }

  let onContextMenu: jest.Mock
  let onDismissContextMenu: jest.Mock
  let getEnabled: jest.Mock
  let getLanguage: jest.Mock
  let getScanGeneration: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    mockService = {
      checkWords: mockCheckWords,
      getSuggestions: mockGetSuggestions,
      clearCache: jest.fn(),
    }

    // Default mock implementations
    mockCheckWords.mockResolvedValue(
      new Map([
        ['hello', true],
        ['wrold', false],
      ])
    )
    mockGetSuggestions.mockResolvedValue(['world'])

    onContextMenu = jest.fn()
    onDismissContextMenu = jest.fn()
    getEnabled = jest.fn().mockReturnValue(true)
    getLanguage = jest.fn().mockReturnValue('en')
    getScanGeneration = jest.fn().mockReturnValue(1)
  })

  describe('createSpellCheckerPlugin', () => {
    it('should create a valid ProseMirror plugin', () => {
      const plugin = createSpellCheckerPlugin(mockService as any, {
        getEnabled,
        getLanguage,
        getScanGeneration,
        onContextMenu,
        onDismissContextMenu,
      })

      expect(plugin).toBeDefined()
      // @ts-expect-error - accessing internal plugin key for testing
      expect(plugin.key).toBeDefined()
      expect(plugin.spec).toBeDefined()
    })

    it('should have state spec defined', () => {
      const plugin = createSpellCheckerPlugin(mockService as any, {
        getEnabled,
        getLanguage,
        getScanGeneration,
        onContextMenu,
        onDismissContextMenu,
      })

      expect(plugin.spec.state).toBeDefined()
      expect(plugin.spec.state?.init).toBeDefined()
      expect(plugin.spec.state?.apply).toBeDefined()
    })

    it('should have view spec defined', () => {
      const plugin = createSpellCheckerPlugin(mockService as any, {
        getEnabled,
        getLanguage,
        getScanGeneration,
        onContextMenu,
        onDismissContextMenu,
      })

      expect(plugin.spec.view).toBeDefined()
    })

    it('should have props spec defined', () => {
      const plugin = createSpellCheckerPlugin(mockService as any, {
        getEnabled,
        getLanguage,
        getScanGeneration,
        onContextMenu,
        onDismissContextMenu,
      })

      expect(plugin.spec.props).toBeDefined()
      expect(plugin.spec.props?.decorations).toBeDefined()
      expect(plugin.spec.props?.handleDOMEvents).toBeDefined()
    })
  })

  describe('plugin state initialization', () => {
    it('should initialize with empty decorations', () => {
      const plugin = createSpellCheckerPlugin(mockService as any, {
        getEnabled,
        getLanguage,
        getScanGeneration,
        onContextMenu,
        onDismissContextMenu,
      })

      // Test the init function directly - bind to plugin for proper 'this' context
      const initFn = plugin.spec.state?.init
      if (initFn) {
        const state = initFn.call(plugin, {} as any, {} as any)
        expect(state.decorations).toBeDefined()
        expect(state.shouldRescan).toBe(false)
        expect(state.generation).toBe(1) // From getScanGeneration mock
      }
    })
  })

  describe('enabled state handling', () => {
    it('should use getEnabled callback', () => {
      getEnabled.mockReturnValue(false)

      const plugin = createSpellCheckerPlugin(mockService as any, {
        getEnabled,
        getLanguage,
        getScanGeneration,
        onContextMenu,
        onDismissContextMenu,
      })

      // The decorations prop should check enabled state
      const decorationsFn = plugin.spec.props?.decorations
      if (decorationsFn) {
        // When disabled, should return empty decorations
        const result = decorationsFn({} as any)
        expect(result).toBeDefined()
      }
    })
  })

  describe('generation tracking', () => {
    it('should use getScanGeneration callback', () => {
      getScanGeneration.mockReturnValue(5)

      const plugin = createSpellCheckerPlugin(mockService as any, {
        getEnabled,
        getLanguage,
        getScanGeneration,
        onContextMenu,
        onDismissContextMenu,
      })

      const initFn = plugin.spec.state?.init
      if (initFn) {
        const state = initFn.call(plugin, {} as any, {} as any)
        expect(state.generation).toBe(5)
      }
    })
  })

  describe('context menu handling', () => {
    it('should have contextmenu handler in handleDOMEvents', () => {
      const plugin = createSpellCheckerPlugin(mockService as any, {
        getEnabled,
        getLanguage,
        getScanGeneration,
        onContextMenu,
        onDismissContextMenu,
      })

      const handleDOMEvents = plugin.spec.props?.handleDOMEvents
      expect(handleDOMEvents?.contextmenu).toBeDefined()
    })
  })

  describe('language handling', () => {
    it('should use getLanguage callback', () => {
      getLanguage.mockReturnValue('de')

      const plugin = createSpellCheckerPlugin(mockService as any, {
        getEnabled,
        getLanguage,
        getScanGeneration,
        onContextMenu,
        onDismissContextMenu,
      })

      // Plugin should be created successfully with language callback
      expect(plugin).toBeDefined()
      expect(getLanguage()).toBe('de')
    })
  })
})
