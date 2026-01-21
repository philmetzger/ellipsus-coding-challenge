/**
 * SpellChecker Extension for Tiptap
 * Main public API - only exports what consumers need
 */

// Core extension - main entry point
export { SpellCheckerExtension } from "./core";

// UI component for composition pattern
export { SpellCheckerWrapper } from "./ui";

// Types for configuration
export type { LanguageCode } from "./utils/constants";
export type { SpellCheckerOptions } from "./types";
