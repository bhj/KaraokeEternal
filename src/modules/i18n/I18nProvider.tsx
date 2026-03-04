import React, { useState, useEffect, useCallback } from 'react'
import {
  I18nContext,
  LANGUAGES,
  createTranslator,
  getStoredLanguage,
  storeLanguage,
  type LanguageCode,
} from './core'

interface I18nProviderProps {
  children: React.ReactNode
}

const I18nProvider = ({ children }: I18nProviderProps) => {
  const [language, setLanguageState] = useState<LanguageCode>(getStoredLanguage)

  const setLanguage = useCallback((lang: LanguageCode) => {
    storeLanguage(lang)
    setLanguageState(lang)
  }, [])

  // Keep <html dir> and <html lang> in sync for accessibility and RTL support
  useEffect(() => {
    const meta = LANGUAGES.find(l => l.code === language)
    if (meta) {
      document.documentElement.setAttribute('lang', language)
      document.documentElement.setAttribute('dir', meta.dir)
    }
  }, [language])

  return (
    <I18nContext.Provider value={{ language, t: createTranslator(language), setLanguage }}>
      {children}
    </I18nContext.Provider>
  )
}

export default I18nProvider
