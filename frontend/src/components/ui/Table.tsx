import type { ReactNode } from 'react'

interface TableProps {
  children: ReactNode
  className?: string
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto border border-slate-200 bg-white ${className}`}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  )
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-slate-200 bg-slate-50/80">
      <tr>{children}</tr>
    </thead>
  )
}

export function TableHeaderCell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${className}`}>
      {children}
    </th>
  )
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>
}

export function TableRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <tr className={`transition-colors hover:bg-slate-50/60 ${className}`}>
      {children}
    </tr>
  )
}

export function TableCell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <td className={`px-3 py-2.5 text-slate-700 ${className}`}>
      {children}
    </td>
  )
}
