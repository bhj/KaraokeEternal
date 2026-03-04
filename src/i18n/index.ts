/**
 * Karaoke Eternal – i18n module
 *
 * Lightweight, dependency-free internationalization system.
 * Translations live in src/i18n/locales/<lang>.json.
 * Adding a new language requires only:
 *   1. Creating src/i18n/locales/<lang>.json
 *   2. Adding an entry to LANGUAGES and importing the file below.
 */

import { createContext, useContext } from 'react'
import en from './locales/en.json'
import ru from './locales/ru.json'
import he from './locales/he.json'

// ---------------------------------------------------------------------------
// Supported languages
// ---------------------------------------------------------------------------

export type LanguageCode = 'en' | 'ru' | 'he'

export interface LanguageMeta {
  code: LanguageCode
  /** Native name shown in the selector */
  label: string
  /** 'ltr' | 'rtl' – used to set document direction */
  dir: 'ltr' | 'rtl'
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ru', label: 'Русский', dir: 'ltr' },
  { code: 'he', label: 'עברית',   dir: 'rtl' },
]

// ---------------------------------------------------------------------------
// Translation catalogue
// ---------------------------------------------------------------------------

type TranslationDict = typeof en

const catalogue: Record<LanguageCode, TranslationDict> = { en, ru, he }

// ---------------------------------------------------------------------------
// Nested key helper
// ---------------------------------------------------------------------------

type DeepValue<T> = T extends string
  ? string
  : T extends Record<string, unknown>
    ? { [K in keyof T]: DeepValue<T[K]> }
    : never

/** Resolve "section.key" into the translation string, falling back to English. */
function resolve(dict: TranslationDict, section: string, key: string): string {
  const sec = (dict as Record<string, Record<string, string>>)[section]
  if (sec && key in sec) return sec[key]

  // fallback to English
  const enSec = (en as Record<string, Record<string, string>>)[section]
  return enSec?.[key] ?? `[${section}.${key}]`
}

// ---------------------------------------------------------------------------
// Translator function
// ---------------------------------------------------------------------------

export type TFunction = (section: string, key: string) => string

function createTranslator(lang: LanguageCode): TFunction {
  const dict = catalogue[lang] ?? en
  return (section: string, key: string) => resolve(dict, section, key)
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'ke_language'

export function getStoredLanguage(): LanguageCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null
    if (stored && stored in catalogue) return stored
  } catch {
    // localStorage unavailable
  }
  return 'en'
}

export function storeLanguage(lang: LanguageCode): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// React context
// ---------------------------------------------------------------------------

export interface I18nContextValue {
  language: LanguageCode
  t: TFunction
  setLanguage: (lang: LanguageCode) => void
}

export const I18nContext = createContext<I18nContextValue>({
  language: 'en',
  t: createTranslator('en'),
  setLanguage: () => undefined,
})

/** Primary hook – call inside any functional component to get the translator. */
export function useT(): TFunction {
  return useContext(I18nContext).t
}

/** Full context hook – use when you also need language/setLanguage. */
export function useI18n(): I18nContextValue {
  return useContext(I18nContext)
}

export { createTranslator }
