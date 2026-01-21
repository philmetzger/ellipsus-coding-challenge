/**
 * useSpellCheckerExtension Hook Tests
 */

import React from 'react'
import { renderHook } from '@testing-library/react'
import { useSpellCheckerExtension, isSpellCheckerEnabled } from '../useSpellCheckerExtension'

describe('useSpellCheckerExtension', () => {
  const createMockEditor = (extensions: any[] = []) => ({
    extensionManager: {
      extensions,
    },
  })

  const createMockSpellCheckerExtension = (options = { enabled: true }) => ({
    name: 'spellChecker',
    options,
    storage: { enabled: options.enabled, language: 'en' },
  })

  describe('when editor is null', () => {
    it('should return null', () => {
      const { result } = renderHook(() => useSpellCheckerExtension(null))
      expect(result.current).toBeNull()
    })
  })

  describe('when extension is not found', () => {
    it('should return null', () => {
      const editor = createMockEditor([
        { name: 'document' },
        { name: 'paragraph' },
      ])
      
      const { result } = renderHook(() => useSpellCheckerExtension(editor as any))
      expect(result.current).toBeNull()
    })
  })

  describe('when extension is found', () => {
    it('should return the extension', () => {
      const spellCheckerExtension = createMockSpellCheckerExtension()
      const editor = createMockEditor([
        { name: 'document' },
        spellCheckerExtension,
        { name: 'paragraph' },
      ])
      
      const { result } = renderHook(() => useSpellCheckerExtension(editor as any))
      expect(result.current).toBe(spellCheckerExtension)
    })
  })

  describe('memoization', () => {
    it('should return the same reference when editor has not changed', () => {
      const spellCheckerExtension = createMockSpellCheckerExtension()
      const editor = createMockEditor([spellCheckerExtension])
      
      const { result, rerender } = renderHook(() => useSpellCheckerExtension(editor as any))
      
      const firstResult = result.current
      rerender()
      
      expect(result.current).toBe(firstResult)
    })

    it('should update when editor changes', () => {
      const spellCheckerExtension1 = createMockSpellCheckerExtension({ enabled: true })
      const spellCheckerExtension2 = createMockSpellCheckerExtension({ enabled: false })
      
      const editor1 = createMockEditor([spellCheckerExtension1])
      const editor2 = createMockEditor([spellCheckerExtension2])
      
      const { result, rerender } = renderHook(
        ({ editor }) => useSpellCheckerExtension(editor as any),
        { initialProps: { editor: editor1 } }
      )
      
      expect(result.current).toBe(spellCheckerExtension1)
      
      rerender({ editor: editor2 })
      
      expect(result.current).toBe(spellCheckerExtension2)
    })
  })
})

describe('isSpellCheckerEnabled', () => {
  const createExtension = (enabled: boolean) => ({
    name: 'spellChecker',
    options: { enabled },
  })

  describe('when extension is null', () => {
    it('should return false', () => {
      expect(isSpellCheckerEnabled(null)).toBe(false)
    })
  })

  describe('when extension is enabled', () => {
    it('should return true', () => {
      const extension = createExtension(true)
      expect(isSpellCheckerEnabled(extension as any)).toBe(true)
    })
  })

  describe('when extension is disabled', () => {
    it('should return false', () => {
      const extension = createExtension(false)
      expect(isSpellCheckerEnabled(extension as any)).toBe(false)
    })
  })

  describe('when options is undefined', () => {
    it('should return false', () => {
      const extension = { name: 'spellChecker' }
      expect(isSpellCheckerEnabled(extension as any)).toBe(false)
    })
  })
})
