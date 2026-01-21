import { defaultEditorConfig, sizeConfig, defaultEditorProps } from '../editorConfig'

describe('editorConfig', () => {
  describe('defaultEditorConfig', () => {
    it('should have default placeholder', () => {
      expect(defaultEditorConfig.defaultPlaceholder).toBe('Start typing...')
    })

    it('should have default size', () => {
      expect(defaultEditorConfig.defaultSize).toBe('l')
    })

    it('should have editor class name', () => {
      expect(defaultEditorConfig.editorClassName).toBe('tiptap-editor')
    })
  })

  describe('sizeConfig', () => {
    it('should have configurations for all sizes', () => {
      expect(sizeConfig.s).toBeDefined()
      expect(sizeConfig.m).toBeDefined()
      expect(sizeConfig.l).toBeDefined()
    })

    it('should have minHeight and padding for each size', () => {
      Object.values(sizeConfig).forEach((config) => {
        expect(config).toHaveProperty('minHeight')
        expect(config).toHaveProperty('padding')
      })
    })

    it('should have increasing minHeight for larger sizes', () => {
      const sHeight = parseInt(sizeConfig.s.minHeight)
      const mHeight = parseInt(sizeConfig.m.minHeight)
      const lHeight = parseInt(sizeConfig.l.minHeight)

      expect(lHeight).toBeGreaterThan(mHeight)
      expect(mHeight).toBeGreaterThan(sHeight)
    })
  })

  describe('defaultEditorProps', () => {
    it('should have attributes with class', () => {
      expect(defaultEditorProps.attributes).toHaveProperty('class')
      expect(defaultEditorProps.attributes.class).toBe('tiptap-editor')
    })

    it('should have immediatelyRender set to false', () => {
      expect(defaultEditorProps.immediatelyRender).toBe(false)
    })
  })
})
