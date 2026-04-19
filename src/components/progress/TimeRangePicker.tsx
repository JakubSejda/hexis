'use client'

const OPTIONS = [
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '6m', value: 180 },
  { label: '1y', value: 365 },
] as const

type Props = {
  value: number
  onChange: (days: number) => void
}

export function TimeRangePicker({ value, onChange }: Props) {
  return (
    <div role="tablist" className="bg-surface flex gap-1 rounded-lg p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={
            'flex-1 rounded-md px-3 py-1.5 text-center text-sm transition-colors ' +
            (value === o.value
              ? 'bg-primary text-background font-semibold'
              : 'text-muted hover:text-foreground')
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
