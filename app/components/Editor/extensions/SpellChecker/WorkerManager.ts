/**
 * WorkerManager manages communication with the spellchecker web worker
 * Handles worker lifecycle, message passing, and request/response coordination
 */

/**
 * Message types sent to worker
 */
type WorkerRequestType = 'LOAD_DICTIONARY' | 'CHECK_WORD' | 'CHECK_WORDS' | 'GET_SUGGESTIONS' | 'GET_CURRENT_LANGUAGE'

/**
 * Worker request messages - discriminated union for type safety
 */
type WorkerRequest =
  | { type: 'LOAD_DICTIONARY'; requestId: string; language: string }
  | { type: 'CHECK_WORD'; requestId: string; word: string }
  | { type: 'CHECK_WORDS'; requestId: string; words: string[] }
  | { type: 'GET_SUGGESTIONS'; requestId: string; word: string }
  | { type: 'GET_CURRENT_LANGUAGE'; requestId: string }

/**
 * Worker response message
 */
interface WorkerResponse {
  type: 'SUCCESS' | 'ERROR'
  requestId: string
  data?: unknown
  error?: string
}

/**
 * Pending request handler
 */
interface PendingRequest<T = unknown> {
  resolve: (value: T) => void
  reject: (error: Error) => void
  timeout: NodeJS.Timeout
}

/**
 * WorkerManager handles all communication with the spellchecker web worker
 */
export class WorkerManager {
  private static instance: WorkerManager | null = null
  private worker: Worker | null = null
  private pendingRequests: Map<string, PendingRequest<unknown>> = new Map()
  private requestCounter = 0
  private readonly REQUEST_TIMEOUT = 30000 // 30 seconds

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): WorkerManager {
    if (typeof window === 'undefined') {
      throw new Error('WorkerManager can only be used in browser environment')
    }

    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager()
    }
    return WorkerManager.instance
  }

  /**
   * Ensure worker is initialized
   */
  private async ensureWorker(): Promise<Worker> {
    if (!this.worker) {
      this.worker = new Worker('/spellcheck-worker.js', { type: 'classic' })
      this.worker.onmessage = this.handleMessage.bind(this)
      this.worker.onerror = this.handleError.bind(this)
    }
    return this.worker
  }

  /**
   * Handle messages from worker
   */
  private handleMessage(e: MessageEvent<WorkerResponse>) {
    const { type, requestId, data, error } = e.data

    const pending = this.pendingRequests.get(requestId)
    if (!pending) {
      // Request was cancelled or already handled
      return
    }

    // Clear timeout
    clearTimeout(pending.timeout)
    this.pendingRequests.delete(requestId)

    if (type === 'SUCCESS') {
      pending.resolve(data)
    } else {
      pending.reject(new Error(error || 'Unknown error'))
    }
  }

  /**
   * Handle worker errors
   */
  private handleError(error: ErrorEvent) {
    console.error('Worker error:', error)
    // Reject all pending requests
    for (const [, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeout)
      pending.reject(new Error(`Worker error: ${error.message}`))
    }
    this.pendingRequests.clear()
  }

  /**
   * Send message to worker and wait for response
   */
  private async sendMessage<T>(
    type: WorkerRequestType,
    data: Record<string, string | string[]> = {}
  ): Promise<T> {
    const worker = await this.ensureWorker()
    const requestId = `req_${++this.requestCounter}_${Date.now()}`

    return new Promise<T>((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error(`Request timeout: ${type}`))
      }, this.REQUEST_TIMEOUT)

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve: (value) => resolve(value as T),
        reject,
        timeout,
      })

      // Send message to worker
      const message: WorkerRequest = { type, requestId, ...data } as WorkerRequest
      worker.postMessage(message)
    })
  }

  /**
   * Load dictionary for a language
   */
  async loadDictionary(language: string): Promise<void> {
    await this.sendMessage('LOAD_DICTIONARY', { language })
  }

  /**
   * Check if a word is correctly spelled
   * @param word - Word to check
   * @param expectedLanguage - Optional language to verify worker is using correct dictionary
   */
  async checkWord(word: string, expectedLanguage?: string): Promise<boolean> {
    // Verify language if provided
    if (expectedLanguage) {
      const currentLang = await this.getCurrentLanguage()
      if (currentLang !== expectedLanguage) {
        throw new Error(`Language mismatch: expected ${expectedLanguage}, got ${currentLang}`)
      }
    }
    return this.sendMessage<boolean>('CHECK_WORD', { word })
  }

  /**
   * Check multiple words at once
   * @param words - Words to check
   * @param expectedLanguage - Optional language to verify worker is using correct dictionary
   */
  async checkWords(words: string[], expectedLanguage?: string): Promise<Map<string, boolean>> {
    // Verify language if provided
    if (expectedLanguage) {
      const currentLang = await this.getCurrentLanguage()
      if (currentLang !== expectedLanguage) {
        throw new Error(`Language mismatch: expected ${expectedLanguage}, got ${currentLang}`)
      }
    }
    
    const results = await this.sendMessage<Record<string, boolean>>('CHECK_WORDS', { words })
    
    // Convert to Map
    const map = new Map<string, boolean>()
    for (const [word, isCorrect] of Object.entries(results)) {
      map.set(word, isCorrect)
    }
    return map
  }

  /**
   * Get spelling suggestions for a word
   * @param word - Word to get suggestions for
   * @param expectedLanguage - Optional language to verify worker is using correct dictionary
   */
  async getSuggestions(word: string, expectedLanguage?: string): Promise<string[]> {
    // Verify language if provided
    if (expectedLanguage) {
      const currentLang = await this.getCurrentLanguage()
      if (currentLang !== expectedLanguage) {
        throw new Error(`Language mismatch: expected ${expectedLanguage}, got ${currentLang}`)
      }
    }
    return this.sendMessage<string[]>('GET_SUGGESTIONS', { word })
  }

  /**
   * Get the current language from the worker
   */
  async getCurrentLanguage(): Promise<string> {
    return this.sendMessage<string>('GET_CURRENT_LANGUAGE', {})
  }

  /**
   * Cancel all pending requests (e.g., when language changes)
   */
  cancelAllPendingRequests(): void {
    for (const [, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeout)
      pending.reject(new Error('Request cancelled: language changed'))
    }
    this.pendingRequests.clear()
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      // Reject all pending requests
      for (const [, pending] of this.pendingRequests.entries()) {
        clearTimeout(pending.timeout)
        pending.reject(new Error('Worker terminated'))
      }
      this.pendingRequests.clear()

      this.worker.terminate()
      this.worker = null
    }
  }

  /**
   * Check if worker is ready
   */
  isReady(): boolean {
    return this.worker !== null
  }
}
