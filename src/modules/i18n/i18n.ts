/**
 * i18n module – main barrel export & flat-key translator.
 *
 * This is the single import point for all i18n functionality.
 * Import from this file (or the module index) rather than reaching
 * into internal module paths.
 *
 * ── React components ────────────────────────────────────────────────────────
 *
 *   import { useI18n, useT, LanguageSelector } from 'modules/i18n/i18n'
 *
 *   // Two-argument form (matches existing codebase convention):
 *   const { t } = useI18n()
 *   t('account', 'title')  // → "My Account"
 *
 *   // Or the shorthand hook:
 *   const t = useT()
 *   t('library', 'empty')  // → "Library Empty"
 *
 * ── Outside React (Redux thunks, utilities) ─────────────────────────────────
 *
 *   import { t } from 'modules/i18n/i18n'
 *
 *   // Single dot-separated key:
 *   t('account.title')      // → "My Account"
 *   t('lyrics.noLyrics')    // → "No lyrics available"
 *
 * ── Multilingual lyrics ─────────────────────────────────────────────────────
 *
 *   import { resolveLyrics, createLyricsResolver } from 'modules/i18n/i18n'
 *
 *   resolveLyrics({ he: 'דיינו', translit: 'Dayenu', en: '...' }, 'ru')
 *   // → 'It would have been enough'  (English fallback)
 *
 * ── Adding a new UI language ────────────────────────────────────────────────
 *   1. Create  src/i18n/locales/<code>.json  (copy en.json, translate values)
 *   2. Create  src/modules/i18n/languages/<code>.json  (same content)
 *   3. Add an entry in  src/i18n/index.ts → LANGUAGES
 *   4. Import the new locale in  src/i18n/index.ts → catalogue
 *   No other files need to change.
 */

// ---------------------------------------------------------------------------
// Core i18n surface (context, hooks, storage, types)
// ---------------------------------------------------------------------------

export {
  LANGUAGES,
  I18nContext,
  useT,
  useI18n,
  getStoredLanguage,
  storeLanguage,
  type LanguageCode,
  type LanguageMeta,
  type TFunction,
  type I18nContextValue,
} from 'i18n'

// createTranslator is exported separately so it can be used inside t() below
import { createTranslator, getStoredLanguage, type LanguageCode } from 'i18n'
export { createTranslator }

// ---------------------------------------------------------------------------
// Module sub-modules
// ---------------------------------------------------------------------------

export {
  SUPPORTED_LANGUAGES,
  getLanguage,
  saveLanguage,
} from './languageStore'

export {
  LanguageSelector,
} from './languageSelector'

export {
  resolveLyrics,
  createLyricsResolver,
  getAvailableVariants,
  type MultilingualLyrics,
  type SongWithMultilingualLyrics,
} from './lyrics'

// ---------------------------------------------------------------------------
// Flat-key translator:  t('section.key')
// ---------------------------------------------------------------------------

/**
 * Module-level translator that reads the current language from localStorage.
 *
 * Accepts a single dot-separated key string and returns the translated value,
 * falling back to English automatically when a translation is missing.
 *
 * This is intended for use **outside** React components (e.g. in Redux
 * thunks, plain utilities, or server-side rendering helpers).  Inside React
 * components prefer the `useT()` or `useI18n()` hooks which react to
 * language changes at render time.
 *
 * @param dotKey - Dot-separated section and key, e.g. `'account.title'`.
 * @returns The translated string, or `[section.key]` if not found.
 *
 * @example
 * import { t } from 'modules/i18n/i18n'
 *
 * const label = t('queue.empty')  // → "Queue Empty" (or translated)
 * const msg   = t('lyrics.noLyrics')
 */
export function t(dotKey: string): string {
  const lang: LanguageCode = getStoredLanguage()
  const translate = createTranslator(lang)
  const dotIdx = dotKey.indexOf('.')
  if (dotIdx === -1 || dotIdx === 0 || dotIdx === dotKey.length - 1) {
    return `[invalid key: ${dotKey}]`
  }
  const section = dotKey.slice(0, dotIdx)
  const key = dotKey.slice(dotIdx + 1)
  return translate(section, key)
}
