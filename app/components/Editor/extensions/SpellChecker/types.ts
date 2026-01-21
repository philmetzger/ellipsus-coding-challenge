import type { LanguageCode } from "./utils/constants";
import type { SpellCheckerService } from "./services/SpellCheckerService";

/**
 * Configuration options for the SpellChecker extension
 */
export interface SpellCheckerOptions {
  /** Whether spellchecker is enabled */
  enabled: boolean;
  /** Language code for spell checking */
  language: LanguageCode;
  /** Debounce delay in milliseconds for document scanning */
  debounceMs: number;
}

/**
 * Storage interface for the SpellChecker extension
 */
export interface SpellCheckerStorage {
  enabled: boolean;
  language: LanguageCode;
  /** Increments on every state change (toggle/language switch) to invalidate pending operations */
  scanGeneration: number;
  contextMenuState: ContextMenuState | null;
  /** SpellChecker service instance for word checking */
  spellCheckerService?: SpellCheckerService;
}

/**
 * Context menu state
 */
export interface ContextMenuState {
  visible: boolean;
  word: string;
  position: { x: number; y: number };
  suggestions: string[];
  wordRange?: { from: number; to: number };
}
