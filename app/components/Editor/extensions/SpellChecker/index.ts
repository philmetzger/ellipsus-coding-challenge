/**
 * SpellChecker Extension for Tiptap
 * Main export file - re-exports from organized subdirectories
 */

// Core extension
export { SpellCheckerExtension } from './core'
export { createSpellCheckerPlugin } from './core'

// UI components
export { SpellCheckerUI, SpellCheckerWrapper, ContextMenu, SpellCheckerControls } from './ui'

// Services (for advanced usage)
export { SpellCheckerService, DictionaryManager, WorkerManager } from './services'

// Hooks
export { useSpellCheckerExtension, isSpellCheckerEnabled } from './hooks'

// Constants and types
export { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE } from './utils/constants'
export type { LanguageCode } from './utils/constants'
export type { SpellCheckerOptions, SpellCheckerStorage, ContextMenuState } from './types'
