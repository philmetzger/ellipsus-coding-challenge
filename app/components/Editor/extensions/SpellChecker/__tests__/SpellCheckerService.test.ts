import { SpellCheckerService } from '../SpellCheckerService'

// Mock WorkerManager
const mockCheckWord = jest.fn()
const mockCheckWords = jest.fn()
const mockGetSuggestions = jest.fn()

jest.mock('../WorkerManager', () => ({
  WorkerManager: jest.fn().mockImplementation(() => ({
    checkWord: mockCheckWord,
    checkWords: mockCheckWords,
    getSuggestions: mockGetSuggestions,
  })),
}))

// Mock DictionaryManager
jest.mock('../DictionaryManager', () => ({
  DictionaryManager: {
    getInstance: jest.fn(() => ({
      getWorkerManager: jest.fn(() => ({
        checkWord: mockCheckWord,
        checkWords: mockCheckWords,
        getSuggestions: mockGetSuggestions,
      })),
      loadDictionary: jest.fn(),
      switchLanguage: jest.fn(),
      isDictionaryLoaded: jest.fn(),
      clearCache: jest.fn(),
      getCurrentLanguage: jest.fn(() => 'en'),
    })),
  },
}))

describe('SpellCheckerService', () => {
  let service: SpellCheckerService

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock responses
    mockCheckWord.mockImplementation((word: string) => {
      return Promise.resolve(word === 'hello' || word === 'world')
    })
    
    mockCheckWords.mockImplementation((words: string[]) => {
      const results = new Map<string, boolean>()
      for (const word of words) {
        results.set(word, word === 'hello' || word === 'world')
      }
      return Promise.resolve(results)
    })
    
    mockGetSuggestions.mockImplementation((word: string) => {
      if (word === 'helo') return Promise.resolve(['hello'])
      if (word === 'wrld') return Promise.resolve(['world'])
      return Promise.resolve([])
    })
    
    service = new SpellCheckerService()
    service.clearCache()
  })

  it('should check if word is correct', async () => {
    expect(await service.checkWord('hello', 'en')).toBe(true)
    expect(await service.checkWord('world', 'en')).toBe(true)
    expect(await service.checkWord('helo', 'en')).toBe(false)
  })

  it('should cache correct words', async () => {
    await service.checkWord('hello', 'en')
    await service.checkWord('hello', 'en') // Should use cache
    // Worker should only be called once due to caching
    expect(mockCheckWord).toHaveBeenCalledTimes(1)
  })

  it('should get suggestions for misspelled words', async () => {
    const suggestions = await service.getSuggestions('helo', 'en')
    expect(suggestions).toContain('hello')
  })

  it('should cache suggestions', async () => {
    await service.getSuggestions('helo', 'en')
    await service.getSuggestions('helo', 'en') // Should use cache
    expect(mockGetSuggestions).toHaveBeenCalledTimes(1)
  })

  it('should check multiple words', async () => {
    const results = await service.checkWords(['hello', 'world', 'helo'], 'en')
    expect(results.get('hello')).toBe(true)
    expect(results.get('world')).toBe(true)
    expect(results.get('helo')).toBe(false)
  })

  it('should skip very short words', async () => {
    expect(await service.checkWord('a', 'en')).toBe(true)
    expect(await service.checkWord('I', 'en')).toBe(true)
    // Worker should not be called for short words
    expect(mockCheckWord).not.toHaveBeenCalled()
  })

  it('should clear cache', async () => {
    await service.checkWord('hello', 'en')
    service.clearCache()
    await service.checkWord('hello', 'en')
    // Should call worker again after cache clear
    expect(mockCheckWord).toHaveBeenCalledTimes(2)
  })

  it('should handle language-specific caching', async () => {
    await service.checkWord('hello', 'en')
    await service.checkWord('hello', 'de')
    // Should call worker for each language
    expect(mockCheckWord).toHaveBeenCalledTimes(2)
  })

  describe('case-sensitive spell checking', () => {
    beforeEach(() => {
      // Setup mock to simulate proper noun handling
      // "Monday" is correct (proper noun), "monday" is not
      // "HELLO" uppercase should still work via lowercase fallback
      mockCheckWord.mockImplementation((word: string) => {
        // Proper nouns (capitalized)
        if (word === 'Monday' || word === 'January' || word === 'English') {
          return Promise.resolve(true)
        }
        // Lowercase versions of proper nouns are misspelled
        if (word === 'monday' || word === 'january' || word === 'english') {
          return Promise.resolve(false)
        }
        // Regular words work in any case (worker handles this)
        if (word.toLowerCase() === 'hello' || word.toLowerCase() === 'world') {
          return Promise.resolve(true)
        }
        return Promise.resolve(false)
      })
    })

    it('should pass original case to worker for proper nouns', async () => {
      expect(await service.checkWord('Monday', 'en')).toBe(true)
      expect(mockCheckWord).toHaveBeenCalledWith('Monday', 'en')
    })

    it('should recognize proper nouns with correct capitalization', async () => {
      expect(await service.checkWord('Monday', 'en')).toBe(true)
      expect(await service.checkWord('January', 'en')).toBe(true)
      expect(await service.checkWord('English', 'en')).toBe(true)
    })

    it('should flag lowercase proper nouns as misspelled', async () => {
      expect(await service.checkWord('monday', 'en')).toBe(false)
      expect(await service.checkWord('january', 'en')).toBe(false)
    })

    it('should handle uppercase words via worker', async () => {
      expect(await service.checkWord('HELLO', 'en')).toBe(true)
      // Worker receives original case
      expect(mockCheckWord).toHaveBeenCalledWith('HELLO', 'en')
    })

    it('should use lowercase cache key for case variants', async () => {
      // Check "Monday" first - should be cached as "monday"
      await service.checkWord('Monday', 'en')
      mockCheckWord.mockClear()
      
      // Checking "MONDAY" should use the same cache entry
      await service.checkWord('MONDAY', 'en')
      // Should not call worker again due to cache hit (lowercase key)
      expect(mockCheckWord).not.toHaveBeenCalled()
    })
  })
})
