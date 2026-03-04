/**
 * lyrics – multilingual lyrics resolver.
 *
 * Utilities for resolving the correct lyric string from a MultilingualLyrics
 * object based on the active language. This is intentionally separate from
 * the UI translation system: it handles user-visible song content, not
 * application strings.
 *
 * Example MultilingualLyrics payload:
 *   {
 *     "lyrics": {
 *       "he": "דיינו",
 *       "translit": "Dayenu",
 *       "en": "It would have been enough"
 *     }
 *   }
 *
 * Resolution order:
 *   1. Exact match for the current language code  (e.g. "he")
 *   2. English fallback                           (e.g. "en")
 *   3. Latin-alphabet transliteration fallback    (e.g. "translit")
 *   4. First available string value in the object
 *   5. Empty string (never throws)
 *
 * The karaoke engine is NOT modified; this module only provides data
 * utilities consumed at the presentation layer.
 */

import type { LanguageCode } from './core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single lyric entry with optional per-language translations and a
 * Latin-script transliteration.
 *
 * All fields are optional so that partially-translated content still works.
 */
export interface MultilingualLyrics {
  /** Hebrew lyrics */
  he?: string
  /** English lyrics / translation */
  en?: string
  /** Russian lyrics / translation */
  ru?: string
  /**
   * Latin-script transliteration of the original text.
   * Used as a last resort when the requested language has no direct
   * translation and English is also absent.
   */
  translit?: string
  /** Catch-all for future language codes. */
  [langCode: string]: string | undefined
}

/**
 * A song entry that may carry multilingual lyric data alongside its
 * regular fields. The `lyrics` key is additive – existing song objects
 * without it are unaffected.
 */
export interface SongWithMultilingualLyrics {
  lyrics?: MultilingualLyrics
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Core resolver
// ---------------------------------------------------------------------------

/**
 * Resolve the best lyric string for the given language code.
 *
 * @param lyrics - The multilingual lyrics object (from a song payload).
 * @param lang   - The active language code (from `useI18n().language`).
 * @returns      The resolved lyric string, never undefined.
 *
 * @example
 * const lyric = resolveLyrics(
 *   { he: 'דיינו', translit: 'Dayenu', en: 'It would have been enough' },
 *   'ru'
 * )
 * // → 'It would have been enough'  (English fallback)
 */
export function resolveLyrics (
  lyrics: MultilingualLyrics,
  lang: LanguageCode,
): string {
  // 1. Exact language match
  if (lyrics[lang]) return lyrics[lang]!

  // 2. English fallback
  if (lyrics.en) return lyrics.en

  // 3. Transliteration fallback (Latin script, readable by all)
  if (lyrics.translit) return lyrics.translit

  // 4. First available non-empty string
  const first = Object.values(lyrics).find(v => typeof v === 'string' && v.length > 0)
  return first ?? ''
}

// ---------------------------------------------------------------------------
// Factory helper
// ---------------------------------------------------------------------------

/**
 * Create a language-bound lyrics resolver.
 *
 * Useful when you need to resolve many lyrics lines without passing the
 * language code every time, e.g. inside a render loop.
 *
 * @param lang - The active language code (from `useI18n().language`).
 * @returns    A resolver function `(lyrics) => string`.
 *
 * @example
 * // Inside a React component:
 * const { language } = useI18n()
 * const resolve = createLyricsResolver(language)
 *
 * songLines.map(line => resolve(line.lyrics))
 */
export function createLyricsResolver (
  lang: LanguageCode,
): (lyrics: MultilingualLyrics) => string {
  return (lyrics: MultilingualLyrics) => resolveLyrics(lyrics, lang)
}

// ---------------------------------------------------------------------------
// React hook helper (thin wrapper – keeps React out of the core file)
// ---------------------------------------------------------------------------

/**
 * Detect which lyric variant keys are available in a lyrics object.
 * Useful for building a language-switcher limited to available translations.
 *
 * @param lyrics - The multilingual lyrics object.
 * @returns      Array of language codes (and 'translit') that have a value.
 *
 * @example
 * getAvailableVariants({ he: 'דיינו', translit: 'Dayenu' })
 * // → ['he', 'translit']
 */
export function getAvailableVariants (lyrics: MultilingualLyrics): string[] {
  return Object.entries(lyrics)
    .filter(([, v]) => typeof v === 'string' && v.length > 0)
    .map(([k]) => k)
}
