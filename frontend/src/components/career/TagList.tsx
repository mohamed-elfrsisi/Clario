import { Badge } from '../ui/Badge'

interface TagListProps {
  items: string[]
  variant?: 'neutral' | 'accent' | 'info' | 'success'
  emptyLabel?: string
}

export function TagList({ items, variant = 'neutral', emptyLabel = 'None added yet' }: TagListProps) {
  if (items.length === 0) {
    return <span className="text-sm text-[var(--color-text-muted)]">{emptyLabel}</span>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} variant={variant}>{item}</Badge>
      ))}
    </div>
  )
}
