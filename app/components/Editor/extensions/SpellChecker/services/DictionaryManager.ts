import { WorkerManager } from './WorkerManager'
import { DEFAULT_LANGUAGE, DICTIONARY_RETRY_COUNT, DICTIONARY_RETRY_DELAY_MS } from '../utils/constants'
import type { LanguageCode } from '../utils/constants'

/**
 * DictionaryManager handles loading and caching dictionaries via web worker
 * Uses singleton pattern for shared state across editor instances
 * 
 * Note: This is a compatibility layer that maintains the same API
 * but uses WorkerManager internally instead of direct nspell
 */
export class DictionaryManager {
  private static instance: DictionaryManager | null = null
  private workerManager: WorkerManager
  private loadedLanguages: Set<LanguageCode> = new Set()
  private loadingPromises: Map<LanguageCode, Promise<void>> = new Map()
  private currentLanguage: LanguageCode = DEFAULT_LANGUAGE

  private constructor() {
    // Private constructor for singleton
    this.workerManager = WorkerManager.getInstance()
  }

  /**
   * Get the singleton instance
   * Only available in browser environment
   */
  static getInstance(): DictionaryManager {
    // Ensure we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error(
        'DictionaryManager can only be used in browser environment. Dictionary loading requires client-side execution.'
      )
    }

    if (!DictionaryManager.instance) {
      DictionaryManager.instance = new DictionaryManager()
    }
    return DictionaryManager.instance
  }

  /**
   * Reset the singleton instance (for testing)
   */
  static resetInstance(): void {
    if (DictionaryManager.instance) {
      DictionaryManager.instance.clearCache()
      DictionaryManager.instance = null
    }
  }

  /**
   * Load a dictionary for a given language
   * @param language - Language code
   * @returns Promise that resolves when dictionary is loaded
   */
  async loadDictionary(language: LanguageCode): Promise<void> {
    // Return if already loaded
    if (this.loadedLanguages.has(language)) {
      return
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(language)) {
      return this.loadingPromises.get(language)!
    }

    // Start loading the dictionary via worker
    const loadPromise = this._loadDictionary(language)
    this.loadingPromises.set(language, loadPromise)

    try {
      await loadPromise
      this.loadedLanguages.add(language)
    } catch (error) {
      this.loadingPromises.delete(language)
      throw error
    } finally {
      this.loadingPromises.delete(language)
    }
  }

  /**
   * Internal method to actually load the dictionary via worker
   * Only works in browser environment
   */
  private async _loadDictionary(language: LanguageCode): Promise<void> {
    // Double-check we're in browser (defensive programming)
    if (typeof window === 'undefined') {
      throw new Error(
        'Dictionary loading can only occur in browser environment. This method should not be called during SSR.'
      )
    }

    try {
      // Load dictionary via worker (worker loads from API route)
      await this.workerManager.loadDictionary(language)
    } catch (error) {
      throw new Error(`Failed to load dictionary for language ${language}: ${error}`)
    }
  }

  /**
   * Get the WorkerManager instance for spell checking operations
   */
  getWorkerManager(): WorkerManager {
    return this.workerManager
  }

  /**
   * Switch to a different language
   * @param language - Language code to switch to
   */
  async switchLanguage(language: LanguageCode): Promise<void> {
    // Check if worker already has this language loaded
    try {
      const workerLang = await this.workerManager.getCurrentLanguage()
      if (workerLang === language) {
        this.currentLanguage = language
        return // Already using this language in worker
      }
    } catch (error) {
      // If verification fails, continue with loading
    }

    // Force load the dictionary in the worker
    // Note: Worker only holds one dictionary at a time, so we always need to reload
    // when switching, even if we loaded it before
    await this._loadDictionary(language)
    
    // Verify worker language matches after loading
    let retries = DICTIONARY_RETRY_COUNT
    while (retries > 0) {
      try {
        const workerLang = await this.workerManager.getCurrentLanguage()
        if (workerLang === language) {
          this.currentLanguage = language
          this.loadedLanguages.add(language)
          return
        }
      } catch {
        // If verification fails, wait and retry
      }
      // Wait a bit and retry
      await new Promise(resolve => setTimeout(resolve, DICTIONARY_RETRY_DELAY_MS))
      retries--
    }
    
    // If verification failed after retries, still update our state
    this.currentLanguage = language
  }

  /**
   * Get the current language
   */
  getCurrentLanguage(): LanguageCode {
    return this.currentLanguage
  }

  /**
   * Check if a dictionary is loaded for a language
   * @param language - Language code
   * @returns Whether the dictionary is loaded
   */
  isDictionaryLoaded(language: LanguageCode): boolean {
    return this.loadedLanguages.has(language)
  }

  /**
   * Clear all cached dictionaries (useful for testing or memory management)
   */
  clearCache(): void {
    this.loadedLanguages.clear()
    this.loadingPromises.clear()
    // Note: Worker state is managed by WorkerManager
  }
}
