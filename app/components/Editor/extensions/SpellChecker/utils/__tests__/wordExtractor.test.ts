import { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Schema } from '@tiptap/pm/model'
import { extractWords, normalizeWord, shouldCheckWord } from '../wordExtractor'

// Create a simple schema for testing
const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { content: 'inline*', group: 'block' },
    text: { group: 'inline' },
  },
  marks: {},
})

describe('wordExtractor', () => {
  describe('normalizeWord', () => {
    it('should convert to lowercase', () => {
      expect(normalizeWord('HELLO')).toBe('hello')
      expect(normalizeWord('Hello')).toBe('hello')
    })

    it('should remove leading/trailing punctuation', () => {
      expect(normalizeWord('"hello"')).toBe('hello')
      expect(normalizeWord('(world)')).toBe('world')
      expect(normalizeWord('.test.')).toBe('test')
    })

    it('should preserve apostrophes and hyphens within words', () => {
      expect(normalizeWord("don't")).toBe("don't")
      expect(normalizeWord('well-known')).toBe('well-known')
    })
  })

  describe('shouldCheckWord', () => {
    it('should return false for very short words', () => {
      expect(shouldCheckWord('a')).toBe(false)
      expect(shouldCheckWord('I')).toBe(false)
    })

    it('should return false for numbers', () => {
      expect(shouldCheckWord('123')).toBe(false)
      expect(shouldCheckWord('42')).toBe(false)
    })

    it('should return true for valid words', () => {
      expect(shouldCheckWord('hello')).toBe(true)
      expect(shouldCheckWord('world')).toBe(true)
      expect(shouldCheckWord("don't")).toBe(true)
    })
  })

  describe('extractWords', () => {
    it('should extract complete words with trailing space preserving case', () => {
      const doc = schema.node('doc', null, [
        schema.node('paragraph', null, [schema.text('Hello world ')]),
      ])

      const words = extractWords(doc)
      expect(words).toHaveLength(2)
      // Original case is preserved for proper noun support (e.g., "Monday")
      expect(words[0].word).toBe('Hello')
      expect(words[0].from).toBe(1)
      expect(words[0].to).toBe(6)
      expect(words[1].word).toBe('world')
      expect(words[1].from).toBe(7)
      expect(words[1].to).toBe(12)
    })

    it('should skip code blocks', () => {
      const codeSchema = new Schema({
        nodes: {
          doc: { content: 'block+' },
          paragraph: { content: 'inline*', group: 'block' },
          codeBlock: { content: 'text*', group: 'block' },
          text: { group: 'inline' },
        },
        marks: {},
      })

      const doc = codeSchema.node('doc', null, [
        codeSchema.node('paragraph', null, [codeSchema.text('Hello world ')]),
        codeSchema.node('codeBlock', null, [codeSchema.text('misspelled code')]),
      ])

      const words = extractWords(doc)
      // Should only extract from paragraph, not code block
      expect(words).toHaveLength(2)
      // Original case is preserved
      expect(words.every((w) => w.word === 'Hello' || w.word === 'world')).toBe(true)
    })

    it('should handle empty documents', () => {
      const doc = schema.node('doc', null, [schema.node('paragraph', null, [])])
      const words = extractWords(doc)
      expect(words).toHaveLength(0)
    })

    it('should handle words with punctuation preserving case', () => {
      const doc = schema.node('doc', null, [
        schema.node('paragraph', null, [schema.text('Hello, world!')]),
      ])

      const words = extractWords(doc)
      expect(words).toHaveLength(2)
      // Original case is preserved
      expect(words[0].word).toBe('Hello')
      expect(words[1].word).toBe('world')
    })

    it('should preserve case for proper nouns like Monday', () => {
      const doc = schema.node('doc', null, [
        schema.node('paragraph', null, [schema.text('Monday is the first day ')]),
      ])

      const words = extractWords(doc)
      expect(words).toHaveLength(5)
      // "Monday" preserved with capital M for proper noun checking
      expect(words[0].word).toBe('Monday')
      expect(words[1].word).toBe('is')
      expect(words[2].word).toBe('the')
      expect(words[3].word).toBe('first')
      expect(words[4].word).toBe('day')
    })

    it('should skip incomplete words being typed (no trailing boundary)', () => {
      // Simulates user typing "Hello worl" - "worl" has no space after it
      const doc = schema.node('doc', null, [
        schema.node('paragraph', null, [schema.text('Hello worl')]),
      ])

      const words = extractWords(doc)
      // Only "Hello" should be extracted, "worl" is incomplete (no trailing boundary)
      expect(words).toHaveLength(1)
      expect(words[0].word).toBe('Hello')
    })

    it('should skip words at end of text node without trailing boundary', () => {
      // Word at end of paragraph without trailing space is incomplete
      const doc = schema.node('doc', null, [
        schema.node('paragraph', null, [schema.text('Hello world')]),
      ])

      const words = extractWords(doc)
      // Only "Hello" should be extracted - "world" has no trailing boundary
      expect(words).toHaveLength(1)
      expect(words[0].word).toBe('Hello')
    })

    it('should include words followed by punctuation', () => {
      const doc = schema.node('doc', null, [
        schema.node('paragraph', null, [schema.text('Hello, world!')]),
      ])

      const words = extractWords(doc)
      // Both words have trailing boundaries (comma, exclamation mark)
      expect(words).toHaveLength(2)
      expect(words[0].word).toBe('Hello')
      expect(words[1].word).toBe('world')
    })
  })
})
