import { SpellCheckerExtension } from '../SpellCheckerExtension'
import { DEFAULT_LANGUAGE } from '../utils/constants'

// Mock the dependencies
jest.mock('../DictionaryManager', () => ({
  DictionaryManager: {
    getInstance: jest.fn(() => ({
      loadDictionary: jest.fn().mockResolvedValue(undefined),
      getWorkerManager: jest.fn(() => ({
        checkWord: jest.fn().mockResolvedValue(true),
        getSuggestions: jest.fn().mockResolvedValue(['hello']),
        cancelAllPendingRequests: jest.fn(),
      })),
      switchLanguage: jest.fn().mockResolvedValue(undefined),
    })),
  },
}))

jest.mock('../SpellCheckerService', () => ({
  SpellCheckerService: jest.fn().mockImplementation(() => ({
    checkWord: jest.fn((word: string) => word === 'hello'),
    getSuggestions: jest.fn((word: string) => ['hello']),
    checkWords: jest.fn((words: string[]) => {
      const map = new Map()
      words.forEach((word) => map.set(word, word === 'hello'))
      return map
    }),
    clearCache: jest.fn(),
  })),
}))

describe('SpellCheckerExtension', () => {
  it('should create extension with default options', () => {
    const extension = SpellCheckerExtension.configure()
    expect(extension.name).toBe('spellChecker')
  })

  it('should create extension with custom options', () => {
    const extension = SpellCheckerExtension.configure({
      enabled: false,
      language: 'en',
      debounceMs: 500,
    })
    expect(extension.name).toBe('spellChecker')
  })

  it('should have storage', () => {
    const extension = SpellCheckerExtension.configure()
    expect(extension.storage).toBeDefined()
  })

  it('should add ProseMirror plugins', () => {
    const extension = SpellCheckerExtension.configure()
    const plugins = extension.addProseMirrorPlugins()
    expect(plugins).toHaveLength(1)
  })

  it('should have commands', () => {
    const extension = SpellCheckerExtension.configure()
    const commands = extension.addCommands()
    expect(commands.toggleSpellChecker).toBeDefined()
    expect(commands.setSpellCheckerLanguage).toBeDefined()
    expect(commands.replaceMisspelledWord).toBeDefined()
  })
})
