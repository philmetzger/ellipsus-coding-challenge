# SpellChecker Extension for Tiptap

A comprehensive, production-ready spell checking extension for Tiptap editors. This extension provides real-time spell checking with multi-language support, visual indicators for misspelled words, and an intuitive context menu for corrections.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Features](#features)
3. [Architecture Overview](#architecture-overview)
4. [Component Deep Dive](#component-deep-dive)
5. [Data Flow](#data-flow)
6. [Dictionary System](#dictionary-system)
7. [Web Worker Architecture](#web-worker-architecture)
8. [State Management](#state-management)
9. [Libraries and Dependencies](#libraries-and-dependencies)
10. [Design Decisions and Trade-offs](#design-decisions-and-trade-offs)
11. [Improvements and Alternative Solutions](#improvements-and-alternative-solutions)
12. [File Structure](#file-structure)

---

## Quick Start

### Basic Usage

Add the SpellChecker extension to your Tiptap editor using the **composition pattern**:

```tsx
import { useState } from "react";
import type { Editor as TiptapEditor } from "@tiptap/react";
import { Editor } from "./components/Editor";
import {
  SpellCheckerExtension,
  SpellCheckerWrapper,
} from "./components/Editor/extensions/SpellChecker";

function MyPage() {
  // Track editor instance for SpellCheckerWrapper
  const [editor, setEditor] = useState<TiptapEditor | null>(null);

  return (
    <SpellCheckerWrapper editor={editor}>
      <Editor
        extensions={[SpellCheckerExtension.configure({
          enabled: true,
          language: 'en',
          debounceMs: 400,
        })]}
        onEditorReady={setEditor}
      />
    </SpellCheckerWrapper>
  );
}
```

### Why Composition?

The SpellChecker UI is composed **at the usage site** rather than hardcoded in the Editor component. This design choice provides:

1. **Editor remains extension-agnostic**: The Editor component has no knowledge of SpellChecker
2. **Consumer controls UI placement**: You decide where the controls and context menu appear
3. **Extensibility**: Adding new extensions doesn't require modifying the Editor component
4. **Optional UI**: Use the extension without UI, or build your own custom UI

### Alternative: Direct Tiptap Usage

If you're using Tiptap directly (not the Editor component wrapper):

```tsx
import { useEditor, EditorContent } from '@tiptap/react'
import { SpellCheckerExtension, SpellCheckerWrapper } from './extensions/SpellChecker'

function MyEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      SpellCheckerExtension.configure({
        enabled: true,
        language: 'en',
      }),
    ],
    content: '<p>Start typing here...</p>',
  })

  return (
    <SpellCheckerWrapper editor={editor}>
      <EditorContent editor={editor} />
    </SpellCheckerWrapper>
  )
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable or disable spell checking |
| `language` | `'en' \| 'de'` | `'en'` | Language for spell checking |
| `debounceMs` | `number` | `400` | Delay before scanning after typing stops |

### Programmatic Control

The extension exposes several commands for programmatic control:

```typescript
// Toggle spell checker on/off
editor.commands.toggleSpellChecker(true)  // Enable
editor.commands.toggleSpellChecker(false) // Disable
editor.commands.toggleSpellChecker()      // Toggle

// Change language
await editor.commands.setSpellCheckerLanguage('de')

// Replace a misspelled word
editor.commands.replaceMisspelledWord(from, to, 'correction')

// Replace all instances of a word
editor.commands.replaceAllInstances('teh', 'the')
```

### Styling Misspelled Words

Misspelled words are marked with a CSS class. Add this to your stylesheet:

```css
.spellcheck-misspelled {
  text-decoration: underline wavy #ef4444;
  text-decoration-skip-ink: none;
  text-underline-offset: 2px;
}
```

---

## Features

- **Real-time Spell Checking**: Words are checked as you type with intelligent debouncing
- **Multi-language Support**: Currently supports English and German, easily extensible
- **Visual Indicators**: Misspelled words display a light red highlight
- **Context Menu**: Right-click misspelled words to see suggestions
- **Fix / Fix All**: Replace single instances or all occurrences at once
- **Language Switching**: Change languages without page reload
- **Non-blocking**: Heavy operations run in a Web Worker
- **SSR-safe**: Compatible with server-side rendering (Next.js, etc.)
- **Intelligent Caching**: Multi-level caching minimizes redundant checks

---

## Architecture Overview

The extension follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        UI LAYER                              │
│  ┌─────────────────┐ ┌──────────────────┐ ┌─────────────┐  │
│  │ SpellCheckerUI  │ │SpellCheckerControls│ │ ContextMenu │  │
│  └────────┬────────┘ └────────┬─────────┘ └──────┬──────┘  │
│           │                   │                   │          │
│           └───────────────────┴───────────────────┘          │
│                              │                               │
├──────────────────────────────┼───────────────────────────────┤
│                     CONTEXT LAYER                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  SpellCheckerProvider (React Context)                    ││
│  │  - Scoped state per editor instance                      ││
│  │  - Context menu state & actions                          ││
│  └─────────────────────────────────────────────────────────┘│
│                              │                               │
├──────────────────────────────┼───────────────────────────────┤
│                     EXTENSION LAYER                          │
│  ┌─────────────────────────┐ ┌─────────────────────────┐    │
│  │  SpellCheckerExtension  │ │   SpellCheckerPlugin    │    │
│  │  (Tiptap Integration)   │ │  (ProseMirror Plugin)   │    │
│  └────────────┬────────────┘ └────────────┬────────────┘    │
│               │                           │                  │
├───────────────┴───────────────────────────┴──────────────────┤
│                       SERVICE LAYER                          │
│  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────┐  │
│  │SpellCheckerService│ │DictionaryManager│ │WorkerManager │  │
│  │   (Caching)     │ │   (Singleton)    │ │  (Singleton) │  │
│  └─────────────────┘ └──────────────────┘ └───────┬──────┘  │
│                                                    │         │
├────────────────────────────────────────────────────┼─────────┤
│                      WORKER THREAD                  │         │
│  ┌─────────────────────────────────────────────────┴───────┐│
│  │              spellcheck-worker.js                        ││
│  │         (nspell library + dictionary data)               ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **UI Layer** | React components for user interaction |
| **Context Layer** | Scoped state management per editor instance via React Context |
| **Extension Layer** | Tiptap/ProseMirror integration, commands, decorations |
| **Service Layer** | Caching, batching, dictionary management, worker communication |
| **Worker Thread** | Actual spell checking using nspell library |

---

## Component Deep Dive

### Core Components

#### `SpellCheckerExtension.ts`

The main entry point that integrates with Tiptap. It:

- **Registers the extension** with Tiptap's extension system
- **Manages storage** for extension state (`enabled`, `language`, `scanGeneration`)
- **Provides commands** for programmatic control
- **Creates the ProseMirror plugin** during initialization
- **Handles SSR** by returning empty plugins during server-side rendering

```typescript
// Extension storage structure
interface SpellCheckerStorage {
  enabled: boolean
  language: LanguageCode
  scanGeneration: number        // Invalidates stale operations
  contextMenuState: ContextMenuState | null
  spellCheckerService?: SpellCheckerService
  onContextMenuChange?: (state: ContextMenuState | null) => void  // Context callback
}
```

**Key Design Decision**: The `scanGeneration` counter is incremented whenever the spellchecker state changes (toggle, language switch). This allows all in-flight async operations to be invalidated by comparing their captured generation with the current one.

#### `SpellCheckerPlugin.ts`

A ProseMirror plugin that handles the core spell checking logic:

- **Document scanning**: Extracts words and checks them for spelling errors
- **Decoration management**: Creates and updates visual indicators (underlines)
- **Context menu handling**: Intercepts right-clicks on misspelled words
- **Debounced updates**: Schedules scans after typing stops

```typescript
// Plugin state structure
interface SpellCheckerPluginState {
  decorations: DecorationSet   // Visual indicators for misspelled words
  shouldRescan: boolean        // Flag to trigger rescan
  generation: number           // Current generation for staleness check
}
```

**Scanning Strategy**: The plugin only scans when:
1. A word boundary is detected (space, punctuation, newline)
2. Text is deleted
3. A rescan is explicitly requested (e.g., after language change)

This prevents checking incomplete words while typing.

#### `SpellCheckerService.ts`

A service layer that provides caching and batch operations:

- **Multi-level caching**: Separate caches for correct words, misspelled words, and suggestions
- **Language-aware**: Caches are scoped by language to prevent cross-language pollution
- **Batch operations**: `checkWords()` checks multiple words in a single call
- **Deduplication**: Pending requests are tracked to avoid duplicate worker calls

```typescript
// Cache structure
private correctWordsCache: Map<LanguageCode, Set<string>>
private misspelledWordsCache: Map<LanguageCode, Set<string>>
private suggestionsCache: Map<string, string[]>  // key: "lang:word"
```

**Why caching matters**: Without caching, every document scan would send hundreds of words to the worker. With caching, only new/unknown words are checked.

#### `DictionaryManager.ts`

A singleton that manages dictionary loading and language switching:

- **Lazy loading**: Dictionaries are only loaded when needed
- **Deduplication**: Prevents multiple simultaneous loads of the same dictionary
- **Verification**: Confirms the worker has the correct dictionary after switching
- **Retry logic**: Retries loading with exponential backoff on failure

```typescript
class DictionaryManager {
  private static instance: DictionaryManager | null = null
  private loadedLanguages: Set<string> = new Set()
  private loadingPromises: Map<string, Promise<void>> = new Map()
}
```

#### `WorkerManager.ts`

A singleton that handles all communication with the Web Worker:

- **Promise-based API**: Wraps message passing in async/await syntax
- **Request tracking**: Each request has a unique ID for response matching
- **Timeout handling**: Requests timeout after 30 seconds
- **Cancellation**: Can cancel all pending requests (used during language switch)

```typescript
// Message types
type WorkerRequest =
  | { type: 'LOAD_DICTIONARY'; requestId: string; language: string }
  | { type: 'CHECK_WORD'; requestId: string; word: string }
  | { type: 'CHECK_WORDS'; requestId: string; words: string[] }
  | { type: 'GET_SUGGESTIONS'; requestId: string; word: string }
  | { type: 'GET_CURRENT_LANGUAGE'; requestId: string }
```

### UI Components

#### `SpellCheckerUI.tsx`

The main UI orchestrator that:

- **Detects the extension**: Uses `useSpellCheckerExtension` hook
- **Manages local state**: Optimistic updates with error rollback
- **Prevents rapid switching**: 200ms cooldown between language changes
- **Renders child components**: `SpellCheckerControls` and `ContextMenu`

#### `SpellCheckerControls.tsx`

A custom dropdown for language selection:

- **Three options**: Off, English, German
- **Loading state**: Shows spinner during dictionary loading
- **Accessible**: Keyboard navigation and focus management

#### `SpellCheckerContext.tsx`

The React Context provider that scopes state per-editor instance:

- **Context menu state**: Manages `ContextMenuState` via `useState`
- **Callback registration**: Registers `onContextMenuChange` callback with extension storage
- **Actions**: Exposes `dismissContextMenu`, `fixWord`, `fixAllInstances`
- **Hook**: Exports `useSpellCheckerContext()` for consuming components

```typescript
interface SpellCheckerContextValue {
  contextMenu: ContextMenuState | null
  dismissContextMenu: () => void
  fixWord: (from: number, to: number, replacement: string) => void
  fixAllInstances: (word: string, replacement: string) => void
}
```

#### `ContextMenu.tsx`

The right-click suggestions menu:

- **Context-driven**: Uses `useSpellCheckerContext()` hook to get state and actions
- **Positioned at cursor**: Uses click coordinates for placement
- **Auto-dismiss**: Closes on outside click, scroll, or spellchecker disable
- **Actions**: "Fix" (single) and "Fix all" (global replace)

#### `SpellCheckerWrapper.tsx`

A wrapper component that provides context and renders the UI alongside the editor content:

```tsx
export function SpellCheckerWrapper({ editor, children }: Props) {
  return (
    <SpellCheckerProvider editor={editor}>
      <SpellCheckerUI editor={editor} />
      {children}
    </SpellCheckerProvider>
  )
}
```

### Utilities

#### `wordExtractor.ts`

Utilities for extracting words from ProseMirror documents:

- **`extractWords(doc)`**: Returns array of `{ word, from, to }` objects
- **`normalizeWord(word)`**: Lowercases and strips punctuation
- **`shouldCheckWord(word)`**: Filters out numbers and very short words
- **`findAllInstances(doc, word)`**: Finds all occurrences (case-insensitive)
- **`calculateEditDistance(a, b)`**: Levenshtein distance for ranking suggestions

**Smart extraction**: Words are only extracted if they have a trailing boundary (space, punctuation). This prevents checking incomplete words while the user is still typing.

#### `constants.ts`

Configuration constants:

```typescript
export const DEFAULT_DEBOUNCE_MS = 400        // Scan delay
export const MIN_WORD_LENGTH = 2              // Minimum word length to check
export const DEFAULT_LANGUAGE = 'en'          // Default language
export const CONTEXT_MENU_DELAY_MS = 300      // Anti-flicker delay
export const DICTIONARY_RETRY_COUNT = 3       // Load retry attempts
export const DICTIONARY_RETRY_DELAY_MS = 50   // Retry delay

export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
] as const
```

---

## Data Flow

### Spell Checking Flow

```
User types "helllo world "
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ SpellCheckerPlugin detects document change                │
│ Word boundary detected (space after "world")              │
└───────────────────────────────────────────────────────────┘
        │
        ▼ (400ms debounce)
┌───────────────────────────────────────────────────────────┐
│ scanDocument() called                                     │
│ wordExtractor extracts: ["helllo", "world"]               │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ SpellCheckerService.checkWords(["helllo", "world"])       │
│ Cache check:                                              │
│   - "world" found in correctWordsCache → skip             │
│   - "helllo" not in cache → check with worker             │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ WorkerManager.checkWords(["helllo"])                      │
│ Posts message to Web Worker                               │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ Web Worker (spellcheck-worker.js)                         │
│ nspell.correct("helllo") → false                          │
│ Returns: { "helllo": false }                              │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ SpellCheckerService receives result                       │
│ Caches "helllo" in misspelledWordsCache                   │
│ Fetches suggestions: ["hello"]                            │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ Plugin creates decoration for "helllo"                    │
│ DecorationSet applied to editor view                      │
│ Word displays with light red highlight                    │
└───────────────────────────────────────────────────────────┘
```

### Context Menu Flow

```
User right-clicks "helllo"
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ Plugin.handleDOMEvents.contextmenu                        │
│ Finds decoration at click position                        │
│ Gets word: "helllo", range: { from: 0, to: 6 }            │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ SpellCheckerService.getSuggestions("helllo")              │
│ Returns cached or fetches: ["hello", "jello", ...]        │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ Extension calls storage.onContextMenuChange(state)        │
│ State: { word, position, suggestions, wordRange }         │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ SpellCheckerProvider receives callback                    │
│ Updates React Context state via setContextMenu            │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ ContextMenu reads state via useSpellCheckerContext()      │
│ Renders menu at click position with suggestions           │
└───────────────────────────────────────────────────────────┘
        │
        ▼ (User clicks "Fix")
┌───────────────────────────────────────────────────────────┐
│ context.fixWord(from, to, "hello")                        │
│ editor.chain().setTextSelection().deleteSelection()       │
│       .insertContent("hello").run()                       │
│ Document updated → triggers new scan                      │
└───────────────────────────────────────────────────────────┘
```

---

## Dictionary System

### Overview

Dictionaries are Hunspell-compatible files (`.aff` and `.dic`) that contain:

- **Affix rules** (`.aff`): Prefixes, suffixes, and word transformations
- **Word list** (`.dic`): Base words with affix flags

### Dictionary Loading Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    BUILD TIME                                │
│  npm packages (dictionary-en, dictionary-de)                 │
│  installed in node_modules/                                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    RUNTIME (Server)                          │
│  API Route: /api/dictionary/[lang]                          │
│  1. Dynamically imports dictionary package                  │
│  2. Extracts .aff and .dic Buffers                          │
│  3. Converts to JSON arrays for transfer                    │
│  4. Sets Cache-Control: max-age=31536000, immutable         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    RUNTIME (Client)                          │
│  Web Worker fetches /api/dictionary/en                      │
│  1. Converts arrays back to Uint8Array                      │
│  2. Decodes to strings using TextDecoder                    │
│  3. Initializes nspell with aff + dic                       │
└─────────────────────────────────────────────────────────────┘
```

### API Route Implementation

```typescript
// app/api/dictionary/[lang]/route.ts
export async function GET(request, { params }) {
  const { lang } = await params
  
  // Dynamic import of dictionary package
  const dictionary = await import(`dictionary-${lang}`)
  
  // Extract Buffer data
  const aff = dictionary.aff  // Uint8Array/Buffer
  const dic = dictionary.dic  // Uint8Array/Buffer
  
  // Return as JSON with long-term caching
  return NextResponse.json(
    { aff: Array.from(aff), dic: Array.from(dic) },
    { headers: { 'Cache-Control': 'max-age=31536000, immutable' } }
  )
}
```

### Adding a New Language

1. Install the dictionary package:
   ```bash
   pnpm add dictionary-fr
   ```

2. Add to the API route's supported languages:
   ```typescript
   const SUPPORTED_LANGUAGES = ['en', 'de', 'fr']
   ```

3. Add to the constants:
   ```typescript
   export const AVAILABLE_LANGUAGES = [
     { code: 'en', name: 'English' },
     { code: 'de', name: 'German' },
     { code: 'fr', name: 'French' },
   ] as const
   ```

4. Update the controls dropdown to include the new option.

---

## Web Worker Architecture

### Why Web Workers?

Spell checking is computationally expensive:

1. **Dictionary loading**: English dictionary is ~4MB uncompressed
2. **Word checking**: Involves affix expansion and trie traversal
3. **Suggestion generation**: Calculates edit distances for thousands of words

Running this on the main thread would cause:
- UI freezes during dictionary loading
- Janky typing experience during scanning
- Potential browser "page unresponsive" warnings

**Solution**: Offload all dictionary operations to a Web Worker.

### Worker Implementation

The worker (`public/spellcheck-worker.js`) is a self-contained script that:

1. **Loads nspell library** via `importScripts('/nspell.min.js')`
2. **Fetches dictionaries** from the API route
3. **Initializes the spell checker** with dictionary data
4. **Processes messages** from the main thread

```javascript
// Worker message handling
self.onmessage = async function(e) {
  const { type, requestId, ...data } = e.data
  
  try {
    let result
    switch (type) {
      case 'LOAD_DICTIONARY':
        result = await loadDictionary(data.language)
        break
      case 'CHECK_WORD':
        result = checkWord(data.word)
        break
      case 'CHECK_WORDS':
        result = checkWords(data.words)
        break
      case 'GET_SUGGESTIONS':
        result = getSuggestions(data.word)
        break
    }
    
    self.postMessage({ type: 'SUCCESS', requestId, data: result })
  } catch (error) {
    self.postMessage({ type: 'ERROR', requestId, error: error.message })
  }
}
```

### Case Handling

The worker checks words with proper case handling:

1. **Original case first**: Allows "Monday" to pass (proper noun)
2. **Lowercase fallback**: Catches "hello" regardless of "Hello" or "HELLO"

```javascript
function checkWord(word) {
  // Check original case (handles proper nouns)
  if (spellChecker.correct(word)) return true
  
  // Check lowercase
  return spellChecker.correct(word.toLowerCase())
}
```

### Building nspell for Browser

The `nspell` package is a Node.js library. To use it in a Web Worker:

```javascript
// scripts/build-nspell.js
const esbuild = require('esbuild')

esbuild.build({
  entryPoints: ['scripts/nspell-entry.js'],
  bundle: true,
  outfile: 'public/nspell.min.js',
  format: 'iife',
  globalName: 'NSpellModule',
  minify: true,
  platform: 'browser',
})
```

This bundles nspell and its dependencies into a single file that can be loaded via `importScripts()`.

---

## State Management

### Four Levels of State

```
┌─────────────────────────────────────────────────────────────┐
│                  EXTENSION STORAGE                           │
│  Managed by: SpellCheckerExtension                          │
│  Persists across: Document changes                          │
│                                                             │
│  {                                                          │
│    enabled: boolean,                                        │
│    language: 'en' | 'de',                                   │
│    scanGeneration: number,      // Staleness counter        │
│    contextMenuState: {...},     // Current menu state       │
│    spellCheckerService: Service,// Service instance         │
│    onContextMenuChange: fn      // Context callback         │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PLUGIN STATE                              │
│  Managed by: SpellCheckerPlugin                             │
│  Updates on: Every transaction                              │
│                                                             │
│  {                                                          │
│    decorations: DecorationSet,  // Visual indicators        │
│    shouldRescan: boolean,       // Scan trigger flag        │
│    generation: number           // Current generation       │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   REACT CONTEXT STATE                        │
│  Managed by: SpellCheckerProvider                           │
│  Scoped to: Each editor instance                            │
│                                                             │
│  {                                                          │
│    contextMenu: ContextMenuState | null  // Menu state      │
│  }                                                          │
│                                                             │
│  Actions: dismissContextMenu, fixWord, fixAllInstances      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   REACT UI STATE                             │
│  Managed by: SpellCheckerUI                                 │
│  Updates on: User interaction                               │
│                                                             │
│  {                                                          │
│    localValue: 'off' | 'en' | 'de',  // Optimistic value   │
│    isLoading: boolean,                // Loading spinner    │
│    isSwitching: boolean               // Debounce guard     │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

### The Generation Pattern

The `scanGeneration` counter solves a critical async problem:

**Problem**: User switches from English to German. The English scan is still in progress. When it completes, it would apply English results to a German document.

**Solution**: 

1. Capture generation at operation start
2. Increment generation on any state change
3. Compare at operation end - discard if mismatch

```typescript
// In setSpellCheckerLanguage command
this.storage.scanGeneration++
const currentGeneration = this.storage.scanGeneration

// ... async dictionary loading ...

// After async operation
if (this.storage.scanGeneration !== currentGeneration) {
  return false  // State changed, discard results
}
```

### Optimistic Updates

The UI uses optimistic updates for better UX:

```typescript
const handleSpellcheckerChange = async (value) => {
  // 1. Update UI immediately (optimistic)
  setLocalValue(value)
  setIsLoading(true)
  
  try {
    // 2. Perform actual operation
    await editor.commands.setSpellCheckerLanguage(value)
  } catch (error) {
    // 3. Rollback on error
    setLocalValue(previousValue)
  } finally {
    setIsLoading(false)
  }
}
```

---

## Libraries and Dependencies

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `nspell` | 2.1.5 | Hunspell-compatible spell checker for JavaScript |
| `dictionary-en` | 4.0.0 | English Hunspell dictionary (~4MB) |
| `dictionary-de` | 3.0.0 | German Hunspell dictionary (~2.5MB) |

### Why nspell?

**Alternatives considered**:

1. **Typo.js**: Older, less maintained
2. **simple-spellchecker**: Limited language support
3. **Browser spellcheck API**: Not programmable, no suggestions
4. **LanguageTool API**: External service, latency concerns

**nspell advantages**:
- Active maintenance
- Uses real Hunspell dictionaries
- Provides suggestions
- Works in Node.js and browsers (with bundling)
- Extensive language support via `dictionary-*` packages

### Editor Framework

| Package | Version | Purpose |
|---------|---------|---------|
| `@tiptap/core` | 3.x | Core editor framework |
| `@tiptap/react` | 2.x | React bindings |
| `@tiptap/pm` | 2.x | ProseMirror integration |

### Build Tools

| Package | Purpose |
|---------|---------|
| `esbuild` | Bundles nspell for browser use |

---

## Integration Design

### Composition Pattern

The SpellChecker uses a **composition pattern** for integrating with the Editor:

```
┌─────────────────────────────────────────────────────────────┐
│                      page.tsx (Consumer)                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              SpellCheckerWrapper                         ││
│  │  ┌────────────────┐  ┌─────────────────────────────────┐││
│  │  │SpellCheckerUI  │  │         Editor                  │││
│  │  │ (Controls +    │  │  (Extension-agnostic)           │││
│  │  │  ContextMenu)  │  │  ┌─────────────────────────────┐│││
│  │  │                │  │  │   EditorContent             ││││
│  │  └────────────────┘  │  │   + SpellCheckerExtension   ││││
│  │                      │  └─────────────────────────────┘│││
│  │                      └─────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Key Principle**: The extension owns its logic (checking, decorations, commands), but the **consumer owns UI placement**.

### Communication Between Extension and UI

The SpellChecker uses **React Context** for communication between the ProseMirror plugin and React UI. This provides scoped state per-editor instance:

```typescript
// In SpellCheckerExtension (Extension layer)
// Extension storage has a callback that Context Provider registers
this.storage.onContextMenuChange?.(state)

// In SpellCheckerProvider (Context layer)
// Registers callback with extension storage
useEffect(() => {
  const ext = editor.extensionManager.extensions.find(e => e.name === 'spellChecker')
  if (ext?.storage) {
    ext.storage.onContextMenuChange = setContextMenu
  }
  return () => { ext.storage.onContextMenuChange = undefined }
}, [editor])

// In ContextMenu (UI layer)
// Consumes context via hook
const { contextMenu, fixWord, fixAllInstances } = useSpellCheckerContext()
```

**Benefits of this approach:**

| Aspect | Evaluation |
|--------|------------|
| Scoping | ✅ State is scoped per-editor instance |
| Multiple editors | ✅ Each editor has its own context (works correctly) |
| Testability | ✅ Easy to test (mock context, no window events) |
| React-idiomatic | ✅ Standard React patterns, clear data flow |
| Decoupling | ✅ Extension doesn't need React references (uses callback) |

### Alternative Approaches (Not Implemented)

For more complex use cases, consider these alternatives:

1. **Headless hooks**: `useSpellChecker(editor)` returns state and actions for custom UI
2. **Slot/render props**: Editor accepts UI components as props

---

## Design Decisions and Trade-offs

### Advantages

| Decision | Benefit |
|----------|---------|
| **Web Worker** | Main thread stays responsive, no UI jank during spell checking |
| **Multi-level caching** | Reduces redundant worker calls by 90%+ |
| **Language-aware caches** | Prevents "German word correct in English" bugs |
| **Debounced scanning** | Avoids checking incomplete words and excessive updates |
| **Generation pattern** | Handles race conditions without complex cancellation logic |
| **SSR-safe** | Works with Next.js and other SSR frameworks |
| **Singleton managers** | Shared state across multiple editor instances |
| **React Context for UI** | Scoped state per-editor, easy testing, React-idiomatic |

### Limitations

| Limitation | Impact | Potential Solution |
|------------|--------|-------------------|
| **Initial load time** | 200-500ms delay for first dictionary | Progressive loading, service worker caching |
| **Memory usage** | ~10-20MB per dictionary in memory | Lazy unload unused dictionaries |
| **No user dictionary** | Can't "Add to dictionary" | Implement localStorage/server persistence |
| **Limited languages** | Only English and German | Add more `dictionary-*` packages |
| **Right-click only** | Accessibility concern | Add keyboard navigation |
| **No auto-correct** | Must manually click to fix | Implement inline suggestions |

### Complexity Analysis

| Operation | Time Complexity | Notes |
|-----------|-----------------|-------|
| Word extraction | O(n) | n = document characters |
| Cache lookup | O(1) | Hash-based Set/Map |
| Spell check (uncached) | O(m * k) | m = word length, k = affix rules |
| Suggestion generation | O(m * d) | d = dictionary size |
| Decoration creation | O(w) | w = misspelled words count |

---

## Improvements and Alternative Solutions

### Potential Improvements

#### 1. Ignore Word Functionality

Add ability to ignore words for the session or permanently:

```typescript
// Session-based ignore
const ignoredWords = new Set<string>()

commands.ignoreWord: (word) => () => {
  ignoredWords.add(word.toLowerCase())
  // Trigger rescan to remove decoration
  return true
}

// In SpellCheckerService
if (ignoredWords.has(word.toLowerCase())) {
  return true  // Treat as correct
}
```

#### 2. Add to Dictionary

Persist custom words using localStorage or a server API:

```typescript
// localStorage approach
const customDictionary = JSON.parse(
  localStorage.getItem('spellcheck-custom-words') || '[]'
)

commands.addToDictionary: (word) => () => {
  customDictionary.push(word)
  localStorage.setItem(
    'spellcheck-custom-words',
    JSON.stringify(customDictionary)
  )
  // Also add to worker's dictionary
  workerManager.sendMessage('ADD_WORD', { word })
  return true
}
```

#### 3. Keyboard Navigation

Add keyboard shortcuts for accessibility:

```typescript
// In the plugin
handleKeyDown: (view, event) => {
  if (event.key === 'F7') {
    // Jump to next misspelled word
    const next = findNextMisspelledWord(view.state)
    if (next) {
      view.dispatch(view.state.tr.setSelection(
        TextSelection.create(view.state.doc, next.from)
      ))
    }
    return true
  }
  return false
}
```

#### 4. Inline Suggestions (Google Docs Style)

Show suggestions inline without context menu:

```typescript
// Create widget decoration with suggestion
Decoration.widget(to, () => {
  const chip = document.createElement('span')
  chip.className = 'spellcheck-suggestion-chip'
  chip.textContent = topSuggestion
  chip.onclick = () => replaceMisspelledWord(from, to, topSuggestion)
  return chip
})
```

#### 5. Progressive Dictionary Loading

Load dictionary in chunks for faster initial load:

```typescript
// Split dictionary into frequency tiers
const commonWords = await fetch('/api/dictionary/en/common')
const fullDictionary = fetch('/api/dictionary/en/full')  // Background

// Check common words first (covers 90% of text)
// Fall back to full dictionary when loaded
```

### Integration Architecture Improvements

For more advanced use cases, consider these architectural improvements:

#### 6. Headless UI Pattern

Expose a `useSpellChecker` hook that returns state and actions, letting consumers build custom UI:

```tsx
// useSpellChecker.ts
export function useSpellChecker(editor: Editor | null) {
  const extension = useSpellCheckerExtension(editor)
  const context = useSpellCheckerContext()
  const [isLoading, setIsLoading] = useState(false)

  const toggle = useCallback((enabled?: boolean) => {
    editor?.commands.toggleSpellChecker(enabled)
  }, [editor])

  const setLanguage = useCallback(async (lang: LanguageCode) => {
    setIsLoading(true)
    try {
      await editor?.commands.setSpellCheckerLanguage(lang)
    } finally {
      setIsLoading(false)
    }
  }, [editor])

  return {
    isEnabled: extension?.options?.enabled ?? false,
    language: extension?.options?.language ?? 'en',
    isLoading,
    contextMenu: context?.contextMenu ?? null,
    toggle,
    setLanguage,
    fixWord: context?.fixWord ?? (() => {}),
    fixAllInstances: context?.fixAllInstances ?? (() => {}),
  }
}

// Consumer builds custom UI
function MyCustomSpellChecker({ editor }) {
  const { isEnabled, toggle, language, setLanguage, contextMenu } = useSpellChecker(editor)

  return (
    <>
      <MyCustomToggle checked={isEnabled} onChange={() => toggle()} />
      <MyCustomLanguageSelect value={language} onChange={setLanguage} />
      {contextMenu?.visible && (
        <MyCustomSuggestionMenu suggestions={contextMenu.suggestions} />
      )}
    </>
  )
}
```

**Benefits:**
- Maximum flexibility for different UIs
- Separates logic from presentation
- Easier to theme/customize
- Can be used with any component library

#### 7. Slot/Render Props Pattern

Let the Editor accept UI components as props for clean extension points:

```tsx
// Editor with slots
interface EditorProps {
  extensions: Extension[]
  slots?: {
    before?: (props: { editor: Editor }) => ReactNode
    after?: (props: { editor: Editor }) => ReactNode
    overlay?: (props: { editor: Editor }) => ReactNode
  }
}

function Editor({ extensions, slots }: EditorProps) {
  const editor = useEditor({ extensions })

  return (
    <div className="editor-container">
      {slots?.before?.({ editor })}
      <EditorContent editor={editor} />
      {slots?.after?.({ editor })}
      {slots?.overlay?.({ editor })}
    </div>
  )
}

// Usage - extension UI is passed as slots
<Editor
  extensions={[SpellCheckerExtension.configure()]}
  slots={{
    before: ({ editor }) => <SpellCheckerControls editor={editor} />,
    overlay: ({ editor }) => <ContextMenu editor={editor} />,
  }}
/>
```

**Benefits:**
- Editor remains extension-agnostic
- Clear extension points for any extension UI
- Consumer has full control over UI placement
- Easy to add/remove extension UIs

### Alternative Approaches

#### 1. Browser Native Spellcheck

The simplest approach - just use the browser's built-in spellchecker:

```html
<div contenteditable="true" spellcheck="true">
```

**Pros**: Zero implementation effort, uses user's system dictionary
**Cons**: No programmatic access, can't get suggestions, no custom styling

#### 2. Server-Side Spell Checking

Move spell checking to an API endpoint:

```typescript
// Client
const response = await fetch('/api/spellcheck', {
  method: 'POST',
  body: JSON.stringify({ text: documentText, language: 'en' })
})

// Server can use full Hunspell or LanguageTool
```

**Pros**: Smaller client bundle, more powerful tools available
**Cons**: Latency on every check, requires server infrastructure

#### 3. LanguageTool Integration

Use LanguageTool's free API for advanced checking:

```typescript
const response = await fetch(
  'https://api.languagetool.org/v2/check',
  {
    method: 'POST',
    body: new URLSearchParams({
      text: documentText,
      language: 'en-US'
    })
  }
)
```

**Pros**: Grammar checking, style suggestions, 30+ languages
**Cons**: Rate limits on free tier, external dependency, latency

#### 4. WebAssembly Spell Checker

Compile Hunspell to WebAssembly for near-native performance:

```typescript
const hunspell = await HunspellWasm.create()
await hunspell.loadDictionary(affBuffer, dicBuffer)
hunspell.spell(word)  // Fast!
```

**Pros**: 10-100x faster than JavaScript implementation
**Cons**: Larger initial bundle, complex build setup

#### 5. SharedArrayBuffer Communication

Use SharedArrayBuffer for zero-copy worker communication:

```typescript
// Main thread
const sharedBuffer = new SharedArrayBuffer(1024 * 1024)
worker.postMessage({ type: 'INIT', buffer: sharedBuffer })

// Write words to shared buffer
// Worker reads directly without copying
```

**Pros**: Faster for large documents
**Cons**: Requires specific security headers (COOP/COEP), browser support

---

## File Structure

```
SpellChecker/
├── index.ts                    # Public exports
├── README.md                   # This documentation
├── types.ts                    # TypeScript interfaces
│
├── core/
│   ├── index.ts                # Core exports
│   ├── SpellCheckerExtension.ts    # Tiptap extension entry point
│   └── SpellCheckerPlugin.ts       # ProseMirror plugin
│
├── services/
│   ├── index.ts                # Service exports
│   ├── SpellCheckerService.ts      # Caching and batching service
│   ├── DictionaryManager.ts        # Dictionary loading singleton
│   └── WorkerManager.ts            # Worker communication singleton
│
├── ui/
│   ├── index.ts                # UI exports
│   ├── styles.ts               # Extracted CSS-in-JS styles
│   ├── SpellCheckerContext.tsx     # React Context provider (scoped state)
│   ├── SpellCheckerUI.tsx          # Main UI component
│   ├── SpellCheckerControls.tsx    # Language dropdown
│   ├── ContextMenu.tsx             # Right-click suggestions
│   └── SpellCheckerWrapper.tsx     # Container component with Provider
│
├── hooks/
│   ├── index.ts                # Hooks exports
│   └── useSpellCheckerExtension.ts  # Extension access hook
│
├── utils/
│   ├── index.ts                # Utils exports
│   ├── constants.ts            # Configuration constants
│   ├── wordExtractor.ts        # Word extraction utilities
│   └── debounce.ts             # Debounce utility
│
└── (tests in __tests__/ subdirectories)
```

### Related Files (Outside Extension)

```
public/
├── spellcheck-worker.js        # Web Worker script
└── nspell.min.js               # Bundled nspell library

app/api/dictionary/[lang]/
└── route.ts                    # Dictionary API endpoint

scripts/
├── build-nspell.js             # nspell bundler script
└── nspell-entry.js             # nspell entry point
```

---

## License

This extension is part of the Ellipsus coding challenge project.
