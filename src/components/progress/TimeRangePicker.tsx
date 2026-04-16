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
    <div role="tablist" className="flex gap-1 rounded-lg bg-[#141a22] p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={
            'flex-1 rounded-md px-3 py-1.5 text-center text-sm transition-colors ' +
            (value === o.value
              ? 'bg-[#10b981] font-semibold text-[#0a0e14]'
              : 'text-[#6b7280] hover:text-[#e5e7eb]')
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
