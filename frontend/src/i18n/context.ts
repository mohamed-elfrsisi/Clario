import { createContext } from 'react'
import type { Language } from './index'

export interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
  dir: 'ltr' | 'rtl'
}

export const I18nContext = createContext<I18nContextValue | null>(null)
