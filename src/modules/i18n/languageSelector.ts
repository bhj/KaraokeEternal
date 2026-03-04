/**
 * languageSelector – public API for language-selector UI integration.
 *
 * Re-exports the LanguageSelector drop-down component and the i18n hooks
 * so consumers can import everything they need from this single module
 * path without knowing the internal directory layout.
 *
 * Usage (React component):
 *   import { LanguageSelector } from 'modules/i18n/languageSelector'
 *   // Mount anywhere in the component tree inside I18nProvider
 *   <LanguageSelector />
 *
 * Usage (hook inside any functional component):
 *   import { useI18n } from 'modules/i18n/languageSelector'
 *   const { language, setLanguage, t } = useI18n()
 */

export { default as LanguageSelector } from 'components/LanguageSelector/LanguageSelector'
export { useI18n, useT, LANGUAGES } from './core'
export type { LanguageCode, LanguageMeta, I18nContextValue, TFunction } from './core'
