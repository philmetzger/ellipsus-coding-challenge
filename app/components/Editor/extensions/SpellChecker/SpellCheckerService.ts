import { DictionaryManager } from './DictionaryManager'
import { WorkerManager } from './WorkerManager'
import { MIN_WORD_LENGTH } from './utils/constants'
import { calculateEditDistance } from './utils/wordExtractor'
import type { LanguageCode } from './utils/constants'

/**
 * SpellCheckerService handles spell checking logic with caching
 * Now uses WorkerManager for all spell checking operations
 */
export class SpellCheckerService {
  private dictionaryManager: DictionaryManager
  private workerManager: WorkerManager
  // Language-aware caches: Map<LanguageCode, Set<string>>
  private correctWordsCache: Map<LanguageCode, Set<string>> = new Map()
  private misspelledWordsCache: Map<LanguageCode, Set<string>> = new Map()
  // Suggestions cache: key is `${language}:${word}`
  private suggestionsCache: Map<string, string[]> = new Map()
  // Pending checks: key is `${language}:${word}`
  private pendingChecks: Map<string, Promise<boolean>> = new Map()

  constructor(dictionaryManager?: DictionaryManager) {
    this.dictionaryManager = dictionaryManager || DictionaryManager.getInstance()
    this.workerManager = this.dictionaryManager.getWorkerManager()
  }

  /**
   * Get or create a cache set for a language
   */
  private getCorrectWordsCache(language: LanguageCode): Set<string> {
    if (!this.correctWordsCache.has(language)) {
      this.correctWordsCache.set(language, new Set())
    }
    return this.correctWordsCache.get(language)!
  }

  /**
   * Get or create a misspelled words cache set for a language
   */
  private getMisspelledWordsCache(language: LanguageCode): Set<string> {
    if (!this.misspelledWordsCache.has(language)) {
      this.misspelledWordsCache.set(language, new Set())
    }
    return this.misspelledWordsCache.get(language)!
  }

  /**
   * Check if a word is correctly spelled
   * @param word - Word to check
   * @param language - Language code for language-aware caching
   * @returns Promise that resolves to true if word is correct, false if misspelled
   */
  async checkWord(word: string, language: LanguageCode): Promise<boolean> {
    const trimmed = word.trim()
    const cacheKeyWord = trimmed.toLowerCase()

    // Skip very short words
    if (trimmed.length < MIN_WORD_LENGTH) {
      return true
    }

    // Get language-specific caches
    const correctCache = this.getCorrectWordsCache(language)
    const misspelledCache = this.getMisspelledWordsCache(language)
    const cacheKey = `${language}:${cacheKeyWord}`

    // Check cache first (use lowercase for cache lookup)
    if (correctCache.has(cacheKeyWord)) {
      return true
    }
    if (misspelledCache.has(cacheKeyWord)) {
      return false
    }

    // Check if there's already a pending check for this word
    if (this.pendingChecks.has(cacheKey)) {
      return this.pendingChecks.get(cacheKey)!
    }

    // Check via worker with original case (worker handles case-insensitive checking)
    const checkPromise = this.workerManager.checkWord(trimmed, language).then((isCorrect) => {
      // Cache result using lowercase key
      if (isCorrect) {
        correctCache.add(cacheKeyWord)
      } else {
        misspelledCache.add(cacheKeyWord)
      }
      this.pendingChecks.delete(cacheKey)
      return isCorrect
    }).catch(() => {
      this.pendingChecks.delete(cacheKey)
      // On error (including language mismatch), assume word is correct
      return true
    })

    this.pendingChecks.set(cacheKey, checkPromise)
    return checkPromise
  }

  /**
   * Get spelling suggestions for a misspelled word
   * Ranks suggestions by edit distance to ensure best match is first
   * @param word - Misspelled word
   * @param language - Language code
   * @returns Promise that resolves to array of suggested corrections (top 5, best first)
   */
  async getSuggestions(word: string, language: LanguageCode): Promise<string[]> {
    const trimmed = word.trim()
    const cacheKeyWord = trimmed.toLowerCase()
    const cacheKey = `${language}:${cacheKeyWord}`

    // Check cache first (use lowercase for cache lookup)
    if (this.suggestionsCache.has(cacheKey)) {
      return this.suggestionsCache.get(cacheKey)!
    }

    try {
      // Get suggestions from worker with original case
      const allSuggestions = await this.workerManager.getSuggestions(trimmed, language)

      if (allSuggestions.length === 0) {
        return []
      }

      // Rank suggestions by edit distance (compare lowercase for accurate distance)
      const rankedSuggestions = allSuggestions.map((suggestion) => ({
        suggestion,
        distance: calculateEditDistance(cacheKeyWord, suggestion.toLowerCase()),
      }))

      // Sort by edit distance (ascending - lower is better)
      rankedSuggestions.sort((a, b) => a.distance - b.distance)

      // Select top 5
      const topSuggestions: string[] = []
      const usedSuggestions = new Set<string>()

      for (let i = 0; i < rankedSuggestions.length && topSuggestions.length < 5; i++) {
        const item = rankedSuggestions[i]
        if (!usedSuggestions.has(item.suggestion)) {
          topSuggestions.push(item.suggestion)
          usedSuggestions.add(item.suggestion)
        }
      }

      // Cache the results
      this.suggestionsCache.set(cacheKey, topSuggestions)

      return topSuggestions
    } catch {
      // On error (including language mismatch), return empty
      return []
    }
  }

  /**
   * Check multiple words at once (batch operation)
   * @param words - Array of words to check
   * @param language - Language code for language-aware caching
   * @returns Promise that resolves to Map of word to boolean (true = correct, false = misspelled)
   */
  async checkWords(words: string[], language: LanguageCode): Promise<Map<string, boolean>> {
    try {
      // Use batch check from worker (WorkerManager handles language verification)
      const results = await this.workerManager.checkWords(words, language)

      // Get language-specific caches
      const correctCache = this.getCorrectWordsCache(language)
      const misspelledCache = this.getMisspelledWordsCache(language)

      // Update caches
      for (const [word, isCorrect] of results.entries()) {
        const normalized = word.toLowerCase().trim()
        if (isCorrect) {
          correctCache.add(normalized)
        } else {
          misspelledCache.add(normalized)
        }
      }

      return results
    } catch {
      // On error (including language mismatch), assume all words are correct
      const fallback = new Map<string, boolean>()
      for (const word of words) {
        fallback.set(word, true)
      }
      return fallback
    }
  }

  /**
   * Clear all pending checks
   * This ensures no pending operations complete with wrong language
   */
  clearAllPendingChecks(): void {
    // Clear the map - promises will complete but won't be cached
    this.pendingChecks.clear()
  }

  /**
   * Clear all caches completely (no language-specific logic)
   * Also clears pending checks to ensure no stale data persists
   */
  clearCache(): void {
    this.correctWordsCache.clear()
    this.misspelledWordsCache.clear()
    this.suggestionsCache.clear()
    this.pendingChecks.clear()
  }

  /**
   * Clear cache for a specific word in a specific language
   * @param word - Word to remove from cache
   * @param language - Language code
   */
  clearWordCache(word: string, language: LanguageCode): void {
    const normalized = word.toLowerCase().trim()
    const correctCache = this.correctWordsCache.get(language)
    const misspelledCache = this.misspelledWordsCache.get(language)
    
    if (correctCache) {
      correctCache.delete(normalized)
    }
    if (misspelledCache) {
      misspelledCache.delete(normalized)
    }
    
    // Clear suggestions cache for this word in this language
    const cacheKey = `${language}:${normalized}`
    this.suggestionsCache.delete(cacheKey)
  }
}
