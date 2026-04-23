'use client'
import { useId, type ReactNode } from 'react'

type Props = {
  value: number | null
  onChange: (v: number | null) => void
  step?: number
  min?: number
  max?: number
  placeholder?: string
  suffix?: string
  label?: string
  hint?: string
  error?: string
}

export function NumberInput({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  placeholder,
  suffix,
  label,
  hint,
  error,
}: Props) {
  const id = useId()
  const descriptionId = `${id}-desc`
  const handle = (delta: number) => {
    const current = value ?? 0
    const next = Math.max(min, Math.min(max, Math.round((current + delta) * 100) / 100))
    onChange(next)
  }

  const core: ReactNode = (
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
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error || hint ? descriptionId : undefined}
        className={
          'bg-background text-foreground h-11 w-20 rounded-lg border text-center ' +
          (error ? 'border-danger' : 'border-border')
        }
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

  if (!label && !hint && !error) {
    return core
  }

  return (
    <label htmlFor={id} className="flex flex-col gap-1">
      {label ? <span className="text-muted text-xs font-medium">{label}</span> : null}
      {core}
      {error ? (
        <span id={descriptionId} className="text-danger text-xs">
          {error}
        </span>
      ) : hint ? (
        <span id={descriptionId} className="text-muted text-xs">
          {hint}
        </span>
      ) : null}
    </label>
  )
}
