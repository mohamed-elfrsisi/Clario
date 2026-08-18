import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, type I18nContextValue } from './context'

export type Language = 'en' | 'ar'

const STORAGE_KEY = 'clario-language'

import { translations, phraseTranslations } from './resources'



function getInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'ar' || stored === 'en') return stored
  return navigator.language.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)
  const dir = language === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = dir
    localStorage.setItem(STORAGE_KEY, language)
  }, [language, dir])

  const value = useMemo<I18nContextValue>(() => ({
    language,
    dir,
    setLanguage: (next) => setLanguageState(next),
    t: (key) => {
      const catalog = translations[language] as Record<string, string>
      const englishCatalog = translations.en as Record<string, string>
      return catalog[key] ?? englishCatalog[key] ?? (language === 'ar' ? phraseTranslations[key] ?? key : key)
    },
  }), [language, dir])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

