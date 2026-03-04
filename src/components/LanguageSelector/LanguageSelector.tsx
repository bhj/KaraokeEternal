import React from 'react'
import { useI18n, LANGUAGES, type LanguageCode } from 'i18n'
import styles from './LanguageSelector.css'

const LanguageSelector = () => {
  const { language, setLanguage } = useI18n()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as LanguageCode)
  }

  return (
    <select
      className={styles.selector}
      value={language}
      onChange={handleChange}
      aria-label='Language / Язык / שפה'
      title='Language / Язык / שפה'
    >
      {LANGUAGES.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  )
}

export default LanguageSelector
