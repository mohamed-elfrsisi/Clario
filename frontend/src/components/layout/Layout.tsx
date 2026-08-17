import { type ReactNode } from 'react'
import { AppShell } from './AppShell'

export function Layout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}
