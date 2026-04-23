'use client'
import { useId } from 'react'

type Props = {
  value: number | null
  onChange: (v: number | null) => void
  step?: number
  min?: number
  max?: number
  placeholder?: string
  suffix?: string
}

export function NumberInput({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  placeholder,
  suffix,
}: Props) {
  const id = useId()
  const handle = (delta: number) => {
    const current = value ?? 0
    const next = Math.max(min, Math.min(max, Math.round((current + delta) * 100) / 100))
    onChange(next)
  }
  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        aria-label="snížit"
        className="bg-border text-foreground active:bg-primary h-11 w-11 rounded-lg"
        onClick={() => handle(-step)}
      >
        −
      </button>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value
          onChange(v === '' ? null : Number(v))
        }}
        className="border-border bg-background text-foreground h-11 w-20 rounded-lg border text-center"
        step={step}
        min={min}
        max={max}
      />
      {suffix ? <span className="text-muted text-xs">{suffix}</span> : null}
      <button
        type="button"
        aria-label="zvýšit"
        className="bg-border text-foreground active:bg-primary h-11 w-11 rounded-lg"
        onClick={() => handle(step)}
      >
        +
      </button>
    </div>
  )
}
