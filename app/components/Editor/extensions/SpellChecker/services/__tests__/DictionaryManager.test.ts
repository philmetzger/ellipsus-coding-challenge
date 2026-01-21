import { DictionaryManager } from '../DictionaryManager'

// Mock WorkerManager
jest.mock('../WorkerManager', () => ({
  WorkerManager: {
    getInstance: jest.fn(() => ({
      loadDictionary: jest.fn().mockResolvedValue(undefined),
      getCurrentLanguage: jest.fn().mockResolvedValue('en'),
      checkWord: jest.fn().mockResolvedValue(true),
      getSuggestions: jest.fn().mockResolvedValue(['hello']),
    })),
  },
}))

describe('DictionaryManager', () => {
  let manager: DictionaryManager

  beforeEach(() => {
    // Reset the singleton for testing
    DictionaryManager.resetInstance()
    manager = DictionaryManager.getInstance()
  })

  afterEach(() => {
    manager.clearCache()
    DictionaryManager.resetInstance()
  })

  it('should be a singleton', () => {
    const instance1 = DictionaryManager.getInstance()
    const instance2 = DictionaryManager.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('should load a dictionary', async () => {
    await manager.loadDictionary('en')
    expect(manager.isDictionaryLoaded('en')).toBe(true)
  })

  it('should return worker manager', () => {
    const workerManager = manager.getWorkerManager()
    expect(workerManager).toBeDefined()
  })

  it('should check if dictionary is loaded', async () => {
    expect(manager.isDictionaryLoaded('en')).toBe(false)
    await manager.loadDictionary('en')
    expect(manager.isDictionaryLoaded('en')).toBe(true)
  })

  it('should switch language', async () => {
    await manager.loadDictionary('en')
    await manager.switchLanguage('en')
    expect(manager.getCurrentLanguage()).toBe('en')
  })

  it('should clear cache', async () => {
    await manager.loadDictionary('en')
    expect(manager.isDictionaryLoaded('en')).toBe(true)
    manager.clearCache()
    expect(manager.isDictionaryLoaded('en')).toBe(false)
  })
})
