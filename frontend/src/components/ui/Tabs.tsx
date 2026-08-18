import { useId, useState, type ReactNode } from 'react'

export interface TabItem {
  id: string
  label: ReactNode
  content?: ReactNode
  disabled?: boolean
}

export interface TabsProps {
  items: TabItem[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  className?: string
}

export function Tabs({ items, value, defaultValue, onChange, className = '' }: TabsProps) {
  const generatedId = useId()
  const [internalValue, setInternalValue] = useState(defaultValue ?? items[0]?.id ?? '')
  const activeValue = value ?? internalValue
  const active = items.find((item) => item.id === activeValue)

  const select = (id: string) => {
    if (value === undefined) setInternalValue(id)
    onChange?.(id)
  }

  return (
    <div className={className}>
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)]">
        {items.map((item) => {
          const selected = item.id === activeValue
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${generatedId}-${item.id}`}
              disabled={item.disabled}
              onClick={() => select(item.id)}
              className={`relative shrink-0 px-3 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'}`}
            >
              {item.label}
              {selected && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--color-accent)]" />}
            </button>
          )
        })}
      </div>
      {active?.content !== undefined && (
        <div id={`${generatedId}-${active.id}`} role="tabpanel" className="pt-4">
          {active.content}
        </div>
      )}
    </div>
  )
}
