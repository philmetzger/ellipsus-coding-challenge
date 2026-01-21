/**
 * SpellChecker Utilities exports
 * Internal helper functions and constants
 */

export {
  DEFAULT_DEBOUNCE_MS,
  DEFAULT_LANGUAGE,
  SPELLCHECK_MISSPELLED_CLASS,
  AVAILABLE_LANGUAGES,
  type LanguageCode,
} from "./constants";
export { debounce } from "./debounce";
// Note: wordExtractor functions are internal, imported directly where needed
