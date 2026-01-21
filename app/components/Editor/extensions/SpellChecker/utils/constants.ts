/**
 * Configuration constants for the spellchecker extension
 */

/** Debounce delay for document scanning */
export const DEFAULT_DEBOUNCE_MS = 400;
export const MIN_WORD_LENGTH = 2;
export const DEFAULT_LANGUAGE = "en";
export const SPELLCHECK_MISSPELLED_CLASS = "spellcheck-misspelled";

/** Delay before showing context menu after right-click */
export const CONTEXT_MENU_DELAY_MS = 300;

/** Dictionary loading retry configuration */
export const DICTIONARY_RETRY_COUNT = 3;
export const DICTIONARY_RETRY_DELAY_MS = 50;

/**
 * Available languages for spell checking
 */
export const AVAILABLE_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "de", name: "German" },
] as const;

export type LanguageCode = (typeof AVAILABLE_LANGUAGES)[number]["code"];
