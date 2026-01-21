import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { SpellCheckerService } from '../services/SpellCheckerService'
import { extractWords } from '../utils/wordExtractor'
import { SPELLCHECK_MISSPELLED_CLASS, DEFAULT_DEBOUNCE_MS } from '../utils/constants'
import type { LanguageCode } from '../utils/constants'
import type { ContextMenuState } from '../types'

/**
 * Plugin state interface
 */
interface SpellCheckerPluginState {
  decorations: DecorationSet
  shouldRescan: boolean
  generation: number
}

/**
 * Scan document and create decorations for misspelled words
 * Uses generation pattern - only checks generation at start and end
 */
async function scanDocument(
  doc: ProseMirrorNode,
  spellCheckerService: SpellCheckerService,
  language: LanguageCode,
  isEnabled: () => boolean
): Promise<DecorationSet> {
  // Early return if disabled
  if (!isEnabled()) {
    return DecorationSet.empty
  }
  
  const words = extractWords(doc)
  
  if (words.length === 0) {
    return DecorationSet.empty
  }
  
  const wordTexts = words.map((w) => w.word)
  
  // Check if still enabled before async operation
  if (!isEnabled()) {
    return DecorationSet.empty
  }
  
  // Check words with worker
  const checkResults = await spellCheckerService.checkWords(wordTexts, language)

  // Check if still enabled after async operation
  if (!isEnabled()) {
    return DecorationSet.empty
  }

  // Collect misspelled words
  const misspelledWords = words.filter((wordPos) => {
    const isCorrect = checkResults.get(wordPos.word) ?? true
    return !isCorrect
  })

  if (misspelledWords.length === 0) {
    return DecorationSet.empty
  }

  // Fetch suggestions for all misspelled words in parallel
  const suggestionPromises = misspelledWords.map((wordPos) =>
    spellCheckerService.getSuggestions(wordPos.word, language).then((suggestions) => ({
      wordPos,
      suggestions,
    }))
  )

  const suggestionResults = await Promise.all(suggestionPromises)

  // Check if still enabled after fetching suggestions
  if (!isEnabled()) {
    return DecorationSet.empty
  }

  const decorations: Decoration[] = []

  // Only highlight words that have suggestions
  for (const { wordPos, suggestions } of suggestionResults) {
    if (suggestions.length > 0) {
      decorations.push(
        Decoration.inline(wordPos.from, wordPos.to, {
          class: SPELLCHECK_MISSPELLED_CLASS,
          'data-word': wordPos.word,
          'data-from': wordPos.from.toString(),
          'data-to': wordPos.to.toString(),
        })
      )
    }
  }

  return DecorationSet.create(doc, decorations)
}

/**
 * Create the ProseMirror plugin for spell checking
 * Uses generation pattern for reliable state management
 */
export function createSpellCheckerPlugin(
  spellCheckerService: SpellCheckerService,
  options: {
    getEnabled: () => boolean
    getLanguage: () => LanguageCode
    getScanGeneration: () => number
    onContextMenu: (state: ContextMenuState) => void
    onDismissContextMenu: () => void
  }
): Plugin<SpellCheckerPluginState> {
  const pluginKey = new PluginKey<SpellCheckerPluginState>('spellChecker')

  return new Plugin<SpellCheckerPluginState>({
    key: pluginKey,

    state: {
      init: () => {
        return {
          decorations: DecorationSet.empty,
          shouldRescan: false,
          generation: options.getScanGeneration(),
        }
      },

      apply: (tr, value) => {
        // Get current generation
        const currentGeneration = options.getScanGeneration()
        
        // If disabled, clear everything
        if (!options.getEnabled()) {
          return {
            decorations: DecorationSet.empty,
            shouldRescan: false,
            generation: currentGeneration,
          }
        }

        // Map existing decorations through document changes
        let decorations = value.decorations.map(tr.mapping, tr.doc)

        // Update decorations if explicitly requested
        if (tr.getMeta('spellcheck-update-decorations')) {
          const newDecorations = tr.getMeta('spellcheck-decorations')
          const trGeneration = tr.getMeta('spellcheck-generation')
          
          // Only apply if generation matches (or no generation specified)
          if (newDecorations instanceof DecorationSet) {
            if (trGeneration === undefined || trGeneration === currentGeneration) {
              if (options.getEnabled()) {
                decorations = newDecorations
              } else {
                decorations = DecorationSet.empty
              }
            }
          }
        }

        // Check if re-scan was requested - only true for one transaction cycle
        // This prevents the update function from re-triggering scans indefinitely
        const shouldRescan = tr.getMeta('spellcheck-trigger-scan') === true

        return {
          decorations,
          shouldRescan,
          generation: currentGeneration,
        }
      },
    },

    view: (view) => {
      let scanTimeout: NodeJS.Timeout | null = null

      const scheduleScan = () => {
        // Clear any pending scan
        if (scanTimeout) {
          clearTimeout(scanTimeout)
          scanTimeout = null
        }
        
        // Don't scan if disabled
        if (!options.getEnabled()) {
          return
        }

        // Capture generation at scan start
        const scanGeneration = options.getScanGeneration()
        const scanLanguage = options.getLanguage()

        scanTimeout = setTimeout(async () => {
          // Check generation before starting - if changed, abort silently
          if (options.getScanGeneration() !== scanGeneration) {
            return
          }
          
          // Check if still enabled
          if (!options.getEnabled()) {
            return
          }

          const state = view.state
          try {
            const newDecorations = await scanDocument(
              state.doc, 
              spellCheckerService, 
              scanLanguage,
              options.getEnabled
            )
            
            // Check generation after async operation - if changed, discard results silently
            if (options.getScanGeneration() !== scanGeneration) {
              return
            }
            
            // Check if still enabled
            if (!options.getEnabled()) {
              return
            }

            // Check if document changed significantly
            const currentState = view.state
            if (currentState.doc.content.size !== state.doc.content.size) {
              // Document changed, let next scan handle it
              return
            }

            // Apply decorations with generation
            try {
              const tr = currentState.tr
                .setMeta('spellcheck-update-decorations', true)
                .setMeta('spellcheck-decorations', newDecorations)
                .setMeta('spellcheck-generation', scanGeneration)
              view.dispatch(tr)
            } catch {
              // Transaction mismatch, silently skip
            }
          } catch {
            // Silently handle errors (likely cancelled operations)
          }
        }, DEFAULT_DEBOUNCE_MS)
      }

      // Initial scan
      if (options.getEnabled()) {
        scheduleScan()
      }

      return {
        update: (view, prevState) => {
          // If disabled, just clear timeout and return - NO dispatching from update
          // The extension command handles clearing decorations when disabling
          if (!options.getEnabled()) {
            if (scanTimeout) {
              clearTimeout(scanTimeout)
              scanTimeout = null
            }
            return
          }

          // Check shouldRescan flag from transaction meta
          // This is set by setSpellCheckerLanguage AFTER dictionary loads and language is updated
          const pluginState = pluginKey.getState(view.state)
          if (pluginState?.shouldRescan) {
            scheduleScan()
            return
          }

          // Scan on document changes at word boundaries
          if (view.state.doc !== prevState.doc) {
            const currentText = view.state.doc.textContent
            const prevText = prevState.doc.textContent
            
            if (currentText.length > prevText.length) {
              const lastChar = currentText.slice(-1)
              const isWordBoundary = /[\s\n.,!?;:]/.test(lastChar)
              if (isWordBoundary) {
                scheduleScan()
              }
            } else {
              // Text deleted, scan to update decorations
              scheduleScan()
            }
          }
        },
        destroy: () => {
          if (scanTimeout) {
            clearTimeout(scanTimeout)
          }
        },
      }
    },

    props: {
      decorations(state) {
        if (!options.getEnabled()) {
          return DecorationSet.empty
        }
        const pluginState = pluginKey.getState(state)
        return pluginState?.decorations || DecorationSet.empty
      },

      handleDOMEvents: {
        contextmenu: (view, event) => {
          // Check if enabled
          if (!options.getEnabled()) {
            return false
          }

          const { clientX, clientY } = event
          const coords = view.posAtCoords({ left: clientX, top: clientY })

          if (!coords) {
            return false
          }

          const { pos } = coords
          const pluginState = pluginKey.getState(view.state)
          const decorations = pluginState?.decorations

          if (!decorations) {
            return false
          }

          // Find decoration at this position
          const decorationAtPos = decorations.find(pos, pos)
          if (decorationAtPos && decorationAtPos.length > 0) {
            event.preventDefault()

            const decoration = decorationAtPos[0]
            const from = decoration.from
            const to = decoration.to
            const word = view.state.doc.textBetween(from, to).trim()

            if (word) {
              // Capture generation for this context menu request
              const menuGeneration = options.getScanGeneration()
              
              spellCheckerService.getSuggestions(word, options.getLanguage()).then((suggestions) => {
                // Check generation - if changed, don't show menu
                if (options.getScanGeneration() !== menuGeneration) {
                  return
                }
                
                if (!options.getEnabled()) {
                  return
                }
                
                options.onContextMenu({
                  visible: true,
                  word,
                  position: { x: clientX, y: clientY },
                  suggestions,
                  wordRange: { from, to },
                })

                const tr = view.state.tr.setMeta('spellcheck-context-menu', true)
                view.dispatch(tr)
              }).catch(() => {
                // Silently handle errors
              })
            }

            return true
          }

          return false
        },
      },
    },
  })
}
