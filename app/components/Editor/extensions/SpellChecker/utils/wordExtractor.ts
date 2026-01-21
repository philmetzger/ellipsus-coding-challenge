import { Node as ProseMirrorNode } from '@tiptap/pm/model'

/**
 * Represents a word found in the document with its position
 */
export interface WordPosition {
  word: string
  from: number
  to: number
}

/**
 * Normalize a word by converting to lowercase and removing leading/trailing punctuation
 * @param word - Word to normalize
 * @returns Normalized word
 */
export function normalizeWord(word: string): string {
  // Remove leading/trailing punctuation but keep apostrophes and hyphens within words
  return word.toLowerCase().replace(/^[^\w']+|[^\w']+$/g, '')
}

/**
 * Check if a word should be checked (not too short, not a number, etc.)
 * @param word - Word to check
 * @returns Whether the word should be spell-checked
 */
export function shouldCheckWord(word: string): boolean {
  const normalized = normalizeWord(word)
  // Skip very short words, numbers, or empty strings
  if (normalized.length < 2) return false
  // Skip if it's purely numeric
  if (/^\d+$/.test(normalized)) return false
  return true
}

/**
 * Extract words from a ProseMirror document
 * Only extracts from text nodes, skipping code blocks and other non-text content
 * @param doc - ProseMirror document
 * @returns Array of word positions
 */
export function extractWords(doc: ProseMirrorNode): WordPosition[] {
  const words: WordPosition[] = []
  const wordBoundaryRegex = /\b[\w'-]+\b/g

  doc.descendants((node, pos) => {
    // Skip code blocks, code marks, and other non-text nodes
    if (node.type.name === 'codeBlock' || node.type.name === 'code') {
      return false
    }

    // Only process text nodes
    if (node.isText) {
      const text = node.text || ''
      let match: RegExpExecArray | null

      while ((match = wordBoundaryRegex.exec(text)) !== null) {
        const word = match[0]
        const wordStart = pos + match.index
        const wordEnd = wordStart + word.length
        const indexAfterWord = match.index + word.length

        // Only include words that have a trailing boundary (space or punctuation)
        // This prevents checking incomplete words while the user is still typing
        // Words at the end of text with no trailing character are considered incomplete
        const hasTrailingBoundary =
          indexAfterWord < text.length &&
          /[\s\n.,!?;:'")\]}]/.test(text[indexAfterWord]) // Whitespace or punctuation

        if (shouldCheckWord(word) && hasTrailingBoundary) {
          // Preserve original case - only strip leading/trailing punctuation
          // Case-sensitive checking is handled by the worker
          const cleanWord = word.replace(/^[^\w']+|[^\w']+$/g, '')
          words.push({
            word: cleanWord,
            from: wordStart,
            to: wordEnd,
          })
        }
      }
    }

    return true
  })

  return words
}

/**
 * Find all instances of a specific word in the document
 * @param doc - ProseMirror document
 * @param targetWord - Word to find (will be normalized for comparison)
 * @returns Array of positions where the word appears
 */
export function findAllInstances(
  doc: ProseMirrorNode,
  targetWord: string
): WordPosition[] {
  const normalizedTarget = normalizeWord(targetWord)
  const instances: WordPosition[] = []
  const wordBoundaryRegex = /\b[\w'-]+\b/g

  doc.descendants((node, pos) => {
    // Skip code blocks, code marks, and other non-text nodes
    if (node.type.name === 'codeBlock' || node.type.name === 'code') {
      return false
    }

    // Only process text nodes
    if (node.isText) {
      const text = node.text || ''
      let match: RegExpExecArray | null

      while ((match = wordBoundaryRegex.exec(text)) !== null) {
        const word = match[0]
        const normalizedWord = normalizeWord(word)

        // Match case-insensitively
        if (normalizedWord === normalizedTarget) {
          const wordStart = pos + match.index
          const wordEnd = wordStart + word.length

          instances.push({
            word: normalizedWord,
            from: wordStart,
            to: wordEnd,
          })
        }
      }
    }

    return true
  })

  return instances
}

/**
 * Calculate Levenshtein edit distance between two strings
 * Returns the minimum number of single-character edits (insertions, deletions, substitutions) needed
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Edit distance (lower is more similar)
 */
export function calculateEditDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length

  // Create a matrix to store distances
  const matrix: number[][] = []

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        // Characters match, no edit needed
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        // Take minimum of insert, delete, or substitute
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + 1  // substitution
        )
      }
    }
  }

  return matrix[len1][len2]
}
