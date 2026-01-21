/**
 * SpellChecker Extension for Tiptap
 * Main export file
 */

// Core extension and UI components
export { SpellCheckerExtension } from './SpellCheckerExtension'
export { SpellCheckerUI } from './SpellCheckerUI'
export { SpellCheckerWrapper } from './SpellCheckerWrapper'
export { ContextMenu } from './ContextMenu'
export { SpellCheckerControls } from './SpellCheckerControls'

// Constants and types
export { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE } from './utils/constants'
export type { LanguageCode } from './utils/constants'
export type { SpellCheckerOptions, SpellCheckerStorage, ContextMenuState } from './types'
