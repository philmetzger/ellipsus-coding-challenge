import { getBaseExtensions, getExtensions, configurePlaceholder } from '../getExtensions'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

// Mock Tiptap extensions
jest.mock('@tiptap/starter-kit')
jest.mock('@tiptap/extension-placeholder', () => ({
  __esModule: true,
  default: {
    configure: jest.fn((config) => ({ name: 'placeholder', ...config })),
  },
}))

describe('getExtensions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getBaseExtensions', () => {
    it('should return array with StarterKit', () => {
      const extensions = getBaseExtensions()
      expect(extensions).toHaveLength(1)
      expect(extensions[0]).toBe(StarterKit)
    })
  })

  describe('configurePlaceholder', () => {
    it('should configure placeholder with default text', () => {
      const extension = configurePlaceholder()
      expect(Placeholder.configure).toHaveBeenCalledWith({
        placeholder: 'Start typing...',
      })
    })

    it('should configure placeholder with custom text', () => {
      const customPlaceholder = 'Custom placeholder text'
      configurePlaceholder(customPlaceholder)
      expect(Placeholder.configure).toHaveBeenCalledWith({
        placeholder: customPlaceholder,
      })
    })
  })

  describe('getExtensions', () => {
    it('should return base extensions and placeholder', () => {
      const extensions = getExtensions()
      expect(extensions.length).toBeGreaterThan(1)
    })

    it('should include additional extensions', () => {
      const additionalExtension = { name: 'custom' }
      const extensions = getExtensions([additionalExtension])
      expect(extensions).toContain(additionalExtension)
    })

    it('should use custom placeholder when provided', () => {
      const customPlaceholder = 'Type here...'
      getExtensions([], customPlaceholder)
      expect(Placeholder.configure).toHaveBeenCalledWith({
        placeholder: customPlaceholder,
      })
    })
  })
})
