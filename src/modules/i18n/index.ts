/**
 * i18n module barrel – re-exports the full public surface of the core module.
 *
 * This file exists so that the webpack/tsconfig alias `'i18n'` can point to
 * this directory and all existing `import { … } from 'i18n'` calls continue
 * to resolve correctly after src/i18n/ was removed.
 */

export {
  LANGUAGES,
  I18nContext,
  useT,
  useI18n,
  createTranslator,
  getStoredLanguage,
  storeLanguage,
  type LanguageCode,
  type LanguageMeta,
  type TFunction,
  type I18nContextValue,
} from './core'
