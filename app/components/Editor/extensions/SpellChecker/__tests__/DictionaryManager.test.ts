import { DictionaryManager } from '../DictionaryManager'
import nspell from 'nspell'

// Mock dictionary-en
jest.mock('dictionary-en', () => ({
  __esModule: true,
  default: async () => ({
    aff: Buffer.from('SET UTF-8\n'),
    dic: Buffer.from('1\nhello\n'),
  }),
}))

describe('DictionaryManager', () => {
  let manager: DictionaryManager

  beforeEach(() => {
    manager = DictionaryManager.getInstance()
    manager.clearCache()
  })

  afterEach(() => {
    manager.clearCache()
  })

  it('should be a singleton', () => {
    const instance1 = DictionaryManager.getInstance()
    const instance2 = DictionaryManager.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('should load a dictionary', async () => {
    const spell = await manager.loadDictionary('en')
    expect(spell).toBeDefined()
    expect(typeof spell.correct).toBe('function')
  })

  it('should cache loaded dictionaries', async () => {
    const spell1 = await manager.loadDictionary('en')
    const spell2 = await manager.loadDictionary('en')
    expect(spell1).toBe(spell2)
  })

  it('should return worker manager', async () => {
    await manager.loadDictionary('en')
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
})
