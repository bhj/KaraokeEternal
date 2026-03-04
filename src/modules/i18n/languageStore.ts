/**
 * languageStore – persistence layer for the i18n module.
 *
 * Provides a stable, module-scoped API for reading and writing the active
 * language preference so the rest of the module never touches storage
 * directly. Delegates to the core i18n storage helpers.
 *
 * Extending to a new language:
 *   1. Add an entry to src/modules/i18n/core.ts → LANGUAGES
 *   2. Add src/modules/i18n/languages/<code>.json
 *   3. Import the new locale in src/modules/i18n/core.ts
 */

import {
  LANGUAGES,
  getStoredLanguage,
  storeLanguage,
  type LanguageCode,
  type LanguageMeta,
} from './core'

/**
 * All languages supported by the application, each with its code, native
 * label, and text direction.
 */
export const SUPPORTED_LANGUAGES: LanguageMeta[] = LANGUAGES

/**
 * Read the persisted language preference.
 * Falls back to 'en' when nothing is stored or localStorage is unavailable.
 */
export function getLanguage(): LanguageCode {
  return getStoredLanguage()
}

/**
 * Persist a language preference so it survives page reloads.
 */
export function saveLanguage(lang: LanguageCode): void {
  storeLanguage(lang)
}

export type { LanguageCode, LanguageMeta }
