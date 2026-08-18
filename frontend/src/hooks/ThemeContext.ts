import { createContext } from 'react'
import type { ResolvedTheme, ThemeMode } from './ThemeProvider'

export interface ThemeContextValue {
  mode: ThemeMode
  resolvedTheme: ResolvedTheme
  isDark: boolean
  setMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
