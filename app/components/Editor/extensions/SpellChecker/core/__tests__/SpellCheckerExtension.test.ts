import { SpellCheckerExtension } from '../SpellCheckerExtension'

// Mock the dependencies
jest.mock('../../services/DictionaryManager', () => ({
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

jest.mock('../../services/SpellCheckerService', () => ({
  SpellCheckerService: jest.fn().mockImplementation(() => ({
    checkWord: jest.fn((word: string) => word === 'hello'),
    getSuggestions: jest.fn(() => ['hello']),
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

  it('should have storage defined in config', () => {
    const extension = SpellCheckerExtension.configure()
    expect(extension.config.addStorage).toBeDefined()
  })

  it('should have ProseMirror plugins defined in config', () => {
    const extension = SpellCheckerExtension.configure()
    expect(extension.config.addProseMirrorPlugins).toBeDefined()
  })

  it('should have commands defined in config', () => {
    const extension = SpellCheckerExtension.configure()
    expect(extension.config.addCommands).toBeDefined()
  })

  it('should have options defined in config', () => {
    const extension = SpellCheckerExtension.configure()
    expect(extension.config.addOptions).toBeDefined()
  })
})
