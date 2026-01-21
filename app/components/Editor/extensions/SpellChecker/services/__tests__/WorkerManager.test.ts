/**
 * WorkerManager Tests
 * Tests for the Web Worker communication manager
 */

import { WorkerManager } from '../WorkerManager'

// Mock the Worker class
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: ErrorEvent) => void) | null = null
  postMessage = jest.fn()
  terminate = jest.fn()
}

// Store reference to created workers for testing
let mockWorkerInstance: MockWorker | null = null

describe('WorkerManager', () => {
  // Setup mock Worker before all tests
  const originalWorker = global.Worker

  beforeAll(() => {
    global.Worker = jest.fn().mockImplementation(() => {
      mockWorkerInstance = new MockWorker()
      return mockWorkerInstance
    }) as unknown as typeof Worker
  })

  afterAll(() => {
    global.Worker = originalWorker
  })

  beforeEach(() => {
    // Reset singleton and mocks
    WorkerManager.resetInstance()
    mockWorkerInstance = null
    jest.clearAllMocks()
  })

  afterEach(() => {
    WorkerManager.resetInstance()
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = WorkerManager.getInstance()
      const instance2 = WorkerManager.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should create new instance after reset', () => {
      const instance1 = WorkerManager.getInstance()
      WorkerManager.resetInstance()
      const instance2 = WorkerManager.getInstance()
      expect(instance1).not.toBe(instance2)
    })
  })

  describe('loadDictionary', () => {
    it('should send LOAD_DICTIONARY message to worker', async () => {
      const manager = WorkerManager.getInstance()
      const promise = manager.loadDictionary('en')

      // Wait for worker to be created
      await new Promise(resolve => setTimeout(resolve, 0))

      // Check message was sent
      expect(mockWorkerInstance?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'LOAD_DICTIONARY',
          language: 'en',
          requestId: expect.any(String),
        })
      )

      // Simulate response
      const call = mockWorkerInstance?.postMessage.mock.calls[0][0]
      mockWorkerInstance?.onmessage?.({
        data: { type: 'SUCCESS', requestId: call.requestId, data: undefined },
      } as MessageEvent)

      await promise
    })
  })

  describe('checkWord', () => {
    it('should send CHECK_WORD message and return result', async () => {
      const manager = WorkerManager.getInstance()
      const promise = manager.checkWord('hello')

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockWorkerInstance?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CHECK_WORD',
          word: 'hello',
        })
      )

      const call = mockWorkerInstance?.postMessage.mock.calls[0][0]
      mockWorkerInstance?.onmessage?.({
        data: { type: 'SUCCESS', requestId: call.requestId, data: true },
      } as MessageEvent)

      await expect(promise).resolves.toBe(true)
    })
  })

  describe('checkWords', () => {
    it('should send CHECK_WORDS message with array of words', async () => {
      const manager = WorkerManager.getInstance()
      const words = ['hello', 'world', 'test']
      const promise = manager.checkWords(words)

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockWorkerInstance?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CHECK_WORDS',
          words,
        })
      )

      const call = mockWorkerInstance?.postMessage.mock.calls[0][0]
      mockWorkerInstance?.onmessage?.({
        data: {
          type: 'SUCCESS',
          requestId: call.requestId,
          data: { hello: true, world: true, test: false },
        },
      } as MessageEvent)

      const result = await promise
      expect(result).toBeInstanceOf(Map)
      expect(result.get('hello')).toBe(true)
      expect(result.get('test')).toBe(false)
    })
  })

  describe('getSuggestions', () => {
    it('should send GET_SUGGESTIONS message and return array', async () => {
      const manager = WorkerManager.getInstance()
      const promise = manager.getSuggestions('helo')

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockWorkerInstance?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'GET_SUGGESTIONS',
          word: 'helo',
        })
      )

      const call = mockWorkerInstance?.postMessage.mock.calls[0][0]
      mockWorkerInstance?.onmessage?.({
        data: {
          type: 'SUCCESS',
          requestId: call.requestId,
          data: ['hello', 'help', 'hero'],
        },
      } as MessageEvent)

      await expect(promise).resolves.toEqual(['hello', 'help', 'hero'])
    })
  })

  describe('getCurrentLanguage', () => {
    it('should return current language from worker', async () => {
      const manager = WorkerManager.getInstance()
      const promise = manager.getCurrentLanguage()

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockWorkerInstance?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'GET_CURRENT_LANGUAGE',
        })
      )

      const call = mockWorkerInstance?.postMessage.mock.calls[0][0]
      mockWorkerInstance?.onmessage?.({
        data: { type: 'SUCCESS', requestId: call.requestId, data: 'en' },
      } as MessageEvent)

      await expect(promise).resolves.toBe('en')
    })
  })

  describe('cancelAllPendingRequests', () => {
    it('should reject all pending requests', async () => {
      const manager = WorkerManager.getInstance()

      // Start some requests
      const promise1 = manager.checkWord('hello')
      const promise2 = manager.checkWord('world')

      await new Promise(resolve => setTimeout(resolve, 0))

      // Cancel all
      manager.cancelAllPendingRequests()

      // Both should reject
      await expect(promise1).rejects.toThrow('Request cancelled')
      await expect(promise2).rejects.toThrow('Request cancelled')
    })

    it('should clear pending requests count', async () => {
      const manager = WorkerManager.getInstance()

      // Start some requests (don't await) - catch errors to prevent unhandled rejections
      const p1 = manager.checkWord('hello').catch(() => {})
      const p2 = manager.checkWord('world').catch(() => {})

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(manager.getPendingRequestCount()).toBe(2)

      manager.cancelAllPendingRequests()

      expect(manager.getPendingRequestCount()).toBe(0)
      
      // Wait for the caught rejections to complete
      await Promise.all([p1, p2])
    })
  })

  describe('terminate', () => {
    it('should terminate the worker', async () => {
      const manager = WorkerManager.getInstance()

      // Create worker
      const promise = manager.loadDictionary('en')
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const call = mockWorkerInstance?.postMessage.mock.calls[0][0]
      mockWorkerInstance?.onmessage?.({
        data: { type: 'SUCCESS', requestId: call.requestId },
      } as MessageEvent)
      await promise

      // Terminate
      manager.terminate()

      expect(mockWorkerInstance?.terminate).toHaveBeenCalled()
    })

    it('should reject pending requests on terminate', async () => {
      const manager = WorkerManager.getInstance()

      const promise = manager.checkWord('hello')
      await new Promise(resolve => setTimeout(resolve, 0))
      
      manager.terminate()

      await expect(promise).rejects.toThrow('Worker terminated')
    })
  })

  describe('error handling', () => {
    it('should handle worker error', async () => {
      const manager = WorkerManager.getInstance()
      
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation()

      const promise = manager.checkWord('hello')
      await new Promise(resolve => setTimeout(resolve, 0))

      // Simulate worker error
      mockWorkerInstance?.onerror?.({
        message: 'Worker crashed',
      } as ErrorEvent)

      await expect(promise).rejects.toThrow('Worker error')
      
      consoleError.mockRestore()
    })

    it('should handle ERROR response from worker', async () => {
      const manager = WorkerManager.getInstance()

      const promise = manager.checkWord('hello')
      await new Promise(resolve => setTimeout(resolve, 0))

      const call = mockWorkerInstance?.postMessage.mock.calls[0][0]
      mockWorkerInstance?.onmessage?.({
        data: {
          type: 'ERROR',
          requestId: call.requestId,
          error: 'Dictionary not loaded',
        },
      } as MessageEvent)

      await expect(promise).rejects.toThrow('Dictionary not loaded')
    })
  })

  describe('isReady', () => {
    it('should return false before worker is created', () => {
      const manager = WorkerManager.getInstance()
      expect(manager.isReady()).toBe(false)
    })

    it('should return true after worker is created', async () => {
      const manager = WorkerManager.getInstance()

      const promise = manager.loadDictionary('en')
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const call = mockWorkerInstance?.postMessage.mock.calls[0][0]
      mockWorkerInstance?.onmessage?.({
        data: { type: 'SUCCESS', requestId: call.requestId },
      } as MessageEvent)
      await promise

      expect(manager.isReady()).toBe(true)
    })

    it('should return false after terminate', async () => {
      const manager = WorkerManager.getInstance()

      const promise = manager.loadDictionary('en')
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const call = mockWorkerInstance?.postMessage.mock.calls[0][0]
      mockWorkerInstance?.onmessage?.({
        data: { type: 'SUCCESS', requestId: call.requestId },
      } as MessageEvent)
      await promise

      manager.terminate()

      expect(manager.isReady()).toBe(false)
    })
  })
})
