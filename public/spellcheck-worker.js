/**
 * Spellchecker Web Worker
 * Handles dictionary loading and spell checking in a background thread
 * Uses nspell for Hunspell dictionary support with better suggestion quality
 */

// Load the bundled nspell library
importScripts('/nspell.min.js');

let spellchecker = null;
let currentLanguage = null;

/**
 * Load dictionary from API route
 */
async function loadDictionary(language) {
  try {
    // Fetch dictionary from API
    const response = await fetch(`/api/dictionary/${language}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dictionary: ${response.statusText}`);
    }

    const { aff, dic } = await response.json();

    // Validate we received the data
    if (!aff || !dic) {
      throw new Error('Dictionary data is missing aff or dic');
    }

    // Convert arrays back to Uint8Array, then to strings
    const affUint8Array = new Uint8Array(aff);
    const dicUint8Array = new Uint8Array(dic);

    const decoder = new TextDecoder('utf-8');
    const affString = decoder.decode(affUint8Array);
    const dicString = decoder.decode(dicUint8Array);

    // Create new nspell instance with the dictionary
    spellchecker = NSpellModule({ aff: affString, dic: dicString });
    currentLanguage = language;

    return true;
  } catch (error) {
    console.error('[SpellWorker] Error loading dictionary:', error);
    throw error;
  }
}

/**
 * Check if a word is correctly spelled
 * Checks original case first (for proper nouns like "Monday"),
 * then falls back to lowercase (for words typed in caps like "HELLO")
 */
function checkWord(word) {
  if (!spellchecker) {
    throw new Error('Dictionary not loaded. Call LOAD_DICTIONARY first.');
  }

  const trimmed = word.trim();
  
  // Skip very short words
  if (trimmed.length < 2) {
    return true;
  }

  // Check original case first (handles proper nouns like "Monday", "January")
  if (spellchecker.correct(trimmed)) {
    return true;
  }

  // Fall back to lowercase (handles "HELLO" -> "hello")
  const lowercase = trimmed.toLowerCase();
  if (lowercase !== trimmed) {
    return spellchecker.correct(lowercase);
  }

  return false;
}

/**
 * Get suggestions for a misspelled word
 * Tries original case first, then lowercase for better suggestions
 */
function getSuggestions(word) {
  if (!spellchecker) {
    throw new Error('Dictionary not loaded. Call LOAD_DICTIONARY first.');
  }

  const trimmed = word.trim();
  
  // Try getting suggestions for original case first
  let suggestions = spellchecker.suggest(trimmed);
  
  // If no suggestions and word has uppercase, also try lowercase
  const lowercase = trimmed.toLowerCase();
  if ((!suggestions || suggestions.length === 0) && lowercase !== trimmed) {
    suggestions = spellchecker.suggest(lowercase);
  }
  
  return suggestions || [];
}

/**
 * Handle messages from main thread
 */
self.onmessage = async function (e) {
  const { type, requestId, ...data } = e.data;

  try {
    let result;

    switch (type) {
      case 'LOAD_DICTIONARY':
        await loadDictionary(data.language);
        result = { success: true };
        break;

      case 'CHECK_WORD':
        result = checkWord(data.word);
        break;

      case 'CHECK_WORDS':
        // Batch check multiple words
        const words = data.words || [];
        const results = {};
        for (const word of words) {
          results[word] = checkWord(word);
        }
        result = results;
        break;

      case 'GET_SUGGESTIONS':
        result = getSuggestions(data.word);
        break;

      case 'GET_CURRENT_LANGUAGE':
        result = currentLanguage;
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    // Send success response
    self.postMessage({
      type: 'SUCCESS',
      requestId,
      data: result,
    });
  } catch (error) {
    // Send error response
    self.postMessage({
      type: 'ERROR',
      requestId,
      error: error.message || String(error),
    });
  }
};
