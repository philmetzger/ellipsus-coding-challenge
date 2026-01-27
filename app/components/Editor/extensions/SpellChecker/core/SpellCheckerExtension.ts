import { Extension } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import type { EditorState } from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";
import { DictionaryManager } from "../services/DictionaryManager";
import { SpellCheckerService } from "../services/SpellCheckerService";
import { createSpellCheckerPlugin } from "./SpellCheckerPlugin";
import { findAllInstances } from "../utils/wordExtractor";
import { DEFAULT_DEBOUNCE_MS, DEFAULT_LANGUAGE } from "../utils/constants";
import type { LanguageCode } from "../utils/constants";
import type {
  SpellCheckerOptions,
  SpellCheckerStorage,
  ContextMenuState,
} from "../types";

/**
 * Command props types for spell checker commands
 */
interface SpellCheckerCommandProps {
  tr: Transaction;
  state: EditorState;
  dispatch?: (tr: Transaction) => void;
  commands: Record<string, (...args: unknown[]) => unknown>;
}

/**
 * SpellChecker Extension for Tiptap
 * Provides spell checking functionality with visual indicators and context menu suggestions
 */
export const SpellCheckerExtension = Extension.create<
  SpellCheckerOptions,
  SpellCheckerStorage
>({
  name: "spellChecker",

  addOptions() {
    return {
      enabled: true,
      language: DEFAULT_LANGUAGE,
      debounceMs: DEFAULT_DEBOUNCE_MS,
    };
  },

  addStorage() {
    return {
      enabled: this.options.enabled,
      language: this.options.language,
      scanGeneration: 0, // Increments on every state change to invalidate pending operations
      contextMenuState: null as ContextMenuState | null,
    };
  },

  addProseMirrorPlugins() {
    // Only initialize in browser environment
    // During SSR, this will be called but dictionary loading will be deferred
    if (typeof window === "undefined") {
      // Return empty plugin array during SSR
      // The plugin will be re-initialized on client-side
      return [];
    }

    // Browser-only: Initialize dictionary manager and service
    const dictionaryManager = DictionaryManager.getInstance();
    const spellCheckerService = new SpellCheckerService(dictionaryManager);

    // Store service instance in storage so we can clear its cache when language changes
    this.storage.spellCheckerService = spellCheckerService;

    // Load dictionary on initialization (deferred to avoid blocking)
    // Only load if enabled
    if (this.options.enabled) {
      dictionaryManager.loadDictionary(this.options.language).catch((error) => {
        console.error("Failed to load dictionary:", error);
      });
    }

    // Create a plugin that can access current state from storage (not options, as options may be recreated)
    const plugin = createSpellCheckerPlugin(spellCheckerService, {
      getEnabled: () => this.storage.enabled,
      getLanguage: () => this.storage.language,
      getScanGeneration: () => this.storage.scanGeneration,
      onContextMenu: (state) => {
        // Verify still enabled before notifying
        if (!this.options.enabled) {
          return;
        }

        this.storage.contextMenuState = state;
        
        // Notify via callback if registered, otherwise use DOM event fallback
        if (this.storage.onContextMenuChange) {
          this.storage.onContextMenuChange(state);
        } else {
          const event = new CustomEvent('spellchecker-context-menu', {
            detail: state,
            bubbles: true,
          });
          document.dispatchEvent(event);
        }
      },
      onDismissContextMenu: () => {
        this.storage.contextMenuState = null;
        // Notify React context via callback
        this.storage.onContextMenuChange?.(null);
      },
    });

    return [plugin];
  },

  addCommands() {
    return {
      toggleSpellChecker:
        (enabled?: boolean) =>
        ({
          tr,
          dispatch,
        }: Pick<SpellCheckerCommandProps, "tr" | "dispatch">) => {
          const newEnabled = enabled ?? !this.storage.enabled;

          // Increment generation to invalidate all pending operations
          this.storage.scanGeneration++;

          // Update state
          this.storage.enabled = newEnabled;
          this.options.enabled = newEnabled;

          if (dispatch) {
            // Always clear decorations first (whether enabling or disabling)
            tr.setMeta("spellcheck-update-decorations", true);
            tr.setMeta("spellcheck-decorations", DecorationSet.empty);
            tr.setMeta("spellcheck-generation", this.storage.scanGeneration);

            if (!newEnabled) {
              // When disabling: cancel operations, clear caches, dismiss menu
              const dictionaryManager = DictionaryManager.getInstance();
              const workerManager = dictionaryManager.getWorkerManager();
              workerManager.cancelAllPendingRequests();

              const spellCheckerService = this.storage.spellCheckerService;
              if (spellCheckerService) {
                spellCheckerService.clearCache();
              }

              // Dismiss context menu if open
              if (this.storage.contextMenuState) {
                this.storage.contextMenuState = null;
                // Notify React context via callback
                this.storage.onContextMenuChange?.(null);
              }
            } else {
              // When enabling: load dictionary and trigger scan
              const dictionaryManager = DictionaryManager.getInstance();
              const currentLanguage =
                this.options.language ?? this.storage.language;

              dictionaryManager
                .loadDictionary(currentLanguage)
                .catch((error) => {
                  console.error(
                    "Failed to load dictionary when enabling:",
                    error,
                  );
                });

              tr.setMeta("spellcheck-trigger-scan", true);
            }
            dispatch(tr);
          }
          return true;
        },

      setSpellCheckerLanguage:
        (language: LanguageCode) =>
        async ({ commands, tr, dispatch }: SpellCheckerCommandProps) => {
          try {
            // 1. Increment generation to invalidate all pending operations
            this.storage.scanGeneration++;
            const currentGeneration = this.storage.scanGeneration;

            // 2. Enable if disabled
            if (!this.options.enabled) {
              this.storage.enabled = true;
              this.options.enabled = true;
            }

            // 3. Cancel pending requests and clear caches
            const dictionaryManager = DictionaryManager.getInstance();
            const workerManager = dictionaryManager.getWorkerManager();
            workerManager.cancelAllPendingRequests();

            const spellCheckerService = this.storage.spellCheckerService;
            if (spellCheckerService) {
              spellCheckerService.clearCache();
            }

            // 4. Clear decorations immediately
            if (dispatch) {
              tr.setMeta("spellcheck-update-decorations", true);
              tr.setMeta("spellcheck-decorations", DecorationSet.empty);
              tr.setMeta("spellcheck-generation", currentGeneration);
              dispatch(tr);
            }

            // 5. Load new dictionary
            await dictionaryManager.switchLanguage(language);

            // 6. Check if generation changed during async operation
            if (this.storage.scanGeneration !== currentGeneration) {
              // State changed while loading, abort
              return false;
            }

            // 7. Update language state
            this.storage.language = language;
            this.options.language = language;

            // 8. Trigger rescan - use editor.view.dispatch for second transaction
            // The command's dispatch function doesn't work after first transaction is dispatched
            const newTr = this.editor.state.tr;
            newTr.setMeta("spellcheck-trigger-scan", true);
            newTr.setMeta("spellcheck-generation", currentGeneration);
            this.editor.view.dispatch(newTr);

            return commands.focus();
          } catch (error) {
            console.error("Failed to switch language:", error);
            return false;
          }
        },

      replaceMisspelledWord:
        (from: number, to: number, replacement: string) =>
        ({
          tr,
          dispatch,
        }: Pick<SpellCheckerCommandProps, "tr" | "dispatch">) => {
          if (dispatch) {
            tr.replaceWith(from, to, this.editor.schema.text(replacement));
            dispatch(tr);
          }
          return true;
        },

      findAllInstances:
        (word: string) =>
        ({ state }: Pick<SpellCheckerCommandProps, "state">) => {
          const instances = findAllInstances(state.doc, word);
          return instances.map((inst) => ({ from: inst.from, to: inst.to }));
        },

      replaceAllInstances:
        (word: string, replacement: string) =>
        ({ tr, dispatch, state }: SpellCheckerCommandProps) => {
          if (!dispatch) return false;

          const instances = findAllInstances(state.doc, word);

          // Sort by position in reverse order (end to start) to maintain positions
          instances.sort((a, b) => b.from - a.from);

          // Apply all replacements in a single transaction
          for (const instance of instances) {
            tr.replaceWith(
              instance.from,
              instance.to,
              state.schema.text(replacement),
            );
          }

          dispatch(tr);
          return true;
        },
    };
  },
});
