import { createContext } from 'react'

export interface Toast {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

export interface ToastContextType {
  add: (type: Toast['type'], message: string) => void
}

export const ToastContext = createContext<ToastContextType | null>(null)
