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
    <div role="tablist" className="hud-clip-sm bg-surface flex gap-1 p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={
            'hud-clip-sm flex-1 px-3 py-1.5 text-center font-mono text-sm transition-colors ' +
            (value === o.value
              ? 'bg-system text-background font-semibold'
              : 'text-muted hover:text-foreground')
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
